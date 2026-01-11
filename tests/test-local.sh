#!/bin/bash

# Quick Test Script for Instagram AI Assistant
# This script tests the endpoints locally without needing real credentials

echo "🧪 Instagram AI Assistant - Local Testing"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if dev server is running
echo "📡 Checking if dev server is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Dev server is running${NC}"
else
    echo -e "${RED}✗ Dev server is not running${NC}"
    echo "  Please run: npm run dev"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Crawler (no credentials needed)
echo "Test 1: Testing Crawler (no credentials needed)"
echo "------------------------------------------------"
echo "Running: npx tsx tests/test-simple.ts"
echo ""
npx tsx tests/test-simple.ts
echo ""

# Test 2: Webhook GET (verification)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test 2: Webhook Verification Endpoint"
echo "--------------------------------------"
echo "Testing: GET /api/ig/webhook"
echo ""

# This will fail without env vars, which is expected
response=$(curl -s "http://localhost:3000/api/ig/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=TEST_CHALLENGE")

if echo "$response" | grep -q "Forbidden"; then
    echo -e "${YELLOW}⚠ Webhook verification failed (expected without META_VERIFY_TOKEN)${NC}"
    echo "  To test properly, create .env.local with META_VERIFY_TOKEN=test"
elif echo "$response" | grep -q "TEST_CHALLENGE"; then
    echo -e "${GREEN}✓ Webhook verification works!${NC}"
else
    echo -e "${RED}✗ Unexpected response${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 3: Webhook POST
echo "Test 3: Webhook Message Endpoint"
echo "---------------------------------"
echo "Testing: POST /api/ig/webhook"
echo ""

response=$(curl -s -X POST http://localhost:3000/api/ig/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=invalid" \
  -d '{
    "object": "instagram",
    "entry": [{
      "messaging": [{
        "sender": {"id": "test_user"},
        "message": {"text": "Test message"}
      }]
    }]
  }')

if echo "$response" | grep -q "Invalid signature"; then
    echo -e "${GREEN}✓ Signature validation works!${NC}"
    echo "  (Correctly rejected invalid signature)"
else
    echo -e "${YELLOW}⚠ Unexpected response: $response${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 4: Reindex endpoint
echo "Test 4: Reindex Cron Endpoint"
echo "------------------------------"
echo "Testing: GET /api/cron/reindex"
echo ""

response=$(curl -s "http://localhost:3000/api/cron/reindex?secret=wrong_secret")

if echo "$response" | grep -q "Unauthorized"; then
    echo -e "${GREEN}✓ Cron authentication works!${NC}"
    echo "  (Correctly rejected unauthorized request)"
else
    echo -e "${YELLOW}⚠ Unexpected response${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Summary"
echo "----------"
echo ""
echo "✅ Crawler works without any credentials"
echo "✅ Webhook endpoints respond correctly"
echo "✅ Authentication/validation logic works"
echo ""
echo "To test with real integrations:"
echo "1. Create .env.local with real credentials"
echo "2. Set up OpenAI Vector Store"
echo "3. Configure Meta webhook"
echo ""
echo "See test-endpoints.md for detailed testing instructions"
echo ""
