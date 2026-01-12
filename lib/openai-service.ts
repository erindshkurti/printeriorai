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

/**
 * Create or get the assistant
 */
export async function getOrCreateAssistant(): Promise<string> {
    if (ASSISTANT_ID) {
        return ASSISTANT_ID;
    }

    // Create a new assistant if not exists
    const openai = getOpenAIClient();
    const assistant = await openai.beta.assistants.create({
        name: 'Printerior.al Assistant',
        instructions: SYSTEM_PROMPT,
        model: 'gpt-4o-mini',
        tools: [{ type: 'file_search' }],
        tool_resources: {
            file_search: {
                vector_store_ids: [VECTOR_STORE_ID!],
            },
        },
    });

    console.log('Created new assistant:', assistant.id);
    return assistant.id;
}

/**
 * Generate a response using OpenAI Assistants API with RAG
 */
export async function generateResponse(
    message: string,
    threadId?: string
): Promise<{ response: string; threadId: string }> {
    try {
        const openai = getOpenAIClient();
        const assistantId = await getOrCreateAssistant();

        // Create or use existing thread
        let thread;
        if (threadId) {
            thread = { id: threadId };
        } else {
            thread = await openai.beta.threads.create();
        }

        // Add user message to thread
        await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: message,
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: assistantId,
        });

        if (run.status === 'completed') {
            // Get the assistant's response
            const messages = await openai.beta.threads.messages.list(thread.id);
            const lastMessage = messages.data[0];

            if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
                const responseText = lastMessage.content[0].text.value;

                // Validate Albanian-only response (basic check)
                const validatedResponse = ensureAlbanianOnly(responseText);

                return {
                    response: validatedResponse,
                    threadId: thread.id,
                };
            }
        }

        // Log detailed error information
        console.error('Assistant run failed!');
        console.error('Run status:', run.status);
        console.error('Run ID:', run.id);
        if (run.last_error) {
            console.error('Last error:', JSON.stringify(run.last_error, null, 2));
        }

        throw new Error(`Assistant run failed with status: ${run.status}`);
    } catch (error) {
        console.error('Error generating response:', error);
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

/**
 * Create a new thread for a conversation
 */
export async function createThread(): Promise<string> {
    const openai = getOpenAIClient();
    const thread = await openai.beta.threads.create();
    return thread.id;
}

export { getOpenAIClient as openai };
