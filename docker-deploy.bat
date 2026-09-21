@echo off
REM All-in-one: Build + Push to GitHub

echo ====================================================
echo 6h4T 9pT pR0 Dashboard - Build and Push
echo ====================================================
echo.

REM Build
call build-docker.bat

REM Push
echo.
echo Press any key to push to GitHub Container Registry...
pause >nul

call push-to-github.bat

echo.
echo [DONE] Complete!
pause
