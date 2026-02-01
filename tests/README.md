# Tests Directory

This directory contains test scripts for the Instagram AI Assistant.

## Test Scripts

| Script | Purpose | Needs Credentials? |
|--------|---------|-------------------|
| `test-simple.ts` | Crawler test | ❌ No |
| `test-openai-response.ts` | Single OpenAI query test | ✅ Yes (OPENAI_API_KEY) |
| `test-quality.ts` | Multi-question quality test | ✅ Yes (OPENAI_API_KEY) |
| `test-local.sh` | Full integration test | ❌ No (mock env) |

## Quick Start

### Test Crawler (No Credentials)
```bash
npx tsx tests/test-simple.ts
```

### Test OpenAI Response
```bash
npx tsx tests/test-openai-response.ts
```

### Test Response Quality (Multiple Questions)
```bash
npx tsx tests/test-quality.ts
```

### Run All Integration Tests
```bash
./tests/test-local.sh
```

## Manual Endpoint Testing

```bash
# Start dev server first
npm run dev

# Webhook verification
curl "http://localhost:3000/api/ig/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=SUCCESS"

# Reindex endpoint
curl "http://localhost:3000/api/cron/reindex?secret=YOUR_CRON_SECRET"
```

## See Also

- [SETUP.md](../SETUP.md) - Full setup guide
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
