# Use the official Python image from the Docker Hub
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV CHROME_BIN=/usr/local/bin/google-chrome
ENV CHROME_DRIVER=/usr/local/bin/chromedriver

# Install dependencies
RUN apt-get update && \
    apt-get install -y wget unzip curl gnupg libnss3 libgconf-2-4 libxss1 libappindicator3-1 fonts-liberation xdg-utils \
    libatk1.0-0 libpangocairo-1.0-0 libgtk-3-0 libx11-xcb1 libxcomposite1 libxrandr2 libxi6 libasound2 \
    libcups2 libdbus-1-3 libexpat1 libfontconfig1 libfreetype6 libgbm1 libglib2.0-0 libnspr4 libpango-1.0-0 libx11-6 \
    libxdamage1 libxext6 libxfixes3 --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -O /tmp/chrome-linux64.zip https://storage.googleapis.com/chrome-for-testing-public/114.0.5735.90/linux64/chrome-linux64.zip && \
    unzip /tmp/chrome-linux64.zip -d /usr/local/bin/ && \
    rm /tmp/chrome-linux64.zip && \
    ln -s /usr/local/bin/chrome-linux64/chrome /usr/local/bin/google-chrome

# Install Chromedriver
RUN wget -O /tmp/chromedriver-linux64.zip https://chromedriver.storage.googleapis.com/114.0.5735.90/chromedriver_linux64.zip && \
    unzip /tmp/chromedriver-linux64.zip -d /usr/local/bin/ && \
    rm /tmp/chromedriver-linux64.zip

# Install headless Chromium
RUN wget -O /tmp/chrome-headless-shell-linux64.zip https://github.com/adieuadieu/serverless-chrome/releases/download/v1.0.0-57/stable-headless-chromium-amazonlinux-2.zip && \
    unzip /tmp/chrome-headless-shell-linux64.zip -d /usr/local/bin/ && \
    mv /usr/local/bin/headless-chromium /usr/local/bin/google-chrome-headless && \
    rm /tmp/chrome-headless-shell-linux64.zip

# Install Selenium and boto3
RUN pip install selenium boto3

# Copy the script to the container
COPY script.py /automated-data-viz-dashboard/script.py

# Set the working directory
WORKDIR /automated-data-viz-dashboard

# Run the script
CMD ["python", "script.py"]
