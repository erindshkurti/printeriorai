/**
 * Crawl Assessment Script
 * Tests how many pages are discoverable from printerior.al
 */

import { crawlWebsite } from '../lib/crawler';

async function assessCrawl() {
    console.log('🕷️  Crawl Assessment for printerior.al\n');
    console.log('═══════════════════════════════════════════\n');

    const startUrl = 'https://printerior.al/';

    // Test with expanded limits
    console.log('📊 Test 1: Expanded Limits');
    console.log('   maxDepth: 10, maxPages: 1000\n');

    const startTime1 = Date.now();
    const pages1 = await crawlWebsite(startUrl, {
        maxDepth: 10,
        maxPages: 1000,
        sameDomainOnly: true,
    });
    const duration1 = ((Date.now() - startTime1) / 1000).toFixed(1);

    console.log(`\n✅ Found ${pages1.length} pages in ${duration1}s\n`);

    // Group pages by depth
    const byDepth: { [key: number]: string[] } = {};
    for (const page of pages1) {
        if (!byDepth[page.depth]) byDepth[page.depth] = [];
        byDepth[page.depth].push(page.url);
    }

    console.log('📈 Pages by depth:');
    for (const [depth, urls] of Object.entries(byDepth).sort((a, b) => Number(a[0]) - Number(b[0]))) {
        console.log(`   Depth ${depth}: ${urls.length} pages`);
    }

    console.log('\n📋 All discovered URLs:');
    pages1.forEach((page, i) => {
        console.log(`   ${i + 1}. [D${page.depth}] ${page.title}`);
        console.log(`       ${page.url}`);
    });

    // Content analysis
    console.log('\n📊 Content Analysis:');
    const totalContent = pages1.reduce((sum, p) => sum + p.content.length, 0);
    const avgContent = Math.round(totalContent / pages1.length);

    console.log(`   Total content: ${(totalContent / 1024).toFixed(1)} KB`);
    console.log(`   Average per page: ${avgContent} chars`);

    // Find pages with minimal content (might be empty/broken)
    const thinPages = pages1.filter(p => p.content.length < 200);
    if (thinPages.length > 0) {
        console.log(`\n⚠️  Pages with minimal content (<200 chars):`);
        thinPages.forEach(p => {
            console.log(`   - ${p.url} (${p.content.length} chars)`);
        });
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('📌 SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`   Total pages found: ${pages1.length}`);
    console.log(`   Max depth reached: ${Math.max(...pages1.map(p => p.depth))}`);
    console.log(`   Hit page limit: ${pages1.length >= 1000 ? '⚠️ YES - may be missing pages!' : '✅ No'}`);
    console.log(`   Total content: ${(totalContent / 1024).toFixed(1)} KB`);
}

assessCrawl().catch(console.error);
