
async function testOpenAI() {
    console.log('Testing OpenAI Vector Store RAG response...\n');

    const { generateResponse } = await import('../lib/openai-service');

    const testMessage = 'Çfarë shërbimesh ofroni?';
    console.log(`Question: ${testMessage}\n`);

    const startTime = Date.now();

    try {
        const { response } = await generateResponse(testMessage);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Response received in ${duration} seconds:\n`);
        console.log(response);
        console.log('\n---\n');

        if (parseFloat(duration) > 10) {
            console.log('⚠️ WARNING: Response took longer than 10 seconds!');
        } else {
            console.log('✅ Response time is AWESOME (< 3s).');
        }
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Error after ${duration} seconds:`, error);
    }
}

testOpenAI();
