# Instagram AI Assistant for Printerior.al

An AI-powered Instagram DM assistant that answers customer questions in Albanian based strictly on the content from [printerior.al](https://printerior.al/).

## Features

- 🤖 **AI-Powered Responses**: Uses OpenAI Assistants API with RAG (Retrieval-Augmented Generation)
- 🇦🇱 **Albanian-Only**: All responses are in Albanian
- 📚 **Website-Grounded**: Answers based strictly on printerior.al content
- 🔄 **Auto-Refresh**: Weekly automatic reindexing of website content
- ✅ **Minimal Setup**: Simple deployment on Vercel

## Architecture

- **Next.js** (Pages Router) with TypeScript
- **OpenAI Assistants API** with file_search for RAG
- **Meta Graph API** for Instagram messaging
- **Vercel** for hosting and cron jobs

## Setup

### 1. Prerequisites

- Node.js 18+ installed
- OpenAI API account
- Meta Developer account with Instagram Messaging configured
- Vercel account (for deployment)

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Meta/Instagram
META_VERIFY_TOKEN=your_verify_token_here
META_APP_SECRET=your_app_secret_here
IG_PAGE_ACCESS_TOKEN=your_page_access_token_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_VECTOR_STORE_ID=your_vector_store_id_here

# Security
CRON_SECRET=your_cron_secret_here
```

### 3. OpenAI Setup

1. Create an OpenAI API key at [platform.openai.com](https://platform.openai.com/)
2. Create a Vector Store in the OpenAI dashboard
3. Copy the Vector Store ID to your `.env.local`
4. (Optional) Create an Assistant manually, or let the app create one automatically

### 4. Meta/Instagram Setup

1. Create a Meta Developer App at [developers.facebook.com](https://developers.facebook.com/)
2. Add Instagram Messaging product to your app
3. Configure webhook subscription:
   - Callback URL: `https://your-domain.vercel.app/api/ig/webhook`
   - Verify Token: Use the same value as `META_VERIFY_TOKEN`
   - Subscribe to `messages` field
4. Get Page Access Token with `instagram_manage_messages` permission
5. Copy App Secret and Page Access Token to `.env.local`

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the status page.

### 7. Test Webhook Locally (Optional)

Use ngrok to expose your local server:

```bash
ngrok http 3000
```

Use the ngrok URL to configure your Meta webhook.

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Configure Environment Variables

Add all environment variables in the Vercel dashboard under Settings → Environment Variables.

### Initial Website Indexing

After deployment, trigger the initial indexing manually:

```bash
curl -X GET "https://your-domain.vercel.app/api/cron/reindex?secret=YOUR_CRON_SECRET"
```

The cron job will automatically run weekly to refresh the content.

## API Endpoints

### Instagram Webhook

- **GET** `/api/ig/webhook` - Webhook verification
- **POST** `/api/ig/webhook` - Receive Instagram messages

### Cron Reindexing

- **GET** `/api/cron/reindex` - Crawl website and update vector store
  - Runs automatically every Sunday at midnight UTC
  - Can be triggered manually with `?secret=YOUR_CRON_SECRET`

## How It Works

### Message Flow

1. User sends Instagram DM to your business page
2. Meta sends webhook event to `/api/ig/webhook`
3. Webhook validates signature and extracts message
4. OpenAI Assistants API generates response using RAG
5. Response sent back to user via Instagram Messaging API

### Content Update Flow

1. Vercel Cron triggers `/api/cron/reindex` weekly
2. Crawler recursively crawls printerior.al
3. Content cleaned and batched into Markdown files
4. Files uploaded to OpenAI vector store
5. Old embeddings replaced with new ones

## Project Structure

```
printeriorai/
├── lib/
│   ├── openai-service.ts      # OpenAI Assistants API integration
│   ├── instagram-client.ts    # Instagram messaging functions
│   └── crawler.ts             # Website crawler
├── pages/
│   ├── api/
│   │   ├── ig/
│   │   │   └── webhook.ts     # Instagram webhook handler
│   │   └── cron/
│   │       └── reindex.ts     # Website reindexing cron
│   └── index.tsx              # Status page
├── .env.example               # Environment variables template
├── vercel.json                # Vercel cron configuration
└── package.json
```

## Customization

### Adjust Crawler Settings

Edit `/pages/api/cron/reindex.ts`:

```typescript
const pages = await crawlWebsite(WEBSITE_URL, {
  maxDepth: 5,      // Maximum crawl depth
  maxPages: 200,    // Maximum pages to crawl
  sameDomainOnly: true,
});
```

### Modify System Prompt

Edit `/lib/openai-service.ts` to customize the assistant's behavior:

```typescript
const SYSTEM_PROMPT = `Your custom prompt here...`;
```

### Change Cron Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reindex",
      "schedule": "0 0 * * 0"  // Cron expression
    }
  ]
}
```

## Troubleshooting

### Webhook not receiving messages

- Verify webhook URL is correct in Meta dashboard
- Check webhook signature validation
- Ensure `META_APP_SECRET` matches your app's secret

### AI responses in English

- Check system prompt in `openai-service.ts`
- Verify assistant configuration in OpenAI dashboard
- Review `ensureAlbanianOnly()` function

### Crawler not working

- Check website URL is accessible
- Verify OpenAI API key has sufficient credits
- Review crawler logs in Vercel dashboard

### SSL Certificate Issues

**Development**: SSL validation is disabled for local testing (allows self-signed certificates)

**Production**: SSL validation is enabled for security. If printerior.al has a self-signed certificate, the crawler will fail in production.

**Solution**: Install a valid SSL certificate on printerior.al using [Let's Encrypt](https://letsencrypt.org/) or your hosting provider. See [SECURITY.md](file:///Users/eshkurti/Development/Antigravity/printeriorai/SECURITY.md) for details.

**Temporary workaround** (not recommended): Set `NODE_ENV=development` in production, but this reduces security.

## License

MIT
