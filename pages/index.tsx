export default function Home() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '2rem'
        }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                Instagram AI Assistant
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#666', textAlign: 'center', maxWidth: '600px' }}>
                AI-powered Instagram DM assistant for Printerior.al
            </p>
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px', maxWidth: '600px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Status</h2>
                <ul style={{ lineHeight: '1.8' }}>
                    <li>✅ Instagram Webhook: <code>/api/ig/webhook</code></li>
                    <li>✅ Reindex Cron: <code>/api/cron/reindex</code></li>
                    <li>✅ OpenAI RAG Integration</li>
                    <li>✅ Albanian-only Responses</li>
                </ul>
            </div>
            <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#999' }}>
                <p>Configure environment variables to get started</p>
            </div>
        </div>
    );
}
