import os
import boto3
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def lambda_handler():
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1280x1696')
    chrome_options.add_argument('--single-process')
    chrome_options.add_argument('--disable-dev-shm-usage')

    # Remove Linux-specific options
    # chrome_options.add_argument('--user-data-dir=/tmp/user-data')
    # chrome_options.add_argument('--data-path=/tmp/data-path')
    # chrome_options.add_argument('--homedir=/tmp')
    # chrome_options.add_argument('--disk-cache-dir=/tmp/cache-dir')
    # chrome_options.binary_location = '/opt/chrome-linux/chrome'

    # Use ChromeDriverManager to automatically download and manage ChromeDriver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)

    driver.get('https://www.google.com/')
    title = driver.title
    driver.quit()

    response = {
        "statusCode": 200,
        "body": title
    }
    print(response)
    return response

lambda_handler()