import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export interface CrawlOptions {
    maxDepth?: number;
    maxPages?: number;
    sameDomainOnly?: boolean;
}

export interface CrawledPage {
    url: string;
    title: string;
    content: string;
    depth: number;
}

/**
 * Crawl a website recursively
 */
export async function crawlWebsite(
    startUrl: string,
    options: CrawlOptions = {}
): Promise<CrawledPage[]> {
    const {
        maxDepth = 5,
        maxPages = 200,
        sameDomainOnly = true,
    } = options;

    const visited = new Set<string>();
    const pages: CrawledPage[] = [];
    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
    const startDomain = new URL(startUrl).hostname;

    while (queue.length > 0 && pages.length < maxPages) {
        const { url, depth } = queue.shift()!;

        // Skip if already visited or max depth reached
        if (visited.has(url) || depth > maxDepth) {
            continue;
        }

        visited.add(url);

        try {
            console.log(`Crawling: ${url} (depth: ${depth})`);

            const html = await fetchPage(url);
            const { title, content, links } = extractContent(html, url);

            pages.push({
                url,
                title,
                content,
                depth,
            });

            // Add new links to queue if not at max depth
            if (depth < maxDepth) {
                for (const link of links) {
                    const normalizedLink = normalizeUrl(link);

                    if (!visited.has(normalizedLink)) {
                        // Check if same domain
                        if (sameDomainOnly) {
                            try {
                                const linkDomain = new URL(normalizedLink).hostname;
                                if (linkDomain === startDomain) {
                                    queue.push({ url: normalizedLink, depth: depth + 1 });
                                }
                            } catch (e) {
                                // Invalid URL, skip
                            }
                        } else {
                            queue.push({ url: normalizedLink, depth: depth + 1 });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error crawling ${url}:`, error);
        }
    }

    console.log(`Crawled ${pages.length} pages`);
    return pages;
}

/**
 * Fetch HTML content from a URL
 */
async function fetchPage(url: string): Promise<string> {
    const response = await axios.get(url, {
        timeout: 10000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PrinteriorBot/1.0)',
        },
        // Allow self-signed certificates (printerior.al uses self-signed cert)
        httpsAgent: new (await import('https')).Agent({
            rejectUnauthorized: false,
        }),
    });
    return response.data;
}

/**
 * Extract content and links from HTML
 */
function extractContent(
    html: string,
    baseUrl: string
): { title: string; content: string; links: string[] } {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, iframe, noscript').remove();
    $('.navigation, .menu, .sidebar, .footer, .header').remove();

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';

    // Extract main content
    let content = '';

    // Try to find main content area
    const mainContent = $('main, article, .content, .main-content, #content').first();
    if (mainContent.length > 0) {
        content = mainContent.text();
    } else {
        content = $('body').text();
    }

    // Clean up content
    content = content
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
        .trim();

    // Extract links
    const links: string[] = [];
    $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
            try {
                const absoluteUrl = new URL(href, baseUrl).href;
                links.push(absoluteUrl);
            } catch (e) {
                // Invalid URL, skip
            }
        }
    });

    return { title, content, links };
}

/**
 * Normalize URL (remove fragments, trailing slashes, etc.)
 */
export function normalizeUrl(url: string): string {
    try {
        const parsed = new URL(url);
        // Remove fragment
        parsed.hash = '';
        // Remove trailing slash
        if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
            parsed.pathname = parsed.pathname.slice(0, -1);
        }
        return parsed.href;
    } catch (e) {
        return url;
    }
}

/**
 * Batch pages into Markdown files
 */
export function batchPagesToMarkdown(
    pages: CrawledPage[],
    batchSize: number = 50
): string[] {
    const batches: string[] = [];

    for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize);
        const markdown = batch
            .map(page => {
                return `# ${page.title}\n\nURL: ${page.url}\n\n${page.content}\n\n---\n`;
            })
            .join('\n');

        batches.push(markdown);
    }

    return batches;
}

/**
 * Check if URL is valid and belongs to the same domain
 */
export function isValidUrl(url: string, baseDomain: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.hostname === baseDomain;
    } catch (e) {
        return false;
    }
}
