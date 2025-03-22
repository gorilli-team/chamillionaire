import json
import asyncio
import os

import nest_asyncio
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from dotenv import find_dotenv, load_dotenv

# Allows async function calls
nest_asyncio.apply()

dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

openai_api_key = os.getenv("OPENAI_API_KEY")

# Creates an async OpenAI client
client = AsyncOpenAI(api_key=openai_api_key)
model = "gpt-4o"

# List of tools available to the LLM
# We only define the tool for retrieving the events
# All the other LLM calls are without tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "retrieve_events",
            "description": "Generate a trading signal based on the events in the knowledge base.",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                },
                "required": ["question"],
                "additionalProperties": False,
            },
            "strict": True,
        },
    }
]

# Prompt that allows the LLM to recognize the need for using the search_kb tool
system_prompt_kb = "You are a helpful trading assistant that suggest the best operations on the market. You should always return a trading signal that you consider the best when the user asks."

# Messages to trigger the search_kb tool
messages_kb = [
    {"role": "system", "content": system_prompt_kb},
    {"role": "user", "content": "What trade should I do today?"},
]

# Prompt that tells the LLM the role it has in the generation of the final signal
system_prompt_final = "You are an impartial trading expert that receives raw signals from his trading students and summarized all the best information from those raw signals into one single well-crafted final signal."

# Optimized user input to extract the best trading signal 
messages_final = [
    {"role": "system", "content": system_prompt_final},
]

# --------------------------------------------------------------
# Define the async function that retrieves the events
# --------------------------------------------------------------

async def retrieve_events(question: str):
    """
    Loads all the available events from the JSON file.
    """
    with open("./events/whale-sell.json", "r") as f:
        return json.load(f)
    
    
# -------------------------------------------------------------------
# Define the response format for both the raw and the final signal
# -------------------------------------------------------------------
class GeneratedSignal(BaseModel):
    signal: str = Field(description="Either BUY or SELL.")
    symbol: str = Field(description="The symbol of the token to buy or sell.")
    quantity: float = Field(description="The quantity of the token to buy or sell.")
    confidence_score: float = Field(description="A coefficient from 0 to 1 that represents the confidence you have that the signal will generate a positive return for the user.")
    event_id: int = Field(description="The event id of the event chosen as the source for the generated signal")
    motivation: str = Field(description="A brief explanation of the signal.")


# --------------------------------------------------------------
# Final function to call
# --------------------------------------------------------------
async def generate_optimized_signal(question: str):
    """Generates an optimized signal from three raw signals in parallel"""
    completion = await client.chat.completions.create(
        model=model,
        messages=messages_kb,
        tools=tools,
    )

    for tool_call in completion.choices[0].message.tool_calls:
        name = tool_call.function.name
        args = json.loads(tool_call.function.arguments)
        messages_kb.append(completion.choices[0].message)

        if name == "retrieve_events":
            result = await retrieve_events(**args)
        else:
            return None
        
        messages_kb.append(
            {
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result),
            }
        )
    
    completion_2 = await client.beta.chat.completions.parse(
        model=model,
        messages=messages_kb,
        tools=tools,
        response_format=GeneratedSignal,
    )

    completion_3 = await client.beta.chat.completions.parse(
        model=model,
        messages=messages_kb,
        tools=tools,
        response_format=GeneratedSignal,
    )

    completion_4 = await client.beta.chat.completions.parse(
        model=model,
        messages=messages_kb,
        tools=tools,
        response_format=GeneratedSignal,
    )

    signal_1 = completion_2.choices[0].message.parsed
    signal_2 = completion_3.choices[0].message.parsed
    signal_3 = completion_4.choices[0].message.parsed

    final_context = f"Raw signal 1: {signal_1}; Raw signal 2: {signal_2}; Raw signal 3: {signal_3}."
    print(final_context)
    messages_final.append({
        "role": "user",
        "content": f"What's the best trade I can do today? These are the raw signals: {final_context}" 
    })

    completion_5 = await client.beta.chat.completions.parse(
        model=model,
        messages=messages_final,
        response_format=GeneratedSignal,
    )

    return completion_5

# --------------------------------------------------------------
# Test with valid example
# --------------------------------------------------------------
async def run_valid_example():
    valid_input = "What trade should I do today?"
    result = await generate_optimized_signal(valid_input)
    
    print(f"Response: {result.choices[0].message.parsed}")
    
asyncio.run(run_valid_example())