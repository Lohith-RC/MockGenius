#!/bin/bash

# InterviewAI Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: staging, production

set -e

ENVIRONMENT=${1:-staging}
APP_NAME="interviewai"

echo "🚀 Deploying InterviewAI to $ENVIRONMENT environment..."

# Check if environment is valid
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

# Check required environment variables
required_vars=("GEMINI_API_KEY" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET" "APP_URL")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    fi
done

# Build the application
echo "📦 Building application..."
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t $APP_NAME:$ENVIRONMENT .

# Tag the image
echo "🏷️  Tagging image..."
docker tag $APP_NAME:$ENVIRONMENT $APP_NAME:latest

# Deploy based on environment
if [[ "$ENVIRONMENT" == "staging" ]]; then
    echo "🔧 Deploying to staging..."
    # Add your staging deployment commands here
    # Example: docker push your-registry/$APP_NAME:$ENVIRONMENT
elif [[ "$ENVIRONMENT" == "production" ]]; then
    echo "🚀 Deploying to production..."
    # Add your production deployment commands here
    # Example: docker push your-registry/$APP_NAME:$ENVIRONMENT
fi

echo "✅ Deployment to $ENVIRONMENT completed successfully!"