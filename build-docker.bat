@echo off
REM Build Docker image for Windows

echo ====================================================
echo Building Docker image for 6h4T 9pT pR0 Dashboard
echo ====================================================
echo.

set GITHUB_USER=sudo-baoz
set IMAGE_NAME=ctf-dashboard
set FULL_IMAGE=ghcr.io/%GITHUB_USER%/%IMAGE_NAME%

echo Building image: %FULL_IMAGE%:latest
docker build -t %FULL_IMAGE%:latest .

if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

REM Tag with date
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set DATE_TAG=%%c%%a%%b)
docker tag %FULL_IMAGE%:latest %FULL_IMAGE%:%DATE_TAG%

echo.
echo [SUCCESS] Build complete!
echo.
echo Available tags:
echo    - %FULL_IMAGE%:latest
echo    - %FULL_IMAGE%:%DATE_TAG%
echo.
echo To push to GitHub:
echo    1. Get token from: https://github.com/settings/tokens
echo    2. Run: docker login ghcr.io -u %GITHUB_USER%
echo    3. Run: docker push %FULL_IMAGE%:latest
echo    4. Run: docker push %FULL_IMAGE%:%DATE_TAG%
echo.
echo Or run: push-to-github.bat
pause
