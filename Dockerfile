# Use the Playwright Python base image for the build stage
FROM mcr.microsoft.com/playwright/python:v1.21.0-focal

# Install aws-lambda-cpp build dependencies
RUN apt-get update && \
    apt-get install -y \
    g++ \
    make \
    cmake \
    unzip \
    libcurl4-openssl-dev

# Install Python dependencies (Playwright and boto3)
RUN pip install boto3 playwright
RUN playwright install

# Set AWS Lambda environment variables (replace with your own credentials)
ENV AWS_ACCESS_KEY_ID="AKIATCKAMY4NZ77DVGVP"
ENV AWS_SECRET_ACCESS_KEY="0TR8IeSZ1F5uT7jl7SKP9PLrPUCfe96ykZV8GL8w"
ENV AWS_DEFAULT_REGION="us-east-1"

# Set working directory (optional, but good practice)
WORKDIR /automated-data-viz-dashboard

# Copy your Python script and any necessary files
COPY play.py /automated-data-viz-dashboard/play.py

# Define the entry point for the container
CMD [ "python", "play.py" ]
