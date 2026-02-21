import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', uploadRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, _req, res, _next) => {
    console.error('Server error:', err.message);
    if (err.message?.includes('Unsupported file type')) {
        return res.status(400).json({ error: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 100 MB.' });
    }
    res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
    console.log(`🧠 DocBrain server running at http://localhost:${PORT}`);
});
