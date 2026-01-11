# Tests Directory

This directory contains all testing files and documentation for the Instagram AI Assistant.

## Files

### Test Scripts
- **[test-simple.ts](file:///Users/eshkurti/Development/Antigravity/printeriorai/tests/test-simple.ts)** - Simple crawler test (no credentials needed)
- **[test-local.sh](file:///Users/eshkurti/Development/Antigravity/printeriorai/tests/test-local.sh)** - Automated test suite for all endpoints

### Documentation
- **[TESTING.md](file:///Users/eshkurti/Development/Antigravity/printeriorai/tests/TESTING.md)** - Quick start guide for local testing
- **[test-endpoints.md](file:///Users/eshkurti/Development/Antigravity/printeriorai/tests/test-endpoints.md)** - Detailed endpoint testing guide

## Comparison: test-simple.ts vs test-local.sh

| Feature | test-simple.ts | test-local.sh |
|---------|---------------|---------------|
| **Tests crawler** | ✅ | ✅ |
| **Tests webhooks** | ❌ | ✅ |
| **Tests cron endpoint** | ❌ | ✅ |
| **Needs dev server** | ❌ | ✅ |
| **Needs credentials** | ❌ | Optional |
| **Output** | Detailed crawl info | Summary of all tests |

**Use test-simple.ts for:** Quick crawler verification  
**Use test-local.sh for:** Full system testing

## Quick Start

### Test Crawler (No Credentials Needed)
```bash
npx tsx tests/test-simple.ts
```

### Run All Tests
```bash
./tests/test-local.sh
```

### Test Individual Endpoints
```bash
# Webhook verification
curl "http://localhost:3000/api/ig/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=SUCCESS"

# Reindex endpoint
curl "http://localhost:3000/api/cron/reindex?secret=test_secret"
```

## What Gets Tested

✅ **Crawler** - Fetches and extracts content from printerior.al  
✅ **Webhook Verification** - Meta webhook handshake  
✅ **Webhook Signature Validation** - HMAC SHA256 validation  
✅ **Cron Authentication** - Secret-based auth  
✅ **Content Processing** - Markdown batching  

❌ **OpenAI Integration** - Requires real API key (expected to fail with mock credentials)  
❌ **Instagram Messaging** - Requires real access token (expected to fail with mock credentials)

## See Also

- [SETUP.md](file:///Users/eshkurti/Development/Antigravity/printeriorai/SETUP.md) - Full setup guide
- [README.md](file:///Users/eshkurti/Development/Antigravity/printeriorai/README.md) - Project documentation
