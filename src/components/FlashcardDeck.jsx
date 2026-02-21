import { useState, useEffect, useCallback } from 'react';

const CATEGORY_ICONS = {
    definition: '📖',
    process: '⚙️',
    comparison: '⚖️',
    example: '💡',
    'key fact': '📌',
    'key concept': '⭐',
    question: '❓',
    explanation: '💡',
    factual: '📌',
};

const DIFFICULTY_COLORS = {
    basic: 'flashcard-diff--basic',
    intermediate: 'flashcard-diff--intermediate',
    advanced: 'flashcard-diff--advanced',
};

export default function FlashcardDeck({ flashcards }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [visited, setVisited] = useState(new Set([0]));

    const total = flashcards?.length || 0;
    const card = flashcards?.[currentIndex];

    const goTo = useCallback(
        (index) => {
            if (index >= 0 && index < total) {
                setCurrentIndex(index);
                setFlipped(false);
                setVisited((prev) => new Set([...prev, index]));
            }
        },
        [total]
    );

    const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
    const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
    const toggleFlip = useCallback(() => setFlipped((f) => !f), []);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowLeft') goPrev();
            else if (e.key === 'ArrowRight') goNext();
            else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggleFlip();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [goNext, goPrev, toggleFlip]);

    if (!flashcards || flashcards.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state__icon">🃏</div>
                <div className="empty-state__title">No flashcards generated</div>
                <p>The document didn't contain enough structured content to create flashcards.</p>
            </div>
        );
    }

    const categoryIcon = CATEGORY_ICONS[card.category] || '📋';
    const categoryLabel = card.category
        ? card.category.charAt(0).toUpperCase() + card.category.slice(1)
        : 'Card';
    const diffClass = DIFFICULTY_COLORS[card.difficulty] || '';
    const diffLabel = card.difficulty
        ? card.difficulty.charAt(0).toUpperCase() + card.difficulty.slice(1)
        : '';

    return (
        <div className="flashcard-deck">
            <div className="flashcard-nav">
                <button
                    className="flashcard-nav__btn"
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    aria-label="Previous card"
                >
                    ←
                </button>
                <span className="flashcard-nav__counter">
                    <span>{currentIndex + 1}</span> / {total}
                </span>
                <button
                    className="flashcard-nav__btn"
                    onClick={goNext}
                    disabled={currentIndex === total - 1}
                    aria-label="Next card"
                >
                    →
                </button>
            </div>

            <div className="flashcard-container" onClick={toggleFlip}>
                <div className={`flashcard ${flipped ? 'flashcard--flipped' : ''}`}>
                    <div className="flashcard__face flashcard__front">
                        <div className="flashcard__top-bar">
                            <span className="flashcard__category">
                                {categoryIcon} {categoryLabel}
                            </span>
                            {diffLabel && (
                                <span className={`flashcard__diff ${diffClass}`}>
                                    {diffLabel}
                                </span>
                            )}
                        </div>
                        <span className="flashcard__label">Term / Question</span>
                        <div className="flashcard__content">{card.front}</div>
                        {card.topic && <span className="flashcard__topic">Topic: {card.topic}</span>}
                        <span className="flashcard__hint">Click or press Space to reveal answer</span>
                    </div>
                    <div className="flashcard__face flashcard__back">
                        <div className="flashcard__top-bar">
                            <span className="flashcard__category">
                                {categoryIcon} {categoryLabel}
                            </span>
                            {diffLabel && (
                                <span className={`flashcard__diff ${diffClass}`}>
                                    {diffLabel}
                                </span>
                            )}
                        </div>
                        <span className="flashcard__label">Answer / Definition</span>
                        <div className="flashcard__content">{card.back}</div>
                        <span className="flashcard__hint">Click or press Space to flip back</span>
                    </div>
                </div>
            </div>

            <div className="flashcard-progress">
                {flashcards.map((_, i) => (
                    <div
                        key={i}
                        className={`flashcard-progress__dot ${i === currentIndex
                                ? 'flashcard-progress__dot--active'
                                : visited.has(i)
                                    ? 'flashcard-progress__dot--visited'
                                    : ''
                            }`}
                    />
                ))}
            </div>

            <div className="keyboard-hint">
                <div className="keyboard-hint__item">
                    <span className="keyboard-hint__key">←</span>
                    <span>Previous</span>
                </div>
                <div className="keyboard-hint__item">
                    <span className="keyboard-hint__key">→</span>
                    <span>Next</span>
                </div>
                <div className="keyboard-hint__item">
                    <span className="keyboard-hint__key">Space</span>
                    <span>Flip</span>
                </div>
            </div>
        </div>
    );
}
