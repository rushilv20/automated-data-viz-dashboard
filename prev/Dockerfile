FROM mcr.microsoft.com/playwright/python:v1.39.0-focal

# Install X11 dependencies
RUN apt-get update && apt-get install -y \
    xvfb \
    x11-xkb-utils \
    xfonts-100dpi \
    xfonts-75dpi \
    xfonts-scalable \
    xfonts-cyrillic \
    x11-apps \
    xvfb

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip
RUN pip install boto3 playwright

# Install Playwright browsers
RUN playwright install chromium
RUN playwright install-deps

# Set working directory
WORKDIR /app

# Copy your Python script
COPY play.py /app/play.py

# Set environment variables for AWS (replace with your actual credentials)
ENV AWS_ACCESS_KEY_ID=AKIATCKAMY4NZ77DVGVP
ENV AWS_SECRET_ACCESS_KEY=0TR8IeSZ1F5uT7jl7SKP9PLrPUCfe96ykZV8GL8w
ENV AWS_DEFAULT_REGION=us-east-1

# Set display
ENV DISPLAY=:99

# Start Xvfb
CMD Xvfb :99 -screen 0 1024x768x16 & python -u play.py