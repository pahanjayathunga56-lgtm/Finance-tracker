@echo off
cd /d "%~dp0"

:: Check if port 5173 is already active
netstat -ano | findstr ":5173 " | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    :: Server is not running, launch Vite dev server minimized in background
    start /min "FinanceFlow Dev Server" cmd /c "npm.cmd run dev"
    timeout /t 2 /nobreak >nul
)

:: Launch in native standalone window mode (App Mode)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173/
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173/
) else (
    start http://localhost:5173/
)
