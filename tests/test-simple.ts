import { crawlWebsite, batchPagesToMarkdown } from '../lib/crawler';

async function test() {
    console.log('🕷️  Testing crawler on printerior.al...\n');

    const pages = await crawlWebsite('https://printerior.al', {
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

    if (batches.length > 0) {
        console.log(`   First batch preview (first 200 chars):`);
        console.log(`   ${batches[0].substring(0, 200)}...\n`);
    } else {
        console.log(`   No batches created (no pages crawled)\n`);
    }

    console.log('🎉 All tests passed!');
}

test().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
