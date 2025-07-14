#!/bin/sh
# filepath: deploy_appwrite.sh

# Install Node.js and npm if not present (for Alpine-based containers)
if ! command -v node >/dev/null 2>&1; then
  apk add --no-cache nodejs npm
fi

# Install Appwrite CLI if not present
if ! command -v appwrite >/dev/null 2>&1; then
  npm install -g appwrite-cli
fi

# Login to Appwrite (non-interactive, using API key)
appwrite client \
  --endpoint http://host.docker.internal/v1 \
  --project loopr-project \
  --key "$APPWRITE_API_KEY" && \
  appwrite push all --all --force
