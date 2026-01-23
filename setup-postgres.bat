@echo off
REM DreamBid PostgreSQL Setup Script for Windows

setlocal enabledelayedexpansion

set PSQL_PATH=C:\Program Files\PostgreSQL\18\bin\psql.exe
set POSTGRES_USER=postgres
set DB_NAME=dreambid

if not exist "%PSQL_PATH%" (
    echo Error: PostgreSQL not found at %PSQL_PATH%
    echo Please install PostgreSQL 18 or update the path in this script
    pause
    exit /b 1
)

echo.
echo ====================================
echo  DreamBid PostgreSQL Setup
echo ====================================
echo.

REM Set password via environment variable
set /p POSTGRES_PASSWORD="Enter PostgreSQL 'postgres' user password: "

echo.
echo [1/3] Testing PostgreSQL connection...
"%PSQL_PATH%" -U %POSTGRES_USER% -h localhost -c "SELECT version();" >nul 2>&1
if errorlevel 1 (
    echo Error: Cannot connect to PostgreSQL
    echo Please verify PostgreSQL is running and password is correct
    pause
    exit /b 1
)
echo [SUCCESS] Connected to PostgreSQL

echo.
echo [2/3] Creating database '%DB_NAME%'...
"%PSQL_PATH%" -U %POSTGRES_USER% -h localhost -c "CREATE DATABASE %DB_NAME%;" 2>&1 | findstr /i /r "CREATE|already"
if errorlevel 1 (
    echo [WARNING] Database creation may have failed, continuing...
)

echo.
echo [3/3] Creating database schema...
if not exist "setup-database.sql" (
    echo Error: setup-database.sql not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

"%PSQL_PATH%" -U %POSTGRES_USER% -h localhost -d %DB_NAME% -f setup-database.sql >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Schema creation may have encountered issues
) else (
    echo [SUCCESS] Database schema created
)

echo.
echo ====================================
echo  Setup Complete!
echo ====================================
echo.
echo PostgreSQL is now ready. Update your .env file:
echo   DB_USER=postgres
echo   DB_PASSWORD=%POSTGRES_PASSWORD%
echo   DB_HOST=localhost
echo   DB_PORT=5432
echo   DB_NAME=dreambid
echo.
echo Then run: npm run dev
echo.
pause
