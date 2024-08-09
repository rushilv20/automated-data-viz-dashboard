import os
import boto3
from playwright.sync_api import sync_playwright, TimeoutError
from datetime import datetime
import pandas as pd
from decimal import Decimal, InvalidOperation
import math
import concurrent.futures

# AWS and credentials setup
AWS_ACCESS_KEY_ID = 'AKIATCKAMY4NZ77DVGVP'
AWS_SECRET_ACCESS_KEY = '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'
AWS_DEFAULT_REGION = 'us-east-1'
DYNAMODB_TABLE_NAME = 'Invoices'

# Portal credentials
USERNAME = "rvegada@flybellair.com"
PASSWORD = "Rushil@201220"

# URL generation
def encode_date(date_string):
    return date_string.replace('/', '%2F')

def generate_url(file_type, start_date, end_date):
    base_url = "https://portal.jetinsight.com/"
    encoded_start_date = encode_date(start_date)
    encoded_end_date = encode_date(end_date)
    
    url_templates = {
        'logged_flights': f"{base_url}analytics/logged_flights?search_aircraft=all_active&search=&search_startdate={encoded_start_date}&search_enddate={encoded_end_date}&query_builder_json=",
        'trip_finance': f"{base_url}analytics/trip_finance?stage=&search=&date_to_filter=depart_date_zulu&search_startdate={encoded_start_date}&search_enddate={encoded_end_date}&query_builder_json=",
        'quickbooks_desktop_export': f"{base_url}accounting/quickbooks_desktop_export?date_to_filter=depart_date_zulu&search=&search_startdate={encoded_start_date}&search_enddate={encoded_end_date}"
    }
    
    return url_templates.get(file_type, "Invalid file type selected.")

# Data processing
def safe_currency_to_float(value):
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.replace('$', '').replace(',', ''))
        except ValueError:
            return None
    return None

def float_to_decimal(value):
    if value is None or math.isnan(value):
        return None
    if math.isinf(value):
        return Decimal(str(1e30))
    try:
        return Decimal(str(value))
    except InvalidOperation:
        return None

def process_dataframe(df):
    df['Price'] = df['Price'].apply(safe_currency_to_float)
    return df

# DynamoDB operations
def upload_to_dynamodb(items):
    dynamodb = boto3.resource('dynamodb', 
                              aws_access_key_id=AWS_ACCESS_KEY_ID,
                              aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                              region_name=AWS_DEFAULT_REGION)
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)
    
    with table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)

def prepare_items_for_dynamodb(df):
    items = []
    for _, row in df.iterrows():
        item = {
            'Trip': row['Trip'],
            'Booking#': row['Booking #'],
            'Customer': row['Customer'],
            'TripStartZ': row['Trip start Z'],
            'Aircraft': row['Aircraft'],
            'Orig': row['Orig'],
            'Dest': row['Dest'],
            'Status': row['Status'],
            'Price': float_to_decimal(row['Price'])
        }
        items.append(item)
    return items

# Main function
def lambda_handler():
    file_type = 'quickbooks_desktop_export' #trip_finance, logged_flights, quickbooks_desktop_export
    start_date = '07/01/2024'
    end_date = '08/09/2024'
    login_url = "https://portal.jetinsight.com/users/sign_in"
    excel_url = generate_url(file_type, start_date, end_date)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # Login
            page.goto(login_url, timeout=30000)
            page.fill("#user_email", USERNAME)
            page.click("button[type='submit']")
            page.wait_for_timeout(10000)
            page.fill("#user_password", PASSWORD)
            page.click("button[type='submit']")
            page.wait_for_timeout(15000)

            # Download Excel
            page.goto(excel_url, timeout=10000)
            page.wait_for_timeout(60000)
            with page.expect_download() as download_info:
                page.click(".buttons-excel")
            download = download_info.value
            file_path = os.path.join('/tmp', download.suggested_filename)
            download.save_as(file_path)

            # Process Excel file
            df = pd.read_excel(file_path)
            df = process_dataframe(df)
            items = prepare_items_for_dynamodb(df)

            # Upload to DynamoDB in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                chunk_size = 100
                chunks = [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]
                executor.map(upload_to_dynamodb, chunks)

            print(f"Data successfully appended to DynamoDB table: {DYNAMODB_TABLE_NAME}")

            # Clean up
            os.remove(file_path)

        except Exception as e:
            print(f"An error occurred: {str(e)}")
        finally:
            browser.close()

    return {
        'statusCode': 200,
        'body': 'Process completed successfully'
    }

lambda_handler()