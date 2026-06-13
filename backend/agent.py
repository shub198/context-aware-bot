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

    try:
        log.info("Starting stream_async...")
        async for event in agent.stream_async(message):
            event_count += 1
            event_keys = list(event.keys()) if isinstance(event, dict) else [type(event).__name__]
            log.info("Event #%d (%.1fs): keys=%s", event_count, time.time() - t0, event_keys)

            if isinstance(event, dict):
                if "current_tool_use" in event:
                    tool_name = event["current_tool_use"].get("name")
                    if tool_name:
                        yield {"event": "tool", "data": tool_name}

                if "data" in event:
                    if not first_token:
                        log.info("First token at %.1fs", time.time() - t0)
                        first_token = True
                    chunk = str(event["data"])
                    full_response += chunk
                    yield {"event": "token", "data": chunk}

        log.info("Stream done (%.1fs, %d events, %d chars)", time.time() - t0, event_count, len(full_response))
        yield {"event": "done", "data": full_response}

    except Exception as e:
        log.error("Stream error after %.1fs: %s", time.time() - t0, e, exc_info=True)
        yield {"event": "error", "data": str(e)}
