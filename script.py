import os
import time
import boto3
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service

# Your credentials
username = "rvegada@flybellair.com"
password = "Rushil@201220"

# URLs
login_url = "https://portal.jetinsight.com/users/sign_in"
excel_url = "https://portal.jetinsight.com/analytics/trip_finance?stage=&search=&date_to_filter=depart_date_zulu&search_startdate=04%2F01%2F2024&search_enddate=05%2F25%2F2024&query_builder_json="

chrome_options = Options()
chrome_options.binary_location = "/usr/local/bin/google-chrome-headless"
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--window-size=1920x1080")
chrome_options.add_argument("--remote-debugging-port=9222")

# Log the Chrome binary and driver paths
print(f"Chrome binary location: {chrome_options.binary_location}")
print(f"ChromeDriver path: {Service('/usr/local/bin/chromedriver').path}")

try:
    # Initialize the Chrome driver
    service = Service('/usr/local/bin/chromedriver')
    driver = webdriver.Chrome(service=service, options=chrome_options)

    # Navigate to the login URL
    driver.get(login_url)

    # Find the email input field and submit button on the first page
    email_field = driver.find_element(By.ID, "user_email")
    next_button = driver.find_element(By.CLASS_NAME, "pull-right")

    # Fill in the email address
    email_field.send_keys(username)

    # Click the next button to proceed to the password page
    next_button.click()

    # Wait for the password field to be present on the second page
    password_field = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "user_password"))
    )

    # Find the submit button on the password page
    submit_button = driver.find_element(By.CLASS_NAME, "pull-right")

    # Fill in the password
    password_field.send_keys(password)

    # Click the submit button to log in
    submit_button.click()

    time.sleep(5)

    # Wait for the login to complete and navigate to the Excel download page
    driver.get(excel_url)

    time.sleep(10)

    # Wait for the Excel download button to be present
    excel_button = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "buttons-excel"))
    )

    # Click the Excel download button
    excel_button.click()

    # Wait for the file to be downloaded (adjust the timeout as needed)
    time.sleep(7)

    # Find the most recently downloaded file in the /tmp directory
    tmp_dir = '/tmp'
    files = os.listdir(tmp_dir)
    files = [f for f in files if os.path.isfile(os.path.join(tmp_dir, f))]
    newest_file = max(files, key=lambda x: os.path.getmtime(os.path.join(tmp_dir, x)))

    # Upload the most recently downloaded file to S3
    s3 = boto3.client('s3')
    file_path = os.path.join(tmp_dir, newest_file)
    bucket_name = 'bellairdatabucket'  # Replace with your S3 bucket name
    s3.upload_file(file_path, bucket_name, newest_file)

    print(f"File '{newest_file}' uploaded to S3 successfully!")

except Exception as e:
    print("An error occurred during the process:")
    print(e)

finally:
    try:
        driver.quit()
    except NameError:
        pass
