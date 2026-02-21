import { useState, useCallback } from 'react';
import UploadZone from './components/UploadZone';
import ProcessingView from './components/ProcessingView';
import ResultsView from './components/ResultsView';
import './index.css';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function App() {
  // States: idle | uploading | processing | results | error
  const [state, setState] = useState('idle');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError('Unsupported file type. Please upload a PDF or Word document.');
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File too large. Maximum size is 100 MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    uploadFile(selectedFile);
  }, []);

  const uploadFile = (fileToUpload) => {
    setState('uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('document', fileToUpload);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
        if (pct >= 100) {
          setState('processing');
        }
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setResults(data);
          setState('results');
        } catch {
          setError('Failed to parse server response.');
          setState('idle');
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          setError(err.error || 'Server error');
        } catch {
          setError('Server error (' + xhr.status + ')');
        }
        setState('idle');
      }
    });

    xhr.addEventListener('error', () => {
      setError('Network error. Please make sure the server is running on port 3001.');
      setState('idle');
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  const reset = () => {
    setState('idle');
    setFile(null);
    setProgress(0);
    setResults(null);
    setError(null);
  };

  return (
    <>
      <div className="app-bg" />
      <div className="app">
        <header className="header">
          <div className="header__logo">
            <div className="header__icon">🧠</div>
            <h1 className="header__title">DocBrain</h1>
          </div>
          <p className="header__subtitle">
            Upload a document and extract questions, flashcards & summaries instantly
          </p>
        </header>

        <main style={{ flex: 1 }}>
          {state === 'idle' && (
            <>
              <UploadZone onFileSelect={handleFileSelect} />

              {file && (
                <div className="file-info">
                  <div className="file-info__icon">
                    {file.name.endsWith('.pdf') ? '📕' : '📘'}
                  </div>
                  <div className="file-info__details">
                    <div className="file-info__name">{file.name}</div>
                    <div className="file-info__size">{formatSize(file.size)}</div>
                  </div>
                  <button className="file-info__remove" onClick={reset} title="Remove file">
                    ✕
                  </button>
                </div>
              )}

              {error && (
                <div className="error-banner">
                  <span className="error-banner__icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
            </>
          )}

          {state === 'uploading' && (
            <>
              <div className="file-info">
                <div className="file-info__icon">
                  {file?.name.endsWith('.pdf') ? '📕' : '📘'}
                </div>
                <div className="file-info__details">
                  <div className="file-info__name">{file?.name}</div>
                  <div className="file-info__size">{formatSize(file?.size || 0)}</div>
                </div>
              </div>
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-bar__fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="progress-info">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </>
          )}

          {state === 'processing' && <ProcessingView />}

          {state === 'results' && results && (
            <ResultsView data={results} onReset={reset} />
          )}
        </main>
      </div>
    </>
  );
}
