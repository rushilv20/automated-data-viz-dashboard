@echo off

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Installing Python...
    :: Download Python installer
    curl -o python_installer.exe https://www.python.org/ftp/python/3.11.4/python-3.11.4-amd64.exe
    :: Install Python silently
    start /wait python_installer.exe /quiet InstallAllUsers=1 PrependPath=1
    :: Clean up
    del python_installer.exe
) else (
    echo Python is already installed.
)

:: Upgrade pip
python -m pip install --upgrade pip

:: Install required Python packages
pip install boto3 playwright pandas openpyxl

:: Install Playwright browsers
python -m playwright install

echo Setup completed successfully. You can now run the scripts by executing the respective .cmd files.
pause
