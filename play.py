import os
import boto3
import glob
from playwright.sync_api import sync_playwright, TimeoutError
from datetime import datetime

# Your credentials
username = ""
password = ""

# Set AWS credentials
os.environ['AWS_ACCESS_KEY_ID'] = 'AKIATCKAMY4NZ77DVGVP'
os.environ['AWS_SECRET_ACCESS_KEY'] = '0TR8IeSZ1F5uT7jl7SKP9PLrPUCfe96ykZV8GL8w'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

# S3 bucket name
bucket_name = 'bellairdatabucket'
def encode_date(date_string):
    return date_string.replace('/', '%2F')

def generate_url(file_type, start_date, end_date):
    base_url = "https://portal.jetinsight.com/"
    
    encoded_start_date = encode_date(start_date)
    encoded_end_date = encode_date(end_date)

    if file_type == 'logged_flights':
        url = f"{base_url}analytics/logged_flights?search_aircraft=all_active&search=&search_startdate={encoded_start_date}&search_enddate={encoded_end_date}&query_builder_json="
    elif file_type == 'trip_finance':
        url = f"{base_url}analytics/trip_finance?stage=&search=&date_to_filter=depart_date_zulu&search_startdate={encoded_start_date}&search_enddate={encoded_end_date}&query_builder_json="
    elif file_type == 'quickbooks_desktop_export':
        url = f"{base_url}accounting/quickbooks_desktop_export?date_to_filter=depart_date_zulu&search=&search_startdate={encoded_start_date}&search_enddate={encoded_end_date}"
    else:
        url = "Invalid file type selected."

    return url

# Variables for input (you can modify these as needed)
file_type = 'trip_finance'  # Options: 'logged_flights', 'trip_finance', 'quickbooks_desktop_export'
start_date = '06/01/2024'
end_date = '06/30/2024'

# Generate and print the URL
url = generate_url(file_type, start_date, end_date)

# URLs
login_url = "https://portal.jetinsight.com/users/sign_in"
excel_url = url

import time

def lambda_handler():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # Go to login page
            page.goto(login_url, timeout=30000)
            print("Navigated to login page")

            # Enter email and submit
            page.fill("#user_email", username)
            page.click("button[type='submit']")
            print("Entered email")
            
            # Wait for potential CAPTCHA or password field to appear
            time.sleep(20)  # Adjust this time as needed
            print("Waited for potential CAPTCHA")

            # Enter password and submit
            page.fill("#user_password", password)
            page.click("button[type='submit']")
            print("Entered password")

            # Wait for login to complete and potential redirect
            time.sleep(15)
            print("Waited for login to complete")

            # Navigate to Excel download page
            page.goto(excel_url, timeout=10000)
            print("Navigated to Excel download page")

            # Wait for page to load and potential animations to finish
            time.sleep(5)

            # Click the Excel download button
            try:
                download_button = page.wait_for_selector(".buttons-excel", state="visible", timeout=60000)
                
                with page.expect_download() as download_info:
                    download_button.click()
                download = download_info.value

                # Save the downloaded file
                download_path = '/tmp'
                file_path = os.path.join(download_path, download.suggested_filename)
                download.save_as(file_path)

                # Get the most recent file from the download directory
                list_of_files = glob.glob(os.path.join(download_path, '*'))
                latest_file = max(list_of_files, key=os.path.getctime)

                # Upload to S3
                s3 = boto3.client('s3')
                s3_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{os.path.basename(latest_file)}"
                s3.upload_file(latest_file, bucket_name, s3_filename)
                print(f"File successfully uploaded to S3: {s3_filename}")
            
            except TimeoutError:
                print("Excel download button not found within the timeout period.")
            except Exception as e:
                print(f"An error occurred during download or upload: {str(e)}")

        except Exception as e:
            print(f"An error occurred: {str(e)}")
        finally:
            browser.close()

lambda_handler()