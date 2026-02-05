
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    url = os.getenv("MONGODB_URL")
    print(f"Testing connection to: {url.split('@')[-1]}") # Hide credentials
    
    try:
        client = AsyncIOMotorClient(url)
        # The is_master command is cheap and does not require auth
        await client.admin.command('ismaster')
        print("✅ Connection successful!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
