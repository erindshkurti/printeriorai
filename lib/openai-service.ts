import OpenAI from 'openai';

// Lazy initialization to avoid errors when API key is not set
let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
    if (!openaiInstance) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        openaiInstance = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiInstance;
}

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;
const VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID;

/**
 * System prompt for the Albanian-only Instagram assistant
 */
const SYSTEM_PROMPT = `Ju jeni asistent virtual për Printerior.al, një kompani që ofron shërbime të printimit dhe dizajnit.

RREGULLA TË RËNDËSISHME:
1. Përgjigjuni VETËM në gjuhën shqipe
2. Përdorni vetëm informacionin nga faqja e internetit printerior.al
3. Nëse nuk jeni të sigurt për përgjigjen, kërkoni sqarim ose sugjeroni kontakt njerëzor
4. Mos shpikni çmime, afate kohe, ose politika
5. Jini të shkurtër, profesional dhe të sjellshëm

Nëse pyetja është jashtë fushës së informacionit tuaj:
- Kërkoni sqarim nëse pyetja nuk është e qartë
- Sugjeroni kontakt përmes WhatsApp ose email për pyetje specifike të çmimeve
- Ofroni numrin e telefonit ose email-in e kompanisë nëse është e nevojshme`;


import fs from 'fs';
import path from 'path';
import embeddingsData from '../data/embeddings.json';

// Load embeddings into memory once
let vectorStore: any[] | null = null;

function loadVectorStore() {
    if (!vectorStore) {
        console.log('Loading vector store...');
        try {
            vectorStore = embeddingsData as any[];
            console.log(`Loaded ${vectorStore?.length} embeddings from import.`);
        } catch (error) {
            console.error('Failed to load embeddings:', error);
            vectorStore = [];
        }
    }
    return vectorStore;
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

/**
 * Generate a response using Local RAG (Standard Chat Completion)
 * Much faster than Assistants API
 */
export async function generateResponse(
    message: string,
    threadId?: string
): Promise<{ response: string; threadId: string }> {
    try {
        const openai = getOpenAIClient();

        // 1. Embed the query
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: message,
            encoding_format: 'float',
        });
        const queryVector = embeddingResponse.data[0].embedding;

        // 2. Search local memory
        console.log('generateResponse: Step 3 - Search Local Store');
        const store = loadVectorStore();
        let context = '';

        if (store && store.length > 0) {
            const matches = store.map(item => ({
                item,
                similarity: cosineSimilarity(queryVector, item.embedding)
            }))
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 5); // Get top 5 chunks

            context = matches.map(m => m.item.text).join('\n\n');
            console.log(`Found ${matches.length} context chunks. Top similarity: ${matches[0]?.similarity.toFixed(4)}`);
        }

        // 3. Generate Answer
        console.log('generateResponse: Step 4 - Generate Completion');
        const messages: any[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            {
                role: 'user',
                content: `Context:\n${context}\n\nQuestion: ${message}`
            }
        ];

        const completionPromise = openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
        });

        // Force a timeout of 8 seconds (Vercel limit is 10s)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('OpenAI Request Timed Out (>8s)')), 8000)
        );

        console.log('generateResponse: Step 4.5 - Awaiting Completion with Timeout...');

        // Race the request against the clock
        const completion = await Promise.race([completionPromise, timeoutPromise]) as any;

        console.log('generateResponse: Step 5 - Completion Received');
        const responseText = completion.choices[0].message.content || '';
        const validatedResponse = ensureAlbanianOnly(responseText);

        return {
            response: validatedResponse,
            threadId: 'local-rag', // No persistent threads in this simple mode
        };

    } catch (error: any) {
        console.error('Error generating response:', error.message || error);
        throw error;
    }
}

/**
 * Basic validation to ensure response is in Albanian
 * This is a simple check - you may want to enhance it
 */
function ensureAlbanianOnly(response: string): string {
    // If response contains common English phrases that shouldn't be there,
    // return a fallback Albanian message
    const englishIndicators = [
        'I am sorry',
        'I cannot',
        'I don\'t know',
        'Please contact',
        'Thank you',
    ];

    const hasEnglish = englishIndicators.some(phrase =>
        response.toLowerCase().includes(phrase.toLowerCase())
    );

    if (hasEnglish) {
        return 'Më falni, nuk kam informacion të mjaftueshëm për të përgjigjur në këtë pyetje. Ju lutem kontaktoni ekipin tonë drejtpërdrejt për më shumë informacion.';
    }

    return response;
}

export { getOpenAIClient as openai };
