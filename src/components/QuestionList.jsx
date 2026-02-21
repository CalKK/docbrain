import { useState } from 'react';

const DIFFICULTY_STYLES = {
    basic: { label: 'Basic', className: 'difficulty--easy' },
    intermediate: { label: 'Intermediate', className: 'difficulty--medium' },
    advanced: { label: 'Advanced', className: 'difficulty--hard' },
};

const TYPE_ICONS = {
    definition: '📖',
    explanation: '💡',
    process: '⚙️',
    comparison: '⚖️',
    factual: '📌',
    analytical: '🔬',
    application: '🎯',
};

const FORMAT_LABELS = {
    'short-answer': 'Short Answer',
    mcq: 'Multiple Choice',
};

export default function QuestionList({ questions }) {
    const [openIndex, setOpenIndex] = useState(null);
    const [showSolution, setShowSolution] = useState({});
    const [filter, setFilter] = useState('all');
    const [selectedMCQ, setSelectedMCQ] = useState({});

    if (!questions || questions.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state__icon">🤔</div>
                <div className="empty-state__title">No questions generated</div>
                <p>The document didn't contain enough structured content to generate questions.</p>
            </div>
        );
    }

    const toggle = (i) => setOpenIndex(openIndex === i ? null : i);
    const toggleSolution = (i) => setShowSolution(prev => ({ ...prev, [i]: !prev[i] }));

    const types = ['all', ...new Set(questions.map(q => q.type).filter(Boolean))];
    const filtered = filter === 'all' ? questions : questions.filter(q => q.type === filter);

    const handleMCQSelect = (qIndex, letter) => {
        setSelectedMCQ(prev => ({ ...prev, [qIndex]: letter }));
    };

    return (
        <div className="question-list">
            {types.length > 2 && (
                <div className="question-filters">
                    {types.map((t) => (
                        <button
                            key={t}
                            className={`question-filter ${filter === t ? 'question-filter--active' : ''}`}
                            onClick={() => setFilter(t)}
                        >
                            {t === 'all' ? '🔍 All' : `${TYPE_ICONS[t] || '📋'} ${t.charAt(0).toUpperCase() + t.slice(1)}`}
                            {t === 'all' && <span className="question-filter__count">{questions.length}</span>}
                        </button>
                    ))}
                </div>
            )}

            {filtered.map((q, i) => {
                const globalIndex = questions.indexOf(q);
                const diff = DIFFICULTY_STYLES[q.difficulty] || DIFFICULTY_STYLES.intermediate;
                const typeIcon = TYPE_ICONS[q.type] || '📋';
                const isMCQ = q.questionFormat === 'mcq';
                const isOpen = openIndex === globalIndex;
                const solutionVisible = showSolution[globalIndex];
                const selected = selectedMCQ[globalIndex];

                return (
                    <div
                        key={globalIndex}
                        className={`question-card ${isOpen ? 'question-card--open' : ''}`}
                    >
                        <div className="question-card__header" onClick={() => toggle(globalIndex)}>
                            <span className="question-card__number">{globalIndex + 1}</span>
                            <div className="question-card__content">
                                <span className="question-card__question">{q.question}</span>
                                <div className="question-card__meta">
                                    {q.questionFormat && (
                                        <span className="question-card__format">
                                            {FORMAT_LABELS[q.questionFormat] || q.questionFormat}
                                        </span>
                                    )}
                                    {q.type && (
                                        <span className="question-card__type">
                                            {typeIcon} {q.type}
                                        </span>
                                    )}
                                    {q.difficulty && (
                                        <span className={`question-card__difficulty ${diff.className}`}>
                                            {diff.label}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="question-card__toggle">▼</span>
                        </div>

                        <div className="question-card__answer">
                            {/* MCQ Options */}
                            {isMCQ && q.options && (
                                <div className="mcq-options">
                                    {q.options.map((opt) => {
                                        const isSelected = selected === opt.letter;
                                        const showResult = isSelected;
                                        let optClass = 'mcq-option';
                                        if (showResult && opt.correct) optClass += ' mcq-option--correct';
                                        else if (showResult && !opt.correct) optClass += ' mcq-option--incorrect';
                                        else if (isSelected) optClass += ' mcq-option--selected';

                                        return (
                                            <button
                                                key={opt.letter}
                                                className={optClass}
                                                onClick={(e) => { e.stopPropagation(); handleMCQSelect(globalIndex, opt.letter); }}
                                            >
                                                <span className="mcq-option__letter">{opt.letter}</span>
                                                <span className="mcq-option__text">{opt.text}</span>
                                                {showResult && opt.correct && <span className="mcq-option__icon">✓</span>}
                                                {showResult && !opt.correct && <span className="mcq-option__icon">✗</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Answer */}
                            <div className="question-card__answer-section">
                                <div className="question-card__answer-label">
                                    {isMCQ ? '✅ Correct Answer' : '📝 Answer'}
                                </div>
                                <div className="question-card__answer-text">{q.answer}</div>
                            </div>

                            {/* Step-by-step Solution */}
                            {q.solution && (
                                <div className="question-card__solution-section">
                                    <button
                                        className="question-card__solution-toggle"
                                        onClick={(e) => { e.stopPropagation(); toggleSolution(globalIndex); }}
                                    >
                                        {solutionVisible ? '▲ Hide Solution' : '▼ Show Detailed Solution'}
                                    </button>
                                    {solutionVisible && (
                                        <div className="question-card__solution-text">
                                            {q.solution.split('\n').map((line, li) => {
                                                if (line.startsWith('**') && line.endsWith('**')) {
                                                    return <strong key={li} className="solution-heading">{line.replace(/\*\*/g, '')}</strong>;
                                                }
                                                if (line.startsWith('**')) {
                                                    const parts = line.split('**');
                                                    return (
                                                        <p key={li} className="solution-line">
                                                            {parts.map((part, pi) =>
                                                                pi % 2 === 1
                                                                    ? <strong key={pi}>{part}</strong>
                                                                    : <span key={pi}>{part}</span>
                                                            )}
                                                        </p>
                                                    );
                                                }
                                                if (line.startsWith('- ')) {
                                                    return <li key={li} className="solution-bullet">{line.slice(2)}</li>;
                                                }
                                                if (line.match(/^\d+\.\s/)) {
                                                    return <li key={li} className="solution-step">{line.replace(/^\d+\.\s/, '')}</li>;
                                                }
                                                if (line.trim() === '') return <br key={li} />;
                                                return <p key={li} className="solution-line">{line}</p>;
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
