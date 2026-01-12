
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Ensure we have the API key
if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const CONTENT_FILE = 'data/printerior-content.json';
const OUTPUT_FILE = 'data/embeddings.json';

interface ContentChunk {
    url: string;
    title: string;
    text: string;
    embedding?: number[];
}

async function main() {
    console.log('Reading content file...');
    const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8')) as ContentChunk[];
    console.log(`Found ${content.length} chunks.`);

    const embeddedContent: ContentChunk[] = [];
    const batchSize = 100; // OpenAI batch size limit usually higher, but 100 is safe

    console.log('Generating embeddings...');

    for (let i = 0; i < content.length; i += batchSize) {
        const batch = content.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1}/${Math.ceil(content.length / batchSize)}...`);

        try {
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: batch.map(chunk => chunk.text.replace(/\n/g, ' ')),
                encoding_format: 'float',
            });

            response.data.forEach((item, index) => {
                embeddedContent.push({
                    ...batch[index],
                    embedding: item.embedding
                });
            });

        } catch (error) {
            console.error('Error generating embeddings for batch:', error);
        }
    }

    console.log(`Generated ${embeddedContent.length} embeddings.`);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(embeddedContent)); // Minified JSON
    console.log(`Saved embeddings to ${OUTPUT_FILE}`);
}

main().catch(console.error);
