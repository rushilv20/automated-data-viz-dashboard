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
file_type = 'logged_flights'  # Options: 'logged_flights', 'trip_finance', 'quickbooks_desktop_export'
start_date = '06/01/2024'
end_date = '06/30/2024'

# Generate and print the URL
url = generate_url(file_type, start_date, end_date)
print("Generated URL:")
print(url)