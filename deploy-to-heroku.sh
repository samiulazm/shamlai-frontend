#!/bin/bash

# Heroku Deployment Script for Shamlai Frontend
# This script automates the Heroku deployment process

echo "🚀 Shamlai Frontend - Heroku Deployment Script"
echo "==============================================="
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed."
    echo "📥 Please install it from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

echo "✅ Heroku CLI found"
echo ""

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 Please login to Heroku..."
    heroku login
fi

echo ""
echo "📝 Creating Heroku app..."
read -p "Enter your app name (or press Enter for auto-generated name): " APP_NAME

if [ -z "$APP_NAME" ]; then
    heroku create
else
    heroku create $APP_NAME
fi

# Get the app name
HEROKU_APP=$(heroku apps:info --json | grep -o '"name":"[^"]*' | cut -d'"' -f4)
HEROKU_URL="https://$HEROKU_APP.herokuapp.com"

echo ""
echo "✅ App created: $HEROKU_APP"
echo "🌐 URL: $HEROKU_URL"
echo ""

# Set environment variables
echo "🔧 Setting up environment variables..."
echo ""

# Required variables
read -p "Enter your NEXT_PUBLIC_INSFORGE_URL: " INSFORGE_URL
read -sp "Enter your INSFORGE_SERVICE_ROLE_KEY: " INSFORGE_KEY
echo ""
read -p "Enter your NEXT_PUBLIC_APP_NAME (default: Shamlai): " APP_NAME_VAR
APP_NAME_VAR=${APP_NAME_VAR:-Shamlai}

# Generate NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Set config vars
heroku config:set \
  NODE_ENV=production \
  NEXT_PUBLIC_APP_URL=$HEROKU_URL \
  NEXT_PUBLIC_APP_NAME="$APP_NAME_VAR" \
  NEXT_PUBLIC_INSFORGE_URL=$INSFORGE_URL \
  INSFORGE_SERVICE_ROLE_KEY=$INSFORGE_KEY \
  NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
  NEXTAUTH_URL=$HEROKU_URL \
  NEXT_TELEMETRY_DISABLED=1 \
  -a $HEROKU_APP

echo ""
echo "✅ Environment variables set"
echo ""

# Optional: Set up additional services
read -p "Do you want to add Papertrail for log management? (y/n): " ADD_PAPERTRAIL
if [ "$ADD_PAPERTRAIL" = "y" ]; then
    heroku addons:create papertrail:choklad -a $HEROKU_APP
    echo "✅ Papertrail added"
fi

echo ""
read -p "Do you want to add Heroku Redis? (y/n): " ADD_REDIS
if [ "$ADD_REDIS" = "y" ]; then
    heroku addons:create heroku-redis:mini -a $HEROKU_APP
    echo "✅ Redis added"
fi

echo ""
echo "📦 Deploying to Heroku..."
echo "This may take a few minutes..."
echo ""

# Add Heroku remote if not exists
if ! git remote | grep -q heroku; then
    heroku git:remote -a $HEROKU_APP
fi

# Deploy
git push heroku main || git push heroku master

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Checking app status..."
heroku ps -a $HEROKU_APP

echo ""
echo "🎉 Your app is live at: $HEROKU_URL"
echo ""
echo "📚 Useful commands:"
echo "  heroku logs --tail -a $HEROKU_APP    # View logs"
echo "  heroku open -a $HEROKU_APP           # Open in browser"
echo "  heroku restart -a $HEROKU_APP        # Restart app"
echo "  heroku ps -a $HEROKU_APP             # Check status"
echo ""
echo "📖 Full documentation: See HEROKU_DEPLOYMENT.md"

