import os
import boto3
from playwright.sync_api import sync_playwright, TimeoutError
from datetime import datetime
import pandas as pd
import psycopg2
from botocore.exceptions import ClientError

# AWS credentials setup
AWS_ACCESS_KEY_ID = 'AKIATCKAMY4NZ77DVGVP'
AWS_SECRET_ACCESS_KEY = '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'
AWS_DEFAULT_REGION = 'us-east-1'

# Set up boto3 session
boto3.setup_default_session(
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_DEFAULT_REGION
)

# Redshift Serverless connection details
REDSHIFT_WORKGROUP_ENDPOINT = 'bellair.211125323547.us-east-1.redshift-serverless.amazonaws.com'
REDSHIFT_PORT = 5439
REDSHIFT_DB = 'dev'

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

def process_dataframe(df):
    df['Cost'] = df['Cost'].apply(safe_currency_to_float)
    df['Price'] = df['Price'].apply(safe_currency_to_float)
    return df

# Redshift operations
def get_redshift_credentials():
    client = boto3.client('redshift-serverless', region_name=AWS_DEFAULT_REGION)
    try:
        response = client.get_credentials(
            workgroupName='bellair',
            durationSeconds=3600  # Credentials valid for 1 hour
        )
        return response['dbUser'], response['dbPassword']
    except ClientError as e:
        print(f"Error getting Redshift credentials: {e}")
        return None, None

def upload_to_redshift(df):
    db_user, db_password = get_redshift_credentials()
    if not db_user or not db_password:
        print("Failed to get Redshift credentials")
        return

    conn = psycopg2.connect(
        host=REDSHIFT_WORKGROUP_ENDPOINT,
        port=REDSHIFT_PORT,
        dbname=REDSHIFT_DB,
        user=db_user,
        password=db_password
    )
    cursor = conn.cursor()

    try:
        # Prepare the data for insertion
        data = [tuple(x) for x in df.to_numpy()]
        
        # Generate the INSERT statement
        columns = ', '.join(df.columns)
        placeholders = ', '.join(['%s'] * len(df.columns))
        insert_query = f"INSERT INTO bellair.trip-finances ({columns}) VALUES ({placeholders})"
        
        # Execute the INSERT statement
        cursor.executemany(insert_query, data)
        conn.commit()
        
        print(f"Data successfully uploaded to Redshift table: bellair.trip_finances")
    except Exception as e:
        conn.rollback()
        print(f"An error occurred while uploading to Redshift: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# Main function
def lambda_handler():
    file_type = 'trip_finance'
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

            # Upload to Redshift
            upload_to_redshift(df)

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