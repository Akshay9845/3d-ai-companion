#!/bin/bash

# Configuration
GITHUB_TOKEN=${GITHUB_TOKEN}
REPO_OWNER="Akshay9845"
REPO_NAME="3d-ai-companion"
NEW_DESCRIPTION="🚀 Advanced 3D AI Avatar System with Real-time Speech Sync, Emotion Detection & 200+ Features | 820+ Research Papers Integrated"

# Check if token is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Please set GITHUB_TOKEN environment variable"
    echo "You can get a token from: https://github.com/settings/tokens"
    echo "Run: export GITHUB_TOKEN=your_token_here"
    exit 1
fi

echo "🔄 Updating GitHub repository description..."

# Make the API call
response=$(curl -s -w "%{http_code}" -X PATCH \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d "{\"description\":\"$NEW_DESCRIPTION\"}" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME")

# Extract status code and response body
http_code="${response: -3}"
response_body="${response%???}"

if [ "$http_code" = "200" ]; then
    echo "✅ Successfully updated GitHub repository description!"
    echo "New description: \"$NEW_DESCRIPTION\""
else
    echo "❌ Failed to update description"
    echo "Status: $http_code"
    echo "Response: $response_body"
fi 