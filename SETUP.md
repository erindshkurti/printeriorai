# Instagram AI Assistant - Quick Setup Guide

This guide will help you get the Instagram AI Assistant up and running.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] OpenAI account with API access
- [ ] Meta Developer account
- [ ] Instagram Business account
- [ ] Vercel account (for deployment)

---

## Step 1: OpenAI Setup

### Create Vector Store

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Navigate to **Dashboard** → **Storage** (left sidebar)
3. Click **Create vector store**
4. Name it: `printerior-knowledge-base`
5. Click **Create**
6. **Copy the Vector Store ID** (starts with `vs_`)

### Get API Key

1. In OpenAI dashboard, go to **API Keys** (left sidebar)
2. Click **Create new secret key**
3. Choose **Service account** (recommended for production)
4. Name it: `instagram-assistant`
5. **Copy the API key** (starts with `sk-`)
   - ⚠️ **Save it immediately** - you won't see it again!

**Note:** The Assistant will be created automatically on first use - no manual setup needed!

---

## Step 2: Meta Developer Setup

### Create App

1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Click **My Apps** (top navigation)
3. Click **Create App**
4. Select **Other** → **Business** as app type
5. App name: `Printerior Instagram Assistant`
6. Click **Create App**

### Add Instagram Messaging Use Case

1. In your app dashboard, click **Use cases** in the left sidebar
2. Click **Add use case**
3. Find **Respond to messages and comments on Instagram** and click **Add**
4. Click **Customize** on the added use case

### Configure API Setup with Instagram Login

1. In the Use Case customization page, you'll see a 4-step setup:
   - ✅ Add required messaging permissions
   - 🔲 Generate access tokens
   - 🔲 Configure webhooks
   - 🔲 Set up Instagram business login

2. **Step 1 - Permissions**: These are auto-granted. Verify you see:
   - `instagram_business_basic`
   - `instagram_manage_comments`
   - `instagram_business_manage_messages`

3. **Step 2 - Generate Access Tokens**:
   - Click **Add account** to link your Instagram Business account
   - Click **Generate token** next to your account
   - Log in with Instagram credentials when prompted
   - Complete 2FA if required
   - ✅ Check "I understand" and copy the token
   - **This is your `IG_PAGE_ACCESS_TOKEN`** (starts with `IGAAS...`)

4. **Step 3 - Configure Webhooks** (Do AFTER deploying to Vercel):
   - Callback URL: `https://your-app.vercel.app/api/ig/webhook`
   - Verify Token: Create a random string (e.g., `my_secure_verify_token_123`)
   - Click **Verify and save**
   - Subscribe to webhook fields: **messages** ✅

### Get App Secret

1. In left sidebar, click **App settings** → **Basic**
2. Find **App Secret** and click **Show**
3. **Copy the App Secret** - this is your `META_APP_SECRET`

---

## Step 3: Local Setup

### Clone and Install

```bash
cd /Users/eshkurti/Development/Antigravity/printeriorai
npm install
```

### Configure Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Meta/Instagram
META_VERIFY_TOKEN=my_secure_verify_token_123
META_APP_SECRET=your_app_secret_from_meta
IG_PAGE_ACCESS_TOKEN=your_page_access_token_from_meta

# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key
OPENAI_VECTOR_STORE_ID=vs_your_vector_store_id
OPENAI_ASSISTANT_ID=  # Leave empty, will be created automatically

# Security
CRON_SECRET=create_a_random_secret_here
```

### Test Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) - you should see the status page.

---

## Step 4: Deploy to Vercel

### Install Vercel CLI

```bash
npm install -g vercel
```

### Deploy

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No**
- Project name? **printeriorai** (or your choice)
- Directory? **./** (current directory)
- Override settings? **No**

### Add Environment Variables

After deployment, add environment variables in Vercel:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all variables from your `.env.local`
5. Click **Save**

### Redeploy

```bash
vercel --prod
```

**Copy your production URL** (e.g., `https://printeriorai.vercel.app`)

---

## Step 5: Configure Meta Webhook

Now that you have a production URL:

1. Go back to Meta Developer dashboard
2. Navigate to **Use cases** → Click **Customize** on your Instagram use case
3. Expand **Configure webhooks** section
4. Enter your settings:
   - Callback URL: `https://your-app.vercel.app/api/ig/webhook`
   - Verify Token: Same as `META_VERIFY_TOKEN` in your env vars
