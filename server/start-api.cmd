@echo off
setlocal

cd /d "%~dp0"

where go >nul 2>nul
if errorlevel 1 (
  echo Go executable was not found in PATH.
  echo Please add your Go bin directory to PATH and reopen the terminal.
  exit /b 1
)

if "%MYSQL_PASSWORD%"=="" (
  set /p MYSQL_PASSWORD=MYSQL_PASSWORD: 
)

go run ./cmd/api
