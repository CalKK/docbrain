import { IncomingForm } from 'formidable';
import { readFileSync } from 'fs';
import { parsePdf } from '../server/parsers/pdfParser.js';
import { parseDocx } from '../server/parsers/docxParser.js';
import { extractContent } from '../server/nlp/extractor.js';

export const config = {
    api: {
        bodyParser: false, // Disable Vercel's default body parser for file uploads
    },
};

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse the multipart form data
        const form = new IncomingForm({
            maxFileSize: 100 * 1024 * 1024, // 100 MB
            keepExtensions: true,
        });

        const { files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve({ fields, files });
            });
        });

        const uploaded = files.document;
        if (!uploaded) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // Formidable v3 returns an array of files
        const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
        const { mimetype, filepath, originalFilename, size } = file;

        // Validate file type
        const allowed = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
        ];
        if (!allowed.includes(mimetype)) {
            return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or Word document.' });
        }

        console.log(`📄 Processing: ${originalFilename} (${(size / 1024 / 1024).toFixed(2)} MB)`);

        // Read the file into a buffer
        const buffer = readFileSync(filepath);

        // Step 1: Parse the document
        let parsed;
        if (mimetype === 'application/pdf') {
            parsed = await parsePdf(buffer);
        } else {
            parsed = await parseDocx(buffer);
        }

        console.log(`📖 Extracted ${parsed.pageCount} pages, ${parsed.text.length} characters`);

        // Step 2: Run NLP extraction
        const content = extractContent(parsed.text);

        console.log(`🧠 Generated: ${content.stats.totalQuestions} questions, ${content.stats.totalFlashcards} flashcards`);

        // Step 3: Return results
        return res.status(200).json({
            filename: originalFilename,
            fileSize: size,
            pageCount: parsed.pageCount,
            ...content,
        });
    } catch (err) {
        console.error('❌ Processing error:', err);
        return res.status(500).json({ error: err.message || 'Failed to process the document.' });
    }
}
