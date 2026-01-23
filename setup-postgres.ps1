#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated PostgreSQL setup script for DreamBid
.DESCRIPTION
    Sets up PostgreSQL database and initializes the schema
#>

param(
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword,
    [string]$DatabaseName = "dreambid",
    [string]$DatabaseHost = "localhost",
    [string]$DatabasePort = "5432"
)

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $colors = @{
        "INFO" = "Cyan"
        "SUCCESS" = "Green"
        "ERROR" = "Red"
        "WARNING" = "Yellow"
    }
    Write-Host "[$Status] $Message" -ForegroundColor $colors[$Status]
}

# Check if PostgreSQL is installed
Write-Status "Checking PostgreSQL installation..."
try {
    $psqlVersion = psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "PostgreSQL found: $psqlVersion" "SUCCESS"
    } else {
        Write-Status "PostgreSQL not found. Please install PostgreSQL first." "ERROR"
        exit 1
    }
} catch {
    Write-Status "PostgreSQL not found. Please install PostgreSQL first." "ERROR"
    exit 1
}

# Prompt for password if not provided
if (-not $PostgresPassword) {
    Write-Status "Enter PostgreSQL 'postgres' user password:"
    $PostgresPassword = Read-Host -AsSecureString
    $PostgresPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($PostgresPassword))
}

# Set environment variable for password
$env:PGPASSWORD = $PostgresPassword

# Test connection
Write-Status "Testing PostgreSQL connection..."
try {
    psql -h $DatabaseHost -U $PostgresUser -c "SELECT version();" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Successfully connected to PostgreSQL" "SUCCESS"
    } else {
        Write-Status "Failed to connect to PostgreSQL. Check password and settings." "ERROR"
        exit 1
    }
} catch {
    Write-Status "Failed to connect to PostgreSQL. Check password and settings." "ERROR"
    exit 1
}

# Create database
Write-Status "Creating database '$DatabaseName'..."
try {
    psql -h $DatabaseHost -U $PostgresUser -c "CREATE DATABASE $DatabaseName;" 2>&1 | ForEach-Object {
        if ($_ -match "already exists") {
            Write-Status "Database already exists" "WARNING"
        } elseif ($_ -match "CREATE DATABASE") {
            Write-Status "Database created successfully" "SUCCESS"
        }
    }
} catch {
    Write-Status "Error creating database: $_" "ERROR"
    exit 1
}

# Run schema setup script
$schemaFile = ".\setup-database.sql"
if (-not (Test-Path $schemaFile)) {
    Write-Status "Schema file not found at $schemaFile" "ERROR"
    exit 1
}

Write-Status "Creating database schema..."
try {
    psql -h $DatabaseHost -U $PostgresUser -d $DatabaseName -f $schemaFile 2>&1 | ForEach-Object {
        if ($_ -match "CREATE|INSERT") {
            Write-Host $_ -ForegroundColor Green
        }
    }
    Write-Status "Schema created successfully" "SUCCESS"
} catch {
    Write-Status "Error creating schema: $_" "ERROR"
    exit 1
}

# Verify tables were created
Write-Status "Verifying database setup..."
try {
    $tables = psql -h $DatabaseHost -U $PostgresUser -d $DatabaseName -c "\dt" 2>&1
    if ($tables -match "properties|users|enquiries") {
        Write-Status "All tables created successfully" "SUCCESS"
    } else {
        Write-Status "Some tables may not have been created" "WARNING"
    }
} catch {
    Write-Status "Error verifying tables: $_" "ERROR"
}

# Update .env file
Write-Status "Updating .env file with database credentials..."
$envFile = ".\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $envContent = $envContent -replace 'DB_PASSWORD=.*', "DB_PASSWORD=$PostgresPassword"
    $envContent = $envContent -replace 'DB_USER=.*', "DB_USER=$PostgresUser"
    $envContent = $envContent -replace 'DB_HOST=.*', "DB_HOST=$DatabaseHost"
    $envContent = $envContent -replace 'DB_PORT=.*', "DB_PORT=$DatabasePort"
    $envContent = $envContent -replace 'DB_NAME=.*', "DB_NAME=$DatabaseName"
    Set-Content $envFile $envContent
    Write-Status ".env file updated" "SUCCESS"
} else {
    Write-Status ".env file not found at $envFile" "WARNING"
}

# Clear password from memory
$env:PGPASSWORD = ""
[System.GC]::Collect()

Write-Status "PostgreSQL setup complete!" "SUCCESS"
Write-Status "You can now run: npm run dev"
