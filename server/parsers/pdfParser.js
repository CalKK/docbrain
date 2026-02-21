import { PDFParse } from 'pdf-parse';

/**
 * Extract text from a PDF buffer.
 * Uses pdf-parse v2 API.
 */
export async function parsePdf(buffer) {
    const parser = new PDFParse({ data: buffer });

    // Get text content
    const result = await parser.getText();

    // Get info for page count
    let pageCount = 1;
    try {
        const info = await parser.getInfo();
        pageCount = info.total || 1;
    } catch {
        // If getInfo fails, estimate from text
    }

    await parser.destroy();

    const text = result.text || '';

    // Split into rough pages by double newlines or form-feeds
    const pages = text
        .split(/\f|\n{3,}/)
        .map((p) => p.trim())
        .filter((p) => p.length > 20);

    return {
        text,
        pages: pages.length > 0 ? pages : [text],
        pageCount,
        info: {},
    };
}
