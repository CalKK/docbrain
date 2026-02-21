import { readFileSync } from 'fs';
import { extractContent } from '../server/nlp/extractor.js';

export const config = {
    api: {
        bodyParser: false,
    },
};

/**
 * Parse multipart form data manually using formidable.
 */
async function parseForm(req) {
    const { IncomingForm } = await import('formidable');
    const form = new IncomingForm({
        maxFileSize: 50 * 1024 * 1024,
        keepExtensions: true,
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
}

/**
 * Parse PDF buffer — try pdf-parse v2 first, fall back to simpler extraction.
 */
async function parsePdfBuffer(buffer) {
    try {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();

        let pageCount = 1;
        try {
            const info = await parser.getInfo();
            pageCount = info.total || 1;
        } catch { /* ignore */ }

        try { await parser.destroy(); } catch { /* ignore */ }

        const text = result.text || '';
        const pages = text.split(/\f|\n{3,}/).map(p => p.trim()).filter(p => p.length > 20);

        return { text, pages: pages.length > 0 ? pages : [text], pageCount, info: {} };
    } catch (e) {
        console.error('pdf-parse v2 failed, trying fallback:', e.message);

        // Fallback: extract raw text from PDF (basic text extraction)
        const textContent = buffer.toString('utf-8');
        // Extract text between BT and ET markers (PDF text objects)
        const textMatches = textContent.match(/\(([^)]+)\)/g) || [];
        const extractedText = textMatches
            .map(m => m.slice(1, -1))
            .filter(t => t.length > 2 && !/^\d+$/.test(t))
            .join(' ');

        return {
            text: extractedText || 'Unable to extract text from this PDF.',
            pages: [extractedText],
            pageCount: 1,
            info: {},
        };
    }
}

/**
 * Parse DOCX buffer using mammoth.
 */
async function parseDocxBuffer(buffer) {
    const mammoth = await import('mammoth');
    const result = await mammoth.default.extractRawText({ buffer });
    const text = result.value;

    const paragraphs = text.split(/\n\n+/).filter(Boolean);
    const pages = [];
    let currentPage = '';

    for (const para of paragraphs) {
        if (currentPage.length + para.length > 3000 && currentPage.length > 0) {
            pages.push(currentPage.trim());
            currentPage = para;
        } else {
            currentPage += '\n\n' + para;
        }
    }
    if (currentPage.trim()) pages.push(currentPage.trim());

    return { text, pages, pageCount: pages.length || 1, info: {} };
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // Parse form data
        const { files } = await parseForm(req);

        const uploaded = files.document;
        if (!uploaded) {
            return res.status(400).json({ error: 'No file uploaded. Field name must be "document".' });
        }

        const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
        const { mimetype, filepath, originalFilename, size } = file;

        const allowed = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
        ];
        if (!allowed.includes(mimetype)) {
            return res.status(400).json({ error: 'Unsupported file type. Upload PDF or Word.' });
        }

        console.log(`📄 Processing: ${originalFilename} (${(size / 1024 / 1024).toFixed(2)} MB)`);

        const buffer = readFileSync(filepath);

        // Parse document
        let parsed;
        if (mimetype === 'application/pdf') {
            parsed = await parsePdfBuffer(buffer);
        } else {
            parsed = await parseDocxBuffer(buffer);
        }

        if (!parsed.text || parsed.text.length < 10) {
            return res.status(400).json({ error: 'Could not extract text from the document. It may be scanned/image-based.' });
        }

        console.log(`📖 Extracted ${parsed.pageCount} pages, ${parsed.text.length} chars`);

        // NLP extraction
        const content = extractContent(parsed.text);

        console.log(`🧠 Generated: ${content.stats.totalQuestions}q, ${content.stats.totalFlashcards}f`);

        return res.status(200).json({
            filename: originalFilename,
            fileSize: size,
            pageCount: parsed.pageCount,
            ...content,
        });
    } catch (err) {
        console.error('❌ Error:', err);
        return res.status(500).json({
            error: err.message || 'Failed to process the document.',
            details: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        });
    }
}
