@echo off

:: Set environment variables for AWS
set AWS_ACCESS_KEY_ID=AKIATCKAMY4NZ77DVGVP
set AWS_SECRET_ACCESS_KEY=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
set AWS_DEFAULT_REGION=us-east-1
set DYNAMODB_TABLE_NAME=Logged-Flights

:: Run the Python script
python logged_flights.py

echo Logged flights script execution completed successfully.
pause
