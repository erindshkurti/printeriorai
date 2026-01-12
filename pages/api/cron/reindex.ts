import type { NextApiRequest, NextApiResponse } from 'next';
import { crawlWebsite, batchPagesToMarkdown } from '@/lib/crawler';
import { openai } from '@/lib/openai-service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CRON_SECRET = process.env.CRON_SECRET;
const VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID;
const WEBSITE_URL = 'https://printerior.al/';

/**
 * Verify cron request is from Vercel
 */
function verifyCronRequest(req: NextApiRequest): boolean {
    // Check User-Agent
    const userAgent = req.headers['user-agent'];
    if (userAgent && userAgent.includes('vercel-cron')) {
        return true;
    }

    // Check Authorization header or query parameter
    const authHeader = req.headers['authorization'];
    const cronSecret = req.query.secret;

    if (authHeader === `Bearer ${CRON_SECRET}` || cronSecret === CRON_SECRET) {
        return true;
    }

    return false;
}

/**
 * Upload files to OpenAI vector store
 */
async function uploadToVectorStore(markdownBatches: string[]): Promise<void> {
    if (!VECTOR_STORE_ID) {
        throw new Error('OPENAI_VECTOR_STORE_ID is not set');
    }

    console.log(`Uploading ${markdownBatches.length} files to vector store...`);
    console.log(`OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);
    console.log(`VECTOR_STORE_ID: ${VECTOR_STORE_ID}`);

    let openaiClient;
    try {
        openaiClient = openai();
        console.log(`OpenAI client created successfully`);
    } catch (error) {
        console.error('Error creating OpenAI client:', error);
        throw new Error(`Failed to create OpenAI client: ${error}`);
    }

    // Get existing files in vector store
    // @ts-ignore - vectorStores API exists but may not be fully typed
    const existingFiles = await openaiClient.beta.vectorStores.files.list(VECTOR_STORE_ID);

    // Delete existing files
    console.log(`Deleting ${existingFiles.data.length} existing files...`);
    for (const file of existingFiles.data) {
        try {
            // @ts-ignore - vectorStores API exists but may not be fully typed
            await openaiClient.beta.vectorStores.files.del(VECTOR_STORE_ID, file.id);
        } catch (error) {
            console.error(`Error deleting file ${file.id}:`, error);
        }
    }

    // Create temporary directory for files
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'printerior-'));

    try {
        // Write markdown batches to temporary files
        const filePaths: string[] = [];
        for (let i = 0; i < markdownBatches.length; i++) {
            const filePath = path.join(tempDir, `batch_${i + 1}.md`);
            fs.writeFileSync(filePath, markdownBatches[i], 'utf-8');
            filePaths.push(filePath);
        }

        // Upload files to OpenAI
        const uploadedFileIds: string[] = [];
        const openaiClient = openai();
        for (const filePath of filePaths) {
            const file = await openaiClient.files.create({
                file: fs.createReadStream(filePath),
                purpose: 'assistants',
            });
            uploadedFileIds.push(file.id);
            console.log(`Uploaded file: ${file.id}`);
        }

        // Add files to vector store
        for (const fileId of uploadedFileIds) {
            // @ts-ignore - vectorStores API exists but may not be fully typed
            await openaiClient.beta.vectorStores.files.create(VECTOR_STORE_ID, {
                file_id: fileId,
            });
            console.log(`Added file ${fileId} to vector store`);
        }

        console.log('Vector store updated successfully');
    } finally {
        // Clean up temporary files
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

/**
 * Reindex website content
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify cron request
    if (!verifyCronRequest(req)) {
        console.error('Unauthorized cron request');
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        console.log('Starting website reindex...');

        // Crawl website
        const pages = await crawlWebsite(WEBSITE_URL, {
            maxDepth: 5,
            maxPages: 200,
            sameDomainOnly: true,
        });

        console.log(`Crawled ${pages.length} pages`);

        if (pages.length === 0) {
            return res.status(500).json({ error: 'No pages crawled' });
        }

        // Batch pages into Markdown files
        const markdownBatches = batchPagesToMarkdown(pages, 50);
        console.log(`Created ${markdownBatches.length} markdown batches`);

        // Upload to vector store
        await uploadToVectorStore(markdownBatches);

        res.status(200).json({
            success: true,
            pagesCrawled: pages.length,
            batchesCreated: markdownBatches.length,
            message: 'Website reindexed successfully',
        });
    } catch (error) {
        console.error('Error reindexing website:', error);
        res.status(500).json({
            error: 'Failed to reindex website',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
