import { useState } from 'react';
import QuestionList from './QuestionList';
import FlashcardDeck from './FlashcardDeck';

export default function ResultsView({ data, onReset }) {
    const [activeTab, setActiveTab] = useState('summary');

    const { summary, summarySections, questions, flashcards, topics, stats, filename, pageCount } = data;

    const tabs = [
        { id: 'summary', label: 'Summary', icon: '📝', count: null },
        { id: 'questions', label: 'Questions', icon: '❓', count: stats.totalQuestions },
        { id: 'flashcards', label: 'Flashcards', icon: '🃏', count: stats.totalFlashcards },
    ];

    // Split summary into paragraphs (fallback if no sections)
    const summaryParagraphs = summary
        ? summary.split(/\n\n+/).filter(p => p.trim().length > 0)
        : [];

    const hasSections = summarySections && summarySections.length > 0;

    return (
        <div className="results">
            <div className="results__header">
                <div className="results__file-badge">
                    📄 {filename} • {pageCount} pages
                </div>
                <button className="results__new-btn" onClick={onReset}>
                    ✨ New Document
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card__value">{stats.totalQuestions}</div>
                    <div className="stat-card__label">Questions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{stats.totalFlashcards}</div>
                    <div className="stat-card__label">Flashcards</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{stats.totalTopics}</div>
                    <div className="stat-card__label">Topics</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{stats.wordCount.toLocaleString()}</div>
                    <div className="stat-card__label">Words</div>
                </div>
            </div>

            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.count !== null && <span className="tab__count">{tab.count}</span>}
                    </button>
                ))}
            </div>

            {activeTab === 'summary' && (
                <div className="summary-panel">
                    <h3 className="summary-panel__title">📝 Comprehensive Summary</h3>

                    {hasSections ? (
                        <div className="summary-sections">
                            {summarySections.map((section, i) => (
                                <div key={i} className="summary-section">
                                    <h4 className="summary-section__heading">
                                        <span className="summary-section__number">{i + 1}</span>
                                        {section.heading}
                                    </h4>
                                    <p className="summary-section__text">{section.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="summary-panel__body">
                            {summaryParagraphs.map((para, i) => (
                                <p key={i} className="summary-panel__text">{para}</p>
                            ))}
                        </div>
                    )}

                    {topics && topics.length > 0 && (
                        <div className="summary-panel__topics-section">
                            <h4 className="summary-panel__topics-title">🏷️ Key Topics & Concepts</h4>
                            <div className="summary-panel__topics">
                                {topics.map((topic, i) => (
                                    <span key={i} className="topic-tag">{topic}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'questions' && <QuestionList questions={questions} />}

            {activeTab === 'flashcards' && <FlashcardDeck flashcards={flashcards} />}
        </div>
    );
}
