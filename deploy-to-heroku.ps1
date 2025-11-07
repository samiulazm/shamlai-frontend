# Heroku Deployment Script for Shamlai Frontend (PowerShell)
# This script automates the Heroku deployment process for Windows

Write-Host "🚀 Shamlai Frontend - Heroku Deployment Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Heroku CLI is installed
try {
    $null = heroku --version
    Write-Host "✅ Heroku CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI is not installed." -ForegroundColor Red
    Write-Host "📥 Please install it from: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if logged in to Heroku
try {
    $null = heroku auth:whoami 2>&1
} catch {
    Write-Host "🔐 Please login to Heroku..." -ForegroundColor Yellow
    heroku login
}

Write-Host ""
Write-Host "📝 Creating Heroku app..." -ForegroundColor Cyan
$APP_NAME = Read-Host "Enter your app name (or press Enter for auto-generated name)"

if ([string]::IsNullOrWhiteSpace($APP_NAME)) {
    heroku create
} else {
    heroku create $APP_NAME
}

# Get the app name
$HEROKU_INFO = heroku apps:info --json | ConvertFrom-Json
$HEROKU_APP = $HEROKU_INFO.app.name
$HEROKU_URL = "https://$HEROKU_APP.herokuapp.com"

Write-Host ""
Write-Host "✅ App created: $HEROKU_APP" -ForegroundColor Green
Write-Host "🌐 URL: $HEROKU_URL" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Cyan
Write-Host ""

# Required variables
$INSFORGE_URL = Read-Host "Enter your NEXT_PUBLIC_INSFORGE_URL"
$INSFORGE_KEY = Read-Host "Enter your INSFORGE_SERVICE_ROLE_KEY" -AsSecureString
$INSFORGE_KEY_TEXT = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($INSFORGE_KEY))

$APP_NAME_VAR = Read-Host "Enter your NEXT_PUBLIC_APP_NAME (default: Shamlai)"
if ([string]::IsNullOrWhiteSpace($APP_NAME_VAR)) {
    $APP_NAME_VAR = "Shamlai"
}

# Generate NextAuth secret
$NEXTAUTH_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Set config vars
Write-Host "Setting configuration variables..." -ForegroundColor Yellow
heroku config:set NODE_ENV=production -a $HEROKU_APP
heroku config:set NEXT_PUBLIC_APP_URL=$HEROKU_URL -a $HEROKU_APP
heroku config:set NEXT_PUBLIC_APP_NAME="$APP_NAME_VAR" -a $HEROKU_APP
heroku config:set NEXT_PUBLIC_INSFORGE_URL=$INSFORGE_URL -a $HEROKU_APP
heroku config:set INSFORGE_SERVICE_ROLE_KEY=$INSFORGE_KEY_TEXT -a $HEROKU_APP
heroku config:set NEXTAUTH_SECRET=$NEXTAUTH_SECRET -a $HEROKU_APP
heroku config:set NEXTAUTH_URL=$HEROKU_URL -a $HEROKU_APP
heroku config:set NEXT_TELEMETRY_DISABLED=1 -a $HEROKU_APP

Write-Host ""
Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host ""

# Optional: Set up additional services
$ADD_PAPERTRAIL = Read-Host "Do you want to add Papertrail for log management? (y/n)"
if ($ADD_PAPERTRAIL -eq "y") {
    heroku addons:create papertrail:choklad -a $HEROKU_APP
    Write-Host "✅ Papertrail added" -ForegroundColor Green
}

Write-Host ""
$ADD_REDIS = Read-Host "Do you want to add Heroku Redis? (y/n)"
if ($ADD_REDIS -eq "y") {
    heroku addons:create heroku-redis:mini -a $HEROKU_APP
    Write-Host "✅ Redis added" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Deploying to Heroku..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

# Add Heroku remote if not exists
$remotes = git remote
if ($remotes -notcontains "heroku") {
    heroku git:remote -a $HEROKU_APP
}

# Deploy
try {
    git push heroku main
} catch {
    git push heroku master
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Checking app status..." -ForegroundColor Cyan
heroku ps -a $HEROKU_APP

Write-Host ""
Write-Host "🎉 Your app is live at: $HEROKU_URL" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Useful commands:" -ForegroundColor Cyan
Write-Host "  heroku logs --tail -a $HEROKU_APP    # View logs"
Write-Host "  heroku open -a $HEROKU_APP           # Open in browser"
Write-Host "  heroku restart -a $HEROKU_APP        # Restart app"
Write-Host "  heroku ps -a $HEROKU_APP             # Check status"
Write-Host ""
Write-Host "📖 Full documentation: See HEROKU_DEPLOYMENT.md" -ForegroundColor Yellow

