
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://printerior.al';
const MAX_DEPTH = 2;
const OUTPUT_FILE = 'data/printerior-content.json';

interface ContentChunk {
    url: string;
    title: string;
    text: string;
    tokenCount?: number;
}

const visited = new Set<string>();
const contentChunks: ContentChunk[] = [];

async function crawl(url: string, depth: number) {
    if (depth > MAX_DEPTH || visited.has(url)) return;

    // Only crawl same domain
    if (!url.startsWith(BASE_URL)) return;

    visited.add(url);
    console.log(`Crawling: ${url} (Depth: ${depth})`);

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; PrinteriorBot/1.0)'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Remove script, style, nav, footer to get main content
        $('script, style, nav, footer, header').remove();

        const title = $('title').text().trim();
        let text = $('body').text()
            .replace(/\s+/g, ' ')
            .trim();

        // Split large text into chunks (approx 1000 chars)
        const chunks = splitText(text, 1000);

        chunks.forEach(chunk => {
            if (chunk.length > 50) { // Filter extremely short chunks
                contentChunks.push({
                    url,
                    title,
                    text: chunk
                });
            }
        });

        // Find links
        if (depth < MAX_DEPTH) {
            const links = $('a[href]');
            const nextLinks: string[] = [];

            links.each((_, element) => {
                const href = $(element).attr('href');
                if (href) {
                    try {
                        const absoluteUrl = new URL(href, BASE_URL).toString();
                        if (absoluteUrl.startsWith(BASE_URL) && !visited.has(absoluteUrl)) {
                            nextLinks.push(absoluteUrl);
                        }
                    } catch (e) {
                        // Invalid URL
                    }
                }
            });

            // Process links sequentially to be nice to the server
            for (const link of nextLinks) {
                await crawl(link, depth + 1);
            }
        }

    } catch (error: any) {
        console.error(`Failed to crawl ${url}:`, error.message);
    }
}

function splitText(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    // Split by sentences roughly
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxLength) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += sentence + ' ';
        }
    }
    if (currentChunk) chunks.push(currentChunk.trim());

    return chunks;
}

async function main() {
    // Ensure data directory exists
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }

    console.log('Starting crawler...');
    await crawl(BASE_URL, 0);

    console.log(`Finished crawling. Found ${contentChunks.length} chunks.`);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(contentChunks, null, 2));
    console.log(`Saved content to ${OUTPUT_FILE}`);
}

main().catch(console.error);
