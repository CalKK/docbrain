import { useState, useEffect } from 'react';

const STEPS = [
    { label: 'Uploading document', icon: '📤' },
    { label: 'Extracting text content', icon: '📖' },
    { label: 'Analyzing key concepts', icon: '🔍' },
    { label: 'Generating questions', icon: '❓' },
    { label: 'Creating flashcards', icon: '🃏' },
    { label: 'Preparing results', icon: '✨' },
];

export default function ProcessingView() {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => {
                if (prev < STEPS.length - 1) return prev + 1;
                return prev;
            });
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="processing">
            <span className="processing__brain">🧠</span>
            <h2 className="processing__title">Analyzing Your Document</h2>
            <p className="processing__subtitle">
                Our AI is reading and extracting key insights...
            </p>
            <div className="processing__steps">
                {STEPS.map((step, i) => {
                    const isDone = i < activeStep;
                    const isActive = i === activeStep;
                    return (
                        <div
                            key={step.label}
                            className={`processing__step ${isActive ? 'processing__step--active' : ''
                                } ${isDone ? 'processing__step--done' : ''}`}
                        >
                            <span className="processing__step-icon">
                                {isDone ? '✅' : isActive ? step.icon : '⬜'}
                            </span>
                            <span className="processing__step-label">{step.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
