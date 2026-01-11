# Quick Start: Testing Without Real Credentials

Copy this content to create a `.env.local` file for local testing:

```bash
# Copy and paste this into .env.local

# Meta/Instagram (mock values for testing)
META_VERIFY_TOKEN=test_verify_token_123
META_APP_SECRET=test_app_secret_456789
IG_PAGE_ACCESS_TOKEN=mock_ig_token_abc123

# OpenAI (mock values - API calls will fail but endpoints will work)
OPENAI_API_KEY=sk-mock-key-for-local-testing-only
OPENAI_VECTOR_STORE_ID=vs-mock-vector-store-id-123
OPENAI_ASSISTANT_ID=asst-mock-assistant-id-456

# Security
CRON_SECRET=my_local_test_secret_789
```

## How to Create .env.local

```bash
# In the project root directory
cat > .env.local << 'EOF'
META_VERIFY_TOKEN=test_verify_token_123
META_APP_SECRET=test_app_secret_456789
IG_PAGE_ACCESS_TOKEN=mock_ig_token_abc123
OPENAI_API_KEY=sk-mock-key-for-local-testing-only
OPENAI_VECTOR_STORE_ID=vs-mock-vector-store-id-123
OPENAI_ASSISTANT_ID=asst-mock-assistant-id-456
CRON_SECRET=my_local_test_secret_789
EOF
```

Then restart your dev server:
```bash
# Stop the current server (Ctrl+C)
# Start it again
npm run dev
```

## Now You Can Test!

```bash
# Run all tests
./tests/test-local.sh

# Or test individually:

# Test crawler (no credentials needed)
npx tsx tests/test-simple.ts

# Test webhook verification
curl "http://localhost:3000/api/ig/webhook?hub.mode=subscribe&hub.verify_token=test_verify_token_123&hub.challenge=SUCCESS"
# Should return: SUCCESS

# Test reindex endpoint
curl "http://localhost:3000/api/cron/reindex?secret=my_local_test_secret_789"
# Will crawl website but fail at OpenAI upload (expected)
```

## What Works vs What Doesn't

✅ **Works with mock credentials:**
- Webhook verification
- Signature validation logic
- Cron authentication
- Website crawling
- Content extraction
- Markdown batching

❌ **Fails with mock credentials (expected):**
- OpenAI API calls (needs real API key)
- Instagram message sending (needs real token)
- Vector store operations (needs real vector store ID)

This is perfect for testing the logic without spending money on API calls!
