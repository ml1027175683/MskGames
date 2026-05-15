$ErrorActionPreference = "Stop"

$serverRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $serverRoot

if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
    throw "Go executable was not found in PATH. Please add your Go bin directory to PATH and reopen the terminal."
}

if ([string]::IsNullOrWhiteSpace($env:MYSQL_PASSWORD)) {
    $securePassword = Read-Host "MYSQL_PASSWORD" -AsSecureString
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    try {
        $env:MYSQL_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
}

go run ./cmd/api
