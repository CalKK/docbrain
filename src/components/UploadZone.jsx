import { useState, useRef, useCallback } from 'react';

export default function UploadZone({ onFileSelect, disabled }) {
    const [dragover, setDragover] = useState(false);
    const inputRef = useRef(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragover(true);
    }, []);

    const handleDragOut = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragover(false);
    }, []);

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragover(false);
            const file = e.dataTransfer.files[0];
            if (file) onFileSelect(file);
        },
        [onFileSelect]
    );

    const handleClick = () => {
        if (!disabled) inputRef.current?.click();
    };

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        if (file) onFileSelect(file);
        e.target.value = '';
    };

    return (
        <div
            className={`upload-zone ${dragover ? 'upload-zone--dragover' : ''}`}
            onDragEnter={handleDragIn}
            onDragOver={handleDrag}
            onDragLeave={handleDragOut}
            onDrop={handleDrop}
            onClick={handleClick}
            role="button"
            tabIndex={0}
        >
            <span className="upload-zone__icon">📄</span>
            <h2 className="upload-zone__title">Drop your document here</h2>
            <p className="upload-zone__desc">
                or click to browse — supports documents up to 200 pages
            </p>
            <button className="upload-zone__btn" disabled={disabled} type="button">
                📁 Choose File
            </button>
            <div className="upload-zone__formats">
                <span className="upload-zone__format-badge">PDF</span>
                <span className="upload-zone__format-badge">DOCX</span>
                <span className="upload-zone__format-badge">DOC</span>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleInputChange}
                style={{ display: 'none' }}
            />
        </div>
    );
}
