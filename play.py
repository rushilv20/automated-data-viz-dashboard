import os
import boto3
from playwright.sync_api import sync_playwright

# Your credentials
username = "rvegada@flybellair.com"
password = "Rushil@201220"

# URLs
login_url = "https://portal.jetinsight.com/users/sign_in"
excel_url = "https://portal.jetinsight.com/analytics/trip_finance?stage=&search=&date_to_filter=depart_date_zulu&search_startdate=06%2F01%2F2024&search_enddate=06%2F25%2F2024&query_builder_json="

# Set AWS credentials
os.environ['AWS_ACCESS_KEY_ID'] = 'AKIATCKAMY4NZ77DVGVP'
os.environ['AWS_SECRET_ACCESS_KEY'] = '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'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

# S3 bucket name
bucket_name = 'bellairdatabucket'

def lambda_handler():
    # Initialize Playwright and the browser
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Navigate to the login URL
        page.goto(login_url)
        print("Navigated to login page")

        # Fill in the email address and click the next button
        page.fill("#user_email", username)
        page.click(".pull-right")
        print("Entered username and clicked next")

        # Wait for the password field to appear and fill it in
        try:
            page.wait_for_selector("#user_password", timeout=25000)  # Timeout set to 5000 milliseconds
            print("Password field appeared")
        except Exception as e:
            print(f"Error waiting for password field: {e}")
            raise e

        page.fill("#user_password", password)
        page.click(".pull-right")
        print("Entered password and clicked login")

        # Wait for the login to complete and navigate to the Excel download page
        page.wait_for_timeout(15000)
        page.goto(excel_url)
        print("Navigated to Excel download page")

        # Wait for the Excel download button to appear and click it
        try:
            page.wait_for_selector(".buttons-excel", timeout=25000)
            print("Excel download button appeared")
        except Exception as e:
            print(f"Error waiting for Excel download button: {e}")
            raise e
        
        

        # Handle the download
        with page.expect_download() as download_info:
            page.click(".buttons-excel")
        download = download_info.value

        # Save the downloaded file to the specified download path
        download_path = '/tmp'
        download.save_as(os.path.join(download_path, download.suggested_filename))
        print(f"Downloaded file saved to {os.path.join(download_path, download.suggested_filename)}")

        # Find the most recently downloaded file in the specified download directory
        files = os.listdir(download_path)
        files = [f for f in files if os.path.isfile(os.path.join(download_path, f))]
        newest_file = max(files, key=lambda x: os.path.getmtime(os.path.join(download_path, x)))
        file_path = os.path.join(download_path, newest_file)

        # Initialize a session using Amazon S3
        s3 = boto3.client('s3')

        # Upload the most recently downloaded file to S3
        s3.upload_file(file_path, bucket_name, newest_file)
        print(f"File '{newest_file}' uploaded to S3 bucket '{bucket_name}' successfully!")

        # Close the browser
        browser.close()

lambda_handler()