Instagram AI Assistant – Implementation Plan (Created with ChatGPT)

This document outlines the implementation plan for building an AI-powered Instagram DM assistant
that answers user questions based strictly on the content of https://printerior.al/.

The solution prioritizes:
• Accurate, website-grounded answers (RAG)
• Minimal integrations
• Albanian-only responses
• Low operational complexity

1. High-Level Architecture

External Integrations:
1. Instagram Messaging API (Meta Graph API)
2. OpenAI API (Responses API + File Search / Vector Store)

Infrastructure:
• Vercel (Next.js, Serverless Functions, Cron Jobs)
• Node.js + TypeScript

2. Core Components
2.1 Instagram Webhook Service

Purpose:
• Receive incoming Instagram DM events
• Verify webhook authenticity
• Trigger AI response generation

Endpoints:
• GET /api/ig/webhook  → Meta verification handshake
• POST /api/ig/webhook → Incoming messages

Key Tasks:
• Validate X-Hub-Signature-256 using META_APP_SECRET
• Extract sender ID and message text
• Forward message to OpenAI for response
• Send reply via Meta Graph API

2.2 AI Response Engine (RAG)

Purpose:
• Generate answers grounded in printerior.al content
• Prevent hallucinations
• Enforce Albanian-only output

Approach:
• Use OpenAI Responses API
• Attach file_search tool referencing vector store
• System prompt enforces:
  - Albanian language only
  - Website-grounded answers
  - Human escalation when unsure

Output:
• Single concise reply per DM

2.3 Website Crawler & Indexer

Purpose:
• Automatically ingest website content
• No manual page selection
• Weekly refresh

Crawler Rules:
• Start URL: https://printerior.al/
• Only same-domain links
• Max depth: 5–6
• Max pages: ~200
• Strip nav/footer/scripts/styles
• Deduplicate URLs

Processing:
• Extract clean text
• Batch pages into Markdown files
• Upload to OpenAI vector store
• Replace previous content on each run

2.4 Scheduled Reindexing

Mechanism:
• Vercel Cron Job (weekly)

Endpoint:
• GET /api/cron/reindex

Security:
• Validate User-Agent (vercel-cron/1.0)
• Require CRON_SECRET query or header

Outcome:
• Fresh vector store every 7 days

3. Project Structure

/pages/api/
  /ig/webhook.ts        → Instagram webhook handler
  /cron/reindex.ts     → Website crawler + indexer
/vercel.json           → Cron schedule

4. Environment Variables

Meta:
• META_VERIFY_TOKEN
• META_APP_SECRET
• IG_PAGE_ACCESS_TOKEN

OpenAI:
• OPENAI_API_KEY
• OPENAI_VECTOR_STORE_ID

Security:
• CRON_SECRET

5. Message Flow (Runtime)

1. User sends Instagram DM
2. Meta sends webhook event to Vercel
3. Webhook validates and parses message
4. OpenAI Responses API called with file_search
5. AI generates grounded Albanian response
6. Response sent back via Instagram Messaging API

6. Content Update Flow (Weekly)

1. Vercel Cron triggers /api/cron/reindex
2. Recursive crawl of printerior.al
3. Content cleaned and batched
4. Files uploaded to OpenAI vector store
5. Old embeddings replaced

7. Guardrails & Business Logic

• Respond only using retrieved content
• If answer is unclear:
  - Ask for clarification OR
  - Suggest WhatsApp / human contact
• No invented prices, timelines, or policies
• Keep replies concise and professional

8. Future Enhancements (Optional)

• Human handoff routing
• Lead capture & CRM sync
• Quote estimation logic
• Analytics dashboard
• Multi-language support

