import os

from dotenv import load_dotenv

from google import genai

from google.genai import types

from google.genai import errors

#only use this line when you are using the .env for api

load_dotenv()

#direct api key in code

#api_key2=""

#if you are using the .env file for api key, uncomment the following line

api_key=os.getenv("GEMINI_API_KEY")

#checking the api key is provided or not, if not provided then raise an error

if not api_key:

    raise ValueError("GEMINI_API_KEY is missing from .env")

#call api

client=genai.Client(

    api_key=api_key,

    http_options=types.HttpOptions(

        timeout=30000

    )

)

try:

    print("Calling Gemini API...")

    response = client.models.generate_content(

        model="gemini-3.5-flash-lite",

        contents="Explain Python in simple words."

    )

    print("\nResponse:")

    print(response.text)

 

except Exception as e:

    print(f"\nGemini API error: {e}")




