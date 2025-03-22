import json
import os
import requests
from dotenv import find_dotenv, load_dotenv

from openai import OpenAI
from pydantic import BaseModel, Field

dotenv_path = find_dotenv()
load_dotenv(dotenv_path)

openai_api_key = os.getenv("OPENAI_API_KEY")
backend_url = os.getenv("BACKEND_URL")

client = OpenAI(api_key=openai_api_key)

"""
docs: https://platform.openai.com/docs/guides/function-calling
"""

# --------------------------------------------------------------
# Define the knowledge base retrieval tool
# --------------------------------------------------------------


def search_kb(question: str):
    """
    Fetches the last 24h of token prices from the API.
    """
    try:
        response = requests.get(f"{backend_url}/api/token-prices/last24h")
        response.raise_for_status()  # Raise an error for non-2xx responses
        return response.json()
    except requests.RequestException as e:
        return {"error": f"Failed to fetch token prices: {str(e)}"}



# --------------------------------------------------------------
# Step 1: Call model with search_kb tool defined
# --------------------------------------------------------------

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_kb",
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

system_prompt = "You are a helpful trading assistant that suggest the best operations on the market. You should always return a trading signal that you consider the best when the user asks."

messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": "What trade should I do today?"},
]

completion = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
)

# --------------------------------------------------------------
# Step 2: Model decides to call function(s)
# --------------------------------------------------------------

completion.model_dump()

# --------------------------------------------------------------
# Step 3: Execute search_kb function
# --------------------------------------------------------------


def call_function(name, args):
    if name == "search_kb":
        return search_kb(**args)


for tool_call in completion.choices[0].message.tool_calls:
    name = tool_call.function.name
    args = json.loads(tool_call.function.arguments)
    messages.append(completion.choices[0].message)

    result = call_function(name, args)
    messages.append(
        {"role": "tool", "tool_call_id": tool_call.id, "content": json.dumps(result)}
    )

# --------------------------------------------------------------
# Step 4: Supply result and call model again
# --------------------------------------------------------------


class GeneratedSignal(BaseModel):
    signal: str = Field(description="Either BUY or SELL.")
    symbol: str = Field(description="The symbol of the token to buy or sell.")
    quantity: float = Field(description="The percentage of the user's portfolio to invest in the token.")
    confidence_score: float = Field(description="A coefficient from 0 to 1 that represents the confidence you have that the signal will generate a positive return for the user.")
    event_id: int = Field(description="The event id of the event chosen as the source for the generated signal")
    motivation: str = Field(description="A brief explanation of the signal.")


completion_2 = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    response_format=GeneratedSignal,
)

# --------------------------------------------------------------
# Step 5: Check model response
# --------------------------------------------------------------

final_response = completion_2.choices[0].message.parsed
print(final_response)

# --------------------------------------------------------------
# Step 6: Save the response to the database
# --------------------------------------------------------------

def save_to_database(signal_data):
    """
    Save the generated trading signal to the database via API.
    
    Args:
        signal_data: The GeneratedSignal object to save
    
    Returns:
        dict: Response from the API
    """
    try:
        # Convert Pydantic model to dict
        if isinstance(signal_data, BaseModel):
            # Convert to dict and transform keys to match API expectations
            signal_dict = {
                "signal": signal_data.signal,
                "symbol": signal_data.symbol,
                "quantity": signal_data.quantity,
                "confidenceScore": signal_data.confidence_score,  # camelCase in API
                "eventId": signal_data.event_id,                  # camelCase in API
                "motivation": signal_data.motivation
            }
        else:
            # Handle dict input and ensure keys match API expectations
            signal_dict = {
                "signal": signal_data.get("signal"),
                "symbol": signal_data.get("symbol"),
                "quantity": signal_data.get("quantity"),
                "confidenceScore": signal_data.get("confidence_score"),  # transform to camelCase
                "eventId": signal_data.get("event_id"),                  # transform to camelCase
                "motivation": signal_data.get("motivation")
            }
            
        # Make POST request to backend API (correct endpoint from your code)
        response = requests.post(
            f"{backend_url}/api/signals",
            json=signal_dict,
            headers={"Content-Type": "application/json"}
        )
        
        response.raise_for_status()
        
        return {
            "success": True,
            "message": "Trading signal saved successfully",
            "data": response.json()
        }
    except requests.RequestException as e:
        error_message = f"Failed to save trading signal: {str(e)}"
        print(error_message)
        return {
            "success": False,
            "message": error_message
        }

# Save the generated signal to the database
save_result = save_to_database(final_response)
print(f"Database save result: {save_result}")