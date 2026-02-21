import { Router } from 'express';
import multer from 'multer';
import { parsePdf } from '../parsers/pdfParser.js';
import { parseDocx } from '../parsers/docxParser.js';
import { extractContent } from '../nlp/extractor.js';

const router = Router();

// Configure multer for in-memory storage (up to 100 MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Please upload a PDF or Word document.'));
        }
    },
});

router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const { mimetype, buffer, originalname, size } = req.file;

        console.log(`📄 Processing: ${originalname} (${(size / 1024 / 1024).toFixed(2)} MB)`);

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

        console.log(
            `🧠 Generated: ${content.stats.totalQuestions} questions, ${content.stats.totalFlashcards} flashcards`
        );

        // Step 3: Return results
        res.json({
            filename: originalname,
            fileSize: size,
            pageCount: parsed.pageCount,
            ...content,
        });
    } catch (err) {
        console.error('❌ Processing error:', err);
        res.status(500).json({ error: err.message || 'Failed to process the document.' });
    }
});

export default router;
