import mammoth from 'mammoth';

/**
 * Extract text from a DOCX buffer.
 * Returns an object with the full text.
 */
export async function parseDocx(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    // Split into rough "pages" by paragraph groups (~3000 chars each)
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
    if (currentPage.trim()) {
        pages.push(currentPage.trim());
    }

    return {
        text,
        pages,
        pageCount: pages.length,
        info: {},
    };
}
