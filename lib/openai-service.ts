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

/**
 * Search OpenAI Vector Store for relevant context
 */
async function searchVectorStore(query: string): Promise<string> {
    if (!VECTOR_STORE_ID) {
        console.warn('OPENAI_VECTOR_STORE_ID not set, skipping vector search');
        return '';
    }

    const openai = getOpenAIClient();

    try {
        console.log('Searching OpenAI vector store...');

        // Use the vector store search endpoint
        const searchResults = await openai.vectorStores.search(VECTOR_STORE_ID, {
            query: query,
            max_num_results: 5,
        });

        if (!searchResults.data || searchResults.data.length === 0) {
            console.log('No results found in vector store');
            return '';
        }

        // Extract text content from search results
        const contextChunks: string[] = [];
        for (const result of searchResults.data) {
            if (result.content && Array.isArray(result.content)) {
                for (const content of result.content) {
                    if (content.type === 'text' && content.text) {
                        contextChunks.push(content.text);
                    }
                }
            }
        }

        const context = contextChunks.join('\n\n');
        console.log(`Found ${searchResults.data.length} results. Context length: ${context.length} characters`);

        return context;
    } catch (error: any) {
        console.error('Error searching vector store:', error.message || error);
        return '';
    }
}

/**
 * Generate a response using OpenAI Vector Store RAG
 * Uses cloud-based vector store for always up-to-date context
 */
export async function generateResponse(
    message: string,
    threadId?: string
): Promise<{ response: string; threadId: string }> {
    try {
        const openai = getOpenAIClient();

        // 1. Search vector store for relevant context
        console.log('generateResponse: Step 1 - Search Vector Store');
        const context = await searchVectorStore(message);

        // 2. Build messages with context
        console.log('generateResponse: Step 2 - Build Messages');
        const messages: any[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            {
                role: 'user',
                content: context
                    ? `Context:\n${context}\n\nQuestion: ${message}`
                    : message
            }
        ];

        // 3. Generate Answer using OpenAI SDK
        console.log('generateResponse: Step 3 - Generate Completion');
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
        });

        const responseText = completion.choices[0]?.message?.content || '';
        const validatedResponse = ensureAlbanianOnly(responseText);
        console.log('OpenAI response received:', validatedResponse);

        return {
            response: validatedResponse,
            threadId: 'cloud-rag',
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
