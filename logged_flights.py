import os
import boto3
from playwright.sync_api import sync_playwright, TimeoutError
from datetime import datetime
import pandas as pd
from decimal import Decimal, InvalidOperation
import glob
import math
import concurrent.futures
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
def safe_to_float(value):
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return None
    return None

def float_to_decimal(value):
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    if isinstance(value, float) and math.isinf(value):
        return Decimal(str(1e30))
    try:
        return Decimal(str(value))
    except InvalidOperation:
        return None

def process_dataframe(df):
    logger.info(f"Original DataFrame shape: {df.shape}")
    logger.info(f"Original DataFrame columns: {df.columns}")
    
    # Create the new Orig_Dest_StartZ column
    df['Orig_Dest_StartZ'] = df['Orig'] + '#' + df['Dest'] + '#' + df['Start Z']
    
    # Convert numeric columns to float
    numeric_columns = ['Pax', 'Block hrs', 'Flight hrs', 'Hobbs hrs']
    for col in numeric_columns:
        if col in df.columns:
            df[col] = df[col].apply(safe_to_float)
        else:
            logger.warning(f"Column {col} not found in DataFrame")
    
    logger.info(f"Processed DataFrame shape: {df.shape}")
    logger.info(f"Sample of processed DataFrame:\n{df.head()}")
    return df

def prepare_items_for_dynamodb(df):
    items = []
    for _, row in df.iterrows():
        item = {}
        for column, value in row.items():
            if isinstance(value, float):
                item[column] = float_to_decimal(value)
            elif pd.isna(value):
                item[column] = None
            else:
                item[column] = str(value)  # Convert all non-numeric values to string
        items.append(item)
    logger.info(f"Prepared {len(items)} items for DynamoDB")
    return items

def upload_to_dynamodb(items):
    dynamodb = boto3.resource('dynamodb', 
                              aws_access_key_id=AWS_ACCESS_KEY_ID,
                              aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                              region_name=AWS_DEFAULT_REGION)
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)
    
    with table.batch_writer() as batch:
        for item in items:
            try:
                batch.put_item(Item=item)
            except Exception as e:
                logger.error(f"Error uploading item to DynamoDB: {e}")
                logger.error(f"Problematic item: {item}")

# Main function
def lambda_handler():
    file_type = 'logged_flights'
    start_date = '01/01/2023'
    end_date = '01/31/2023'
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
            page.wait_for_timeout(10000)

            # Download Excel
            page.goto(excel_url, timeout=10000)
            page.wait_for_timeout(30000)
            with page.expect_download() as download_info:
                page.click(".buttons-excel")
            download = download_info.value
            file_path = os.path.join('/tmp', download.suggested_filename)
            download.save_as(file_path)
            logger.info(f"File downloaded to {file_path}")

            # Process Excel file
            df = pd.read_excel(file_path)
            logger.info(f"Excel file read. Shape: {df.shape}")
            df = process_dataframe(df)
            
            # Check for duplicates
            duplicates = df[df.duplicated(subset=['Trip', 'Orig_Dest_StartZ'], keep=False)]
            if not duplicates.empty:
                logger.warning(f"Found {len(duplicates)} duplicate entries for Trip and Orig_Dest_StartZ combinations")
                logger.warning("Sample duplicates:\n", duplicates.head())

            items = prepare_items_for_dynamodb(df)

            # Upload to DynamoDB in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                chunk_size = 100
                chunks = [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]
                list(executor.map(upload_to_dynamodb, chunks))  # Use list() to ensure all tasks complete
            
            # Verify data in DynamoDB
            dynamodb = boto3.resource('dynamodb', 
                                    aws_access_key_id=AWS_ACCESS_KEY_ID,
                                    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                                    region_name=AWS_DEFAULT_REGION)
            table = dynamodb.Table(DYNAMODB_TABLE_NAME)

            # for item in items:
            #     try:
            #         table.put_item(Item=item)
            #     except Exception as e:
            #         logger.error(f"Error uploading item to DynamoDB: {str(e)}")
            #         logger.error(f"Problematic item: {item}")
            #         logger.error(f"Trip type: {type(item['Trip'])}, Orig_Dest_StartZ type: {type(item['Orig_Dest_StartZ'])}")
            #         logger.error(f"Trip value: '{item['Trip']}', Orig_Dest_StartZ value: '{item['Orig_Dest_StartZ']}'")

            logger.info(f"Data upload to DynamoDB table {DYNAMODB_TABLE_NAME} completed")


            item_count = table.item_count
            logger.info(f"Items in DynamoDB table after upload: {item_count}")

            # Clean up
            os.remove(file_path)

        except Exception as e:
            logger.error(f"An error occurred: {str(e)}", exc_info=True)
        finally:
            browser.close()

    return {
        'statusCode': 200,
        'body': 'Process completed'
    }

lambda_handler()
