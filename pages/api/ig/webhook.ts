import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { generateResponse } from '@/lib/openai-service';
import { sendMessage, sendTypingIndicator } from '@/lib/instagram-client';

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const META_APP_SECRET = process.env.META_APP_SECRET;

/**
 * Verify webhook signature from Meta
 */
function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    return `sha256=${expectedSignature}` === signature;
}

/**
 * Handle incoming Instagram message
 */
async function handleIncomingMessage(
    senderId: string,
    messageText: string
): Promise<void> {
    try {
        console.log(`Received message from ${senderId}: ${messageText}`);

        // Show typing indicator
        await sendTypingIndicator(senderId);

        // Generate AI response using RAG
        const { response } = await generateResponse(messageText);

        // Send response back to user
        await sendMessage(senderId, response);

        console.log(`Sent response to ${senderId}: ${response}`);
    } catch (error) {
        console.error('Error handling message:', error);

        // Send fallback message in Albanian
        try {
            await sendMessage(
                senderId,
                'Më falni, hasëm një problem teknik. Ju lutem provoni përsëri më vonë.'
            );
        } catch (fallbackError) {
            console.error('Error sending fallback message:', fallbackError);
        }
    }
}

/**
 * Instagram Webhook Handler
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        // Webhook verification from Meta
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
            console.log('Webhook verified successfully');
            res.status(200).send(challenge);
        } else {
            console.error('Webhook verification failed');
            res.status(403).send('Forbidden');
        }
    } else if (req.method === 'POST') {
        // Verify webhook signature
        const signature = req.headers['x-hub-signature-256'] as string;
        const payload = JSON.stringify(req.body);

        if (!signature || !verifyWebhookSignature(payload, signature, META_APP_SECRET!)) {
            console.error('Invalid webhook signature');
            return res.status(403).json({ error: 'Invalid signature' });
        }

        // Process webhook event
        const body = req.body;

        if (body.object === 'instagram') {
            for (const entry of body.entry || []) {
                for (const messaging of entry.messaging || []) {
                    // Handle message event
                    if (messaging.message && messaging.message.text) {
                        const senderId = messaging.sender.id;
                        const messageText = messaging.message.text;

                        // Process message asynchronously (don't block webhook response)
                        handleIncomingMessage(senderId, messageText).catch(error => {
                            console.error('Error in handleIncomingMessage:', error);
                        });
                    }
                }
            }
        }

        // Always respond with 200 OK to acknowledge receipt
        res.status(200).json({ success: true });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
