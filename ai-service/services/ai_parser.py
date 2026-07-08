import os
import json

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def parse_invoice(text):

    prompt = f"""
You are an invoice extraction engine.

Extract the supplier details, invoice details and all products from the invoice.

If any supplier field is not present in the invoice, return an empty string for that field.

Return ONLY valid JSON.

Schema:

{{
  "supplier": {{
    "name": "",
    "email": "",
    "phone": "",
    "gstNumber": "",
    "address": ""
  }},
  "invoiceNumber": "",
  "invoiceDate": "",
  "products": [
    {{
      "name": "",
      "quantity": 0,
      "purchasePrice": 0,
      "gstRate": 0
    }}
  ]
}}


Invoice:

{text}
"""

    try:

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        return json.loads(response.text)

    except Exception as e:

        raise Exception(f"Invoice parsing failed: {str(e)}")