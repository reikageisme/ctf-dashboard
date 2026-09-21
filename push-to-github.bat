@echo off
REM Push to GitHub Container Registry (Windows)

set GITHUB_USER=sudo-baoz
set IMAGE_NAME=ctf-dashboard
set FULL_IMAGE=ghcr.io/%GITHUB_USER%/%IMAGE_NAME%

echo ========================================
echo Pushing to GitHub Container Registry
echo ========================================
echo.

echo Get your GitHub token from:
echo https://github.com/settings/tokens
echo Required scopes: write:packages, read:packages
echo.

REM Login
echo Logging in to GitHub Container Registry...
set /p GITHUB_TOKEN="Enter your GitHub token: "
echo %GITHUB_TOKEN% | docker login ghcr.io -u %GITHUB_USER% --password-stdin

if %errorlevel% neq 0 (
    echo [ERROR] Login failed
    pause
    exit /b 1
)

REM Push latest
echo.
echo Pushing %FULL_IMAGE%:latest...
docker push %FULL_IMAGE%:latest

if %errorlevel% neq 0 (
    echo [ERROR] Push failed
    pause
    exit /b 1
)

REM Push date tag
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set DATE_TAG=%%c%%a%%b)
docker images %FULL_IMAGE%:%DATE_TAG% --format "{{.ID}}" >nul 2>&1
if %errorlevel% equ 0 (
    echo Pushing %FULL_IMAGE%:%DATE_TAG%...
    docker push %FULL_IMAGE%:%DATE_TAG%
)

echo.
echo [SUCCESS] Push complete!
echo.
echo Your image is now available at:
echo    %FULL_IMAGE%:latest
echo.
echo Pull with:
echo    docker pull %FULL_IMAGE%:latest
echo.
echo Run with:
echo    docker run -d -p 7000:7000 %FULL_IMAGE%:latest
echo.
pause
