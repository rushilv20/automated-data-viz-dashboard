from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from selenium.webdriver.chrome.options import Options

chrome_options = Options()
chrome_options.add_argument('--ignore-certificate-errors')
# driver = webdriver.Chrome(options=chrome_options)

# Jetinsight login credentials
username = "rvegada@flybellair.com"
password = "Rushil@201220"

# Jetinsight login URL
login_url = "https://portal.jetinsight.com/users/sign_in"

# URL of the page with the Excel download button
excel_url = "https://portal.jetinsight.com/analytics/trip_finance?stage=&search=&date_to_filter=depart_date_zulu&search_startdate=04%2F01%2F2024&search_enddate=04%2F25%2F2024&query_builder_json="

# Create a new instance of the Chrome driver
driver = webdriver.Chrome()

try:
    # Navigate to the login URL
    driver.get(login_url)

    # Find the email input field and submit button on the first page
    email_field = driver.find_element(By.ID, "user_email")  # Replace with the appropriate locator
    next_button = driver.find_element(By.CLASS_NAME, "pull-right")  # Replace with the appropriate locator

    # Fill in the email address
    email_field.send_keys(username)

    # Click the next button to proceed to the password page
    next_button.click()

    # Wait for the password field to be present on the second page
    password_field = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "user_password"))  # Replace with the appropriate locator
    )

    # Find the submit button on the password page
    submit_button = driver.find_element(By.CLASS_NAME, "pull-right")  # Replace with the appropriate locator

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

    print("Excel file downloaded successfully!")

except Exception as e:
    print("An error occurred during the process:")
    print(e)

finally:
    driver.quit()