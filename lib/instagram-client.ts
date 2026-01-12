import axios from 'axios';

const PAGE_ACCESS_TOKEN = process.env.IG_PAGE_ACCESS_TOKEN;
const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send a message to an Instagram user via DM
 */
export async function sendMessage(
    recipientId: string,
    messageText: string
): Promise<void> {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            attempt++;
            console.log(`Sending message attempt ${attempt}/${MAX_RETRIES} to ${recipientId}...`);

            const response = await axios.post(
                `${GRAPH_API_URL}/me/messages`,
                {
                    recipient: {
                        id: recipientId,
                    },
                    message: {
                        text: messageText,
                    },
                },
                {
                    params: {
                        access_token: PAGE_ACCESS_TOKEN,
                    },
                    timeout: 5000, // 5s timeout for the request itself
                }
            );

            console.log(`✅ Message sent successfully on attempt ${attempt}:`, JSON.stringify(response.data));
            return; // Success
        } catch (error: any) {
            console.error(`❌ Error attempting to send message (attempt ${attempt}):`, error.response?.data || error.message);

            if (attempt === MAX_RETRIES) {
                console.error('All retry attempts failed.');
                throw error;
            }

            console.log(`Waiting ${RETRY_DELAY}ms before retry...`);
            await sleep(RETRY_DELAY);
        }
    }
}

/**
 * Get user profile information (optional, for future use)
 */
export async function getUserProfile(userId: string): Promise<any> {
    try {
        const response = await axios.get(
            `${GRAPH_API_URL}/${userId}`,
            {
                params: {
                    fields: 'name,username,profile_pic',
                    access_token: PAGE_ACCESS_TOKEN,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
}

/**
 * Mark a message as seen (optional)
 */
export async function markMessageSeen(senderId: string): Promise<void> {
    try {
        await axios.post(
            `${GRAPH_API_URL}/me/messages`,
            {
                recipient: {
                    id: senderId,
                },
                sender_action: 'mark_seen',
            },
            {
                params: {
                    access_token: PAGE_ACCESS_TOKEN,
                },
            }
        );
    } catch (error) {
        console.error('Error marking message as seen:', error);
    }
}

/**
 * Show typing indicator (optional)
 */
export async function sendTypingIndicator(recipientId: string): Promise<void> {
    try {
        await axios.post(
            `${GRAPH_API_URL}/me/messages`,
            {
                recipient: {
                    id: recipientId,
                },
                sender_action: 'typing_on',
            },
            {
                params: {
                    access_token: PAGE_ACCESS_TOKEN,
                },
            }
        );
    } catch (error) {
        console.error('Error sending typing indicator:', error);
    }
}
