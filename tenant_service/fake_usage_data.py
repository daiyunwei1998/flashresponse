import requests
import random
from datetime import datetime, timedelta

# Define the tenant ID
tenant_id = "tenant_95"

# Base URL of the API
# base_url = "http://15.152.132.208:8000/api/v1/usage/"
base_url = "http://203.204.185.67:8000/api/v1/usage/"

# Corrected per token price: $0.005 per 1,000 tokens
per_token_price = 0.000005  # 0.005 / 1000

# Function to generate random usage data for September 1-26
def generate_usage_data(start_date, end_date):
    current_date = start_date
    usage_data_list = []

    while current_date <= end_date:
        tokens_used = random.randint(10000, 100000)  # Random tokens between 10,000 and 100,000
        usage_data_list.append({
            "date": current_date.strftime('%Y-%m-%dT00:00:00Z'),
            "tokens_used": tokens_used,
            "per_token_price": per_token_price
        })
        current_date += timedelta(days=1)
    
    return usage_data_list

# Define start and end date for September 1-26, 2024
start_date = datetime(2024, 10, 1)
end_date = datetime(2024, 10, 14)

# Generate random usage data
usage_data_list = generate_usage_data(start_date, end_date)

# Iterate over each usage record and send a POST request
for usage in usage_data_list:
    response = requests.post(
        f"{base_url}?tenant_id={tenant_id}",
        json=usage
    )
    if response.status_code == 201:
        print(f"Successfully inserted usage for {usage['date']}: {usage['tokens_used']} tokens")
    else:
        print(f"Failed to insert usage for {usage['date']}: {response.text}")
