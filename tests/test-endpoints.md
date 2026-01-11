# Testing Endpoints Locally

You can test the API endpoints locally without setting up Meta or OpenAI integrations. Here's how:

## Prerequisites

Make sure the dev server is running:
```bash
npm run dev
```

## 1. Test Instagram Webhook (GET - Verification)

This endpoint verifies the webhook with Meta. You can test it without any credentials:

```bash
# Test webhook verification
curl "http://localhost:3000/api/ig/webhook?hub.mode=subscribe&hub.verify_token=test_token&hub.challenge=test_challenge"
```

**Expected Response:** `test_challenge` (if you set `META_VERIFY_TOKEN=test_token` in `.env.local`)

**Without env vars:** You'll get `Forbidden` (which is correct behavior)

---

## 2. Test Instagram Webhook (POST - Receive Message)

Test receiving a message (this will fail gracefully without OpenAI credentials):

```bash
curl -X POST http://localhost:3000/api/ig/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{
    "object": "instagram",
    "entry": [{
      "messaging": [{
        "sender": {"id": "test_user_123"},
        "message": {"text": "Përshëndetje!"}
      }]
    }]
  }'
```

**Expected Response:** `{"error": "Invalid signature"}` (correct - signature validation works)

---

## 3. Test Crawler (Without OpenAI)

Create a simple test to verify the crawler works:

### Option A: Test Crawler Function Directly

Create a test file:

```typescript
// test-crawler.ts
import { crawlWebsite } from './lib/crawler';

async function testCrawler() {
  console.log('Testing crawler...');
  
  const pages = await crawlWebsite('https://printerior.al', {
    maxDepth: 2,
    maxPages: 5,
    sameDomainOnly: true,
  });
  
  console.log(`Crawled ${pages.length} pages`);
  pages.forEach(page => {
    console.log(`- ${page.title} (${page.url})`);
  });
}

testCrawler().catch(console.error);
```

Run it:
```bash
npx tsx test-crawler.ts
```

### Option B: Test Reindex Endpoint (Will Fail at OpenAI Step)

```bash
# This will crawl the website but fail when trying to upload to OpenAI
curl "http://localhost:3000/api/cron/reindex?secret=test_secret"
```

**Expected:** Crawling works, but fails at vector store upload (which is fine for testing)

---

## 4. Mock Testing with Minimal Setup

Create a `.env.local` file with mock values to test the flow:

```bash
# .env.local (for testing only)
META_VERIFY_TOKEN=test_token_123
META_APP_SECRET=test_secret_456
IG_PAGE_ACCESS_TOKEN=mock_token

OPENAI_API_KEY=sk-mock-key
OPENAI_VECTOR_STORE_ID=vs-mock-id
OPENAI_ASSISTANT_ID=asst-mock-id

CRON_SECRET=my_test_secret
```

Now you can test:

### Test Webhook Verification:
```bash
curl "http://localhost:3000/api/ig/webhook?hub.mode=subscribe&hub.verify_token=test_token_123&hub.challenge=SUCCESS"
```

**Expected Response:** `SUCCESS`

### Test Reindex with Auth:
```bash
curl "http://localhost:3000/api/cron/reindex?secret=my_test_secret"
```

**Expected:** Crawler will work, OpenAI upload will fail (but you'll see the crawler output in logs)

---

## 5. Test Just the Crawler Logic

The easiest way to test without any credentials:

```bash
# Install tsx for running TypeScript directly
npm install -D tsx
```

Create `test-simple.ts`:

```typescript
import { crawlWebsite, batchPagesToMarkdown } from './lib/crawler';

async function test() {
  console.log('🕷️  Testing crawler on example.com...\n');
  
  const pages = await crawlWebsite('https://example.com', {
    maxDepth: 1,
    maxPages: 3,
  });
  
  console.log(`✅ Crawled ${pages.length} pages:\n`);
  
  pages.forEach((page, i) => {
    console.log(`${i + 1}. ${page.title}`);
    console.log(`   URL: ${page.url}`);
    console.log(`   Content length: ${page.content.length} chars`);
    console.log(`   Depth: ${page.depth}\n`);
  });
  
  console.log('📦 Testing markdown batching...\n');
  const batches = batchPagesToMarkdown(pages, 2);
  console.log(`✅ Created ${batches.length} batches`);
  console.log(`   First batch length: ${batches[0].length} chars\n`);
}

test().catch(console.error);
```

Run it:
```bash
npx tsx test-simple.ts
```

This will test the crawler without needing ANY credentials!

---

## 6. View Logs While Testing

Keep the dev server running and watch the console output. You'll see:
- Incoming requests
- Validation results
- Error messages (helpful for debugging)

---

## Quick Test Summary

**No credentials needed:**
```bash
# Test crawler only
npx tsx test-simple.ts
```

**With mock .env.local:**
```bash
# Test webhook verification
curl "http://localhost:3000/api/ig/webhook?hub.mode=subscribe&hub.verify_token=test_token_123&hub.challenge=WORKS"

# Test reindex auth
curl "http://localhost:3000/api/cron/reindex?secret=my_test_secret"
```

**Expected Results:**
- ✅ Webhook verification works
- ✅ Crawler works and fetches pages
- ❌ OpenAI upload fails (expected without real API key)
- ❌ Instagram message sending fails (expected without real token)

This lets you verify all the logic works before setting up the full integrations!
