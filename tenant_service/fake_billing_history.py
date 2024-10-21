import asyncio
import aiohttp
import random
from datetime import datetime
from typing import List

# Configuration
API_URL = "https://flashresponse.net/tenant/api/v1/tenants/{tenant_id}/billing-history"  # Update with your actual host and port
TENANT_IDS = ["tenant_95"]  # Replace with actual tenant IDs
PERIODS = ["2024-04", "2024-5","2024-06","2024-07", "2024-8","2024-09"]  # Example periods

# Fake Data Generation
def generate_fake_billing_data(tenant_id: str, period: str) -> dict:
    return {
        "tenant_id": tenant_id,
        "period": period,
        "tokens_used": random.randint(1000, 10000),
        "total_price": round(random.uniform(10.0, 500.0), 2),
        "invoice_url": f"https://example.com/invoices/{tenant_id}/{period}.pdf"  # Dummy URL
    }

# Asynchronous function to send POST request
async def post_billing_history(session: aiohttp.ClientSession, tenant_id: str, billing_data: dict):
    url = API_URL.format(tenant_id=tenant_id)
    try:
        async with session.post(url, json=billing_data) as response:
            if response.status == 201:
                data = await response.json()
                print(f"Successfully inserted billing history: {data}")
            else:
                error = await response.text()
                print(f"Failed to insert billing history for tenant {tenant_id}, period {billing_data['period']}: {response.status} - {error}")
    except Exception as e:
        print(f"Exception occurred for tenant {tenant_id}, period {billing_data['period']}: {e}")

# Main function to insert fake data
async def insert_fake_billing():
    async with aiohttp.ClientSession() as session:
        tasks: List[asyncio.Task] = []
        for tenant_id in TENANT_IDS:
            for period in PERIODS:
                billing_data = generate_fake_billing_data(tenant_id, period)
                task = asyncio.create_task(post_billing_history(session, tenant_id, billing_data))
                tasks.append(task)
        await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(insert_fake_billing())