5. Click **Verify and save**
6. Ensure **messages** field is ✅ Subscribed

If verification succeeds, you'll see a green checkmark ✅

---

## Step 6: Initial Content Indexing

Trigger the first website crawl:

```bash
curl -X GET "https://your-app.vercel.app/api/cron/reindex?secret=YOUR_CRON_SECRET"
```

This will:
- Crawl printerior.al
- Extract content from all pages
- Upload to OpenAI vector store
- Takes 2-5 minutes depending on website size

**Expected response:**
```json
{
  "success": true,
  "pagesCrawled": 45,
  "batchesCreated": 1,
  "message": "Website reindexed successfully"
}
```

---

## Step 7: Test End-to-End

### Send Test Message

1. Open Instagram app
2. Go to your business page
3. Send a DM: `Çfarë shërbimesh ofroni?` (What services do you offer?)

### Verify Response

You should receive an Albanian response based on printerior.al content within a few seconds.

### Check Logs

View logs in Vercel dashboard:
1. Go to your project
2. Click **Deployments**
3. Click latest deployment
4. Click **Functions** tab
5. View logs for `/api/ig/webhook`

---

## Troubleshooting

### Webhook Verification Failed

**Problem:** Meta shows "Verification Failed" error

**Solutions:**
- Ensure `META_VERIFY_TOKEN` in Vercel matches the token in Meta dashboard
- Check webhook URL is correct (must be HTTPS)
- View Vercel function logs for errors

### No Response from Bot

**Problem:** Message sent but no reply received

**Solutions:**
- Check Vercel function logs for errors
- Verify `IG_PAGE_ACCESS_TOKEN` has correct permissions
- Ensure OpenAI API key has credits
- Check vector store has content (run reindex)

### Response in English

**Problem:** Bot responds in English instead of Albanian

**Solutions:**
- Check system prompt in `lib/openai-service.ts`
- Verify assistant is using the correct instructions
- Review `ensureAlbanianOnly()` function

### Crawler Errors

**Problem:** Reindex endpoint returns errors

**Solutions:**
- Verify printerior.al is accessible
- Check OpenAI API key is valid
- Ensure vector store ID is correct
- Review crawler logs in Vercel

---

## Maintenance

### Weekly Auto-Refresh

The cron job runs automatically every Sunday at midnight UTC. No action needed.

### Manual Refresh

To manually refresh content:

```bash
curl -X GET "https://your-app.vercel.app/api/cron/reindex?secret=YOUR_CRON_SECRET"
```

### Monitor Usage

- **OpenAI:** Check usage at [platform.openai.com/usage](https://platform.openai.com/usage)
- **Vercel:** Check function invocations in dashboard
- **Meta:** Check webhook deliveries in developer dashboard

---

## Security Best Practices

✅ **Never commit `.env.local`** - Already in `.gitignore`

✅ **Use strong secrets** - Generate random strings for tokens

✅ **Rotate tokens periodically** - Update in Vercel dashboard

✅ **Monitor API usage** - Set up billing alerts in OpenAI

✅ **Review logs regularly** - Check for unusual activity

---

## Success Checklist

- [ ] OpenAI Vector Store created
- [ ] OpenAI API key configured
- [ ] Meta Developer App created
- [ ] Instagram Messaging product added
- [ ] Page Access Token obtained
- [ ] Environment variables configured in Vercel
- [ ] Deployed to Vercel successfully
- [ ] Webhook verified in Meta dashboard
- [ ] Initial content indexing completed
- [ ] Test message sent and received
- [ ] Response is in Albanian
- [ ] Response is grounded in website content

---

## Next Steps

Once everything is working:

1. **Monitor Performance:** Check response times and accuracy
2. **Gather Feedback:** See how users interact with the bot
3. **Refine Prompts:** Adjust system prompt based on feedback
4. **Add Features:** Consider implementing:
   - Human handoff for complex queries
   - Lead capture and CRM integration
   - Analytics dashboard
   - Multi-language support (if needed)

---

## Support

If you encounter issues:

1. Check the [README.md](file:///Users/eshkurti/Development/Antigravity/printeriorai/README.md) for detailed documentation
2. Review Vercel function logs
3. Check OpenAI API status
4. Verify Meta webhook deliveries

**Congratulations! Your Instagram AI Assistant is now live! 🎉**
