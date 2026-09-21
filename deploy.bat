@echo off
REM Quick deployment script for Windows

echo =============================================
echo 6h4T 9pT pR0 Dashboard Deployment (Windows)
echo =============================================
echo.

REM Check Docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check Docker Compose plugin
docker compose version >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed
    pause
    exit /b 1
)

REM Stop existing containers
echo Stopping existing containers...
docker compose down 2>nul

REM Build and start
echo Building and starting services...
docker compose up -d --build

REM Wait
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check status
echo.
echo Checking service health...
docker compose ps

REM Test connection
echo.
echo Testing connection...
curl -s http://localhost:7000 >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Dashboard is running!
    echo.
    echo Access Points:
    echo   Local:  http://localhost:7000
    echo.
    echo Commands:
    echo   View logs: docker compose logs -f
    echo   Stop:      docker compose down
    echo.
) else (
    echo [ERROR] Dashboard failed to start
    echo Check logs: docker compose logs
)

echo.
echo Deployment complete!
pause
