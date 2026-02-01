
async function testQuality() {
    console.log('Testing OpenAI Vector Store Response Quality...\n');

    // Dynamic import
    const { generateResponse } = await import('../lib/openai-service');

    const questions = [
        "Ku ndodheni?",
        "A beni dërgesa ne Kosove?",
        "Cfare materialesh perdorni?",
        "Sa kushton nje leter murale?",
        "A mund te bej dizajn te personalizuar?"
    ];

    for (const q of questions) {
        console.log(`\n-----------------------------------`);
        console.log(`❓ Question: ${q}`);
        const startTime = Date.now();

        try {
            const { response } = await generateResponse(q);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log(`⏱️ Time: ${duration}s`);
            console.log(`🤖 Answer:\n${response}`);
        } catch (error) {
            console.error('❌ Error:', error);
        }
    }
}

testQuality();
