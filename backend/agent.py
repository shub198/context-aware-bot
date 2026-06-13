"""Strands Agent wired to Google Gemini with tool calling and async streaming."""

import logging
import time

from strands import Agent
from strands.models.gemini import GeminiModel

from config import GEMINI_API_KEY, MODEL_ID, SYSTEM_PROMPT
from tools.memory_tool import save_memory, search_memory, delete_memory
from tools.rag_tool import search_document

log = logging.getLogger("agent")
logging.basicConfig(level=logging.INFO)

TIMEOUT_SECONDS = 30


def _build_model() -> GeminiModel:
    return GeminiModel(
        model_id=MODEL_ID,
        client_args={"api_key": GEMINI_API_KEY},
    )


def create_agent() -> Agent:
    """Create a fresh Strands Agent with all tools registered."""
    model = _build_model()
    return Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=[save_memory, search_memory, delete_memory, search_document],
        callback_handler=None,
    )


async def stream_agent(agent: Agent, message: str):
    """Yield SSE-formatted dicts as the agent streams its response."""
    full_response = ""
    t0 = time.time()
    first_token = False
    event_count = 0
    throttle_count = 0

    try:
        log.info("Starting stream_async with model=%s", MODEL_ID)
        async for event in agent.stream_async(message):
            elapsed = time.time() - t0
            event_count += 1

            if isinstance(event, dict):
                event_keys = list(event.keys())

                if "event_loop_throttled_delay" in event:
                    throttle_count += 1
                    log.warning("Throttled #%d at %.1fs", throttle_count, elapsed)
                    if throttle_count >= 2:
                        log.error("Too many throttle retries — aborting (API key or quota issue)")
                        yield {"event": "error", "data": "API rate limit or invalid key. Check your GEMINI_API_KEY and quota."}
                        return

                if "force_stop" in event:
                    reason = event.get("force_stop_reason", "unknown")
                    log.error("Agent force-stopped: %s", reason)
                    yield {"event": "error", "data": f"Request failed: {reason}"}
                    return

                if elapsed > TIMEOUT_SECONDS and not first_token:
                    log.error("No response tokens after %ds — aborting", TIMEOUT_SECONDS)
                    yield {"event": "error", "data": "Request timed out. The AI model may be overloaded or the API key is invalid."}
                    return

                if "current_tool_use" in event:
                    tool_name = event["current_tool_use"].get("name")
                    if tool_name:
                        yield {"event": "tool", "data": tool_name}

                if "data" in event:
                    if not first_token:
                        log.info("First token at %.1fs", elapsed)
                        first_token = True
                    chunk = str(event["data"])
                    full_response += chunk
                    yield {"event": "token", "data": chunk}

        log.info("Stream done (%.1fs, %d events, %d chars)", time.time() - t0, event_count, len(full_response))
        yield {"event": "done", "data": full_response}

    except Exception as e:
        log.error("Stream error after %.1fs: %s", time.time() - t0, e, exc_info=True)
        err_str = str(e)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            yield {"event": "error", "data": "API quota exceeded. Please wait a minute or check your Gemini API plan."}
        elif "403" in err_str or "PERMISSION_DENIED" in err_str:
            yield {"event": "error", "data": "Invalid API key or missing permissions. Check your GEMINI_API_KEY."}
        else:
            yield {"event": "error", "data": err_str}
