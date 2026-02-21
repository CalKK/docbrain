import nlp from 'compromise';

/**
 * NLP-based content extractor — v3 (comprehensive, exam-grade quality).
 *
 * Key capabilities:
 *  • Summaries: Organized by discovered themes with clear headings
 *  • Questions: Multiple types — definition, MCQ, short-answer, analytical, application
 *  • Solutions: Detailed step-by-step explanations with reasoning
 *  • Flashcards: Precisely framed, categorised by topic & difficulty, cross-referenced
 *  • Topics: Full coverage of every concept in the document
 */

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'because', 'but', 'and', 'or', 'if', 'while', 'although', 'that',
    'which', 'who', 'whom', 'this', 'these', 'those', 'it', 'its', 'they',
    'them', 'their', 'what', 'about', 'also', 'many', 'much', 'well',
    'back', 'even', 'still', 'new', 'one', 'two', 'first', 'last',
    'long', 'great', 'little', 'old', 'right', 'big', 'high',
    'different', 'small', 'large', 'next', 'early', 'young', 'important',
    'public', 'bad', 'good', 'make', 'made', 'like', 'use', 'her', 'him',
    'his', 'she', 'he', 'we', 'you', 'me', 'my', 'our', 'your',
]);

function isStopWord(w) { return STOP_WORDS.has(w.toLowerCase()); }

function tokenize(text) {
    return text.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !isStopWord(w));
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitSentences(text) {
    const doc = nlp(text);
    return doc.sentences().out('array')
        .map(s => s.trim())
        .filter(s => s.length >= 25 && s.length <= 800 && s.split(/\s+/).length >= 5);
}

function capitalise(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function stripPeriod(s) { return s.replace(/\.\s*$/, '').trim(); }

function ensurePeriod(s) {
    s = s.trim();
    if (!/[.!?]$/.test(s)) s += '.';
    return s;
}

function truncate(text, maxLen = 250) {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

// ═══════════════════════════════════════════════════════════════════════
// TOPIC & THEME EXTRACTION
// ═══════════════════════════════════════════════════════════════════════

function extractTopics(text, sentences) {
    const doc = nlp(text);
    const entities = [
        ...doc.people().out('array'),
        ...doc.places().out('array'),
        ...doc.organizations().out('array'),
        ...doc.topics().out('array'),
    ];
    const entitySet = new Set(entities.map(e => e.trim()).filter(e => e.length > 2));

    const nounPhrases = doc.nouns().out('array');
    const phraseFreq = {};
    for (const np of nounPhrases) {
        const key = np.toLowerCase().trim();
        if (key.length > 2 && key.split(/\s+/).length <= 4 && !isStopWord(key)) {
            phraseFreq[key] = (phraseFreq[key] || 0) + 1;
        }
    }

    const totalPhrases = Object.values(phraseFreq).reduce((a, b) => a + b, 0) || 1;
    const scored = Object.entries(phraseFreq).map(([phrase, count]) => ({
        phrase: capitalise(phrase),
        score: (count / totalPhrases) * Math.log(1 + sentences.length / (count + 1)),
        count,
    }));
    scored.sort((a, b) => b.score - a.score);

    const merged = new Set();
    const result = [];
    for (const e of entitySet) {
        const key = e.toLowerCase();
        if (!merged.has(key) && key.length > 2) {
            merged.add(key);
            result.push(capitalise(e));
        }
    }
    for (const { phrase } of scored) {
        const key = phrase.toLowerCase();
        if (!merged.has(key) && result.length < 20) {
            merged.add(key);
            result.push(phrase);
        }
    }
    return result.slice(0, 15);
}

/**
 * Group sentences into thematic clusters by shared vocabulary.
 */
function clusterSentencesByTheme(sentences) {
    if (sentences.length <= 3) {
        return [{ theme: 'Overview', sentences }];
    }

    const clusters = [];
    const assigned = new Set();

    // Find key terms that appear in multiple sentences
    const termSentences = {};
    for (let i = 0; i < sentences.length; i++) {
        const words = tokenize(sentences[i]);
        for (const w of new Set(words)) {
            if (!termSentences[w]) termSentences[w] = [];
            termSentences[w].push(i);
        }
    }

    // Get terms that appear in 2+ sentences (good theme indicators)
    const themeTerms = Object.entries(termSentences)
        .filter(([, indices]) => indices.length >= 2 && indices.length <= sentences.length * 0.6)
        .sort((a, b) => b[1].length - a[1].length);

    for (const [term, indices] of themeTerms) {
        const unassigned = indices.filter(i => !assigned.has(i));
        if (unassigned.length < 2) continue;

        const clusterSentences = unassigned.map(i => sentences[i]);
        for (const i of unassigned) assigned.add(i);

        clusters.push({
            theme: capitalise(term),
            sentences: clusterSentences,
        });

        if (clusters.length >= 6) break;
    }

    // Remaining unassigned sentences
    const remaining = sentences.filter((_, i) => !assigned.has(i));
    if (remaining.length > 0) {
        clusters.push({
            theme: clusters.length === 0 ? 'Overview' : 'Additional Details',
            sentences: remaining,
        });
    }

    return clusters;
}

// ═══════════════════════════════════════════════════════════════════════
// SENTENCE SCORING
// ═══════════════════════════════════════════════════════════════════════

function scoreSentences(sentences) {
    const tf = {};
    const allTokens = sentences.flatMap(tokenize);
    for (const w of allTokens) tf[w] = (tf[w] || 0) + 1;

    const df = {};
    for (const s of sentences) {
        const unique = new Set(tokenize(s));
        for (const w of unique) df[w] = (df[w] || 0) + 1;
    }

    return sentences.map((s, i) => {
        const words = tokenize(s);
        if (words.length === 0) return { sentence: s, score: 0, index: i };

        const tfidf = words.reduce((sum, w) => {
            const idf = Math.log((sentences.length + 1) / ((df[w] || 0) + 1));
            return sum + (tf[w] || 0) * idf;
        }, 0) / words.length;

        const relPos = i / sentences.length;
        const positionBias = relPos < 0.15 ? 1.4 : relPos > 0.9 ? 1.2 : 1.0;
        const len = s.length;
        const lengthBias = len >= 60 && len <= 250 ? 1.3 : len > 250 && len <= 400 ? 1.1 : 0.85;
        const isDef = /\b(?:is a|are a|refers? to|defined as|known as|means)\b/i.test(s);
        const defBonus = isDef ? 1.3 : 1.0;

        return { sentence: s, score: tfidf * positionBias * lengthBias * defBonus, index: i };
    });
}

// ═══════════════════════════════════════════════════════════════════════
// COMPREHENSIVE SUMMARY GENERATION
// ═══════════════════════════════════════════════════════════════════════

function generateSummary(sentences, topics) {
    if (sentences.length === 0) return { text: 'The document did not contain enough text to generate a summary.', sections: [] };

    // For short docs, return all sentences organized
    if (sentences.length <= 5) {
        return {
            text: sentences.map(ensurePeriod).join(' '),
            sections: [{ heading: 'Overview', content: sentences.map(ensurePeriod).join(' ') }],
        };
    }

    // Cluster by theme
    const clusters = clusterSentencesByTheme(sentences);

    // Build sections — score and select best sentences per cluster
    const sections = [];
    const allSelectedSentences = [];

    for (const cluster of clusters) {
        const scored = scoreSentences(cluster.sentences);
        scored.sort((a, b) => b.score - a.score);

        // Take top sentences from each cluster (proportional to cluster size)
        const take = Math.max(2, Math.min(5, Math.ceil(cluster.sentences.length * 0.6)));
        const top = scored.slice(0, take);
        top.sort((a, b) => a.index - b.index);

        const sectionText = top.map(item => ensurePeriod(item.sentence)).join(' ');

        sections.push({
            heading: cluster.theme,
            content: sectionText,
        });

        allSelectedSentences.push(...top.map(item => item.sentence));
    }

    // Build full coherent text
    const fullText = sections.map(s => s.content).join('\n\n');

    return { text: fullText, sections };
}

// ═══════════════════════════════════════════════════════════════════════
// QUESTION GENERATION — MULTI-TYPE, MULTI-DIFFICULTY
// ═══════════════════════════════════════════════════════════════════════

/**
 * Question types produced:
 *  - definition: "Define X. What is it?"
 *  - short-answer: "Explain how/why..."
 *  - mcq: Multiple choice with 4 options
 *  - analytical: "Compare/contrast", "Why is X important?"
 *  - application: "How would you apply..."
 *
 * Each question includes:
 *  { question, answer, solution, difficulty, type, topic, questionFormat }
 */

const QUESTION_PATTERNS = [
    {
        name: 'definition_is',
        regex: /^(.{5,80}?)\s+(?:is|are)\s+(?:a|an|the)\s+(.{15,}?)\.?\s*$/i,
        build(m, allSentences) {
            const subject = stripPeriod(m[1].trim());
            const definition = capitalise(stripPeriod(m[2].trim()));
            const relatedSentences = allSentences
                .filter(s => s.toLowerCase().includes(subject.toLowerCase()) && s !== m[0])
                .slice(0, 2);
            const context = relatedSentences.length > 0
                ? '\n\nAdditional context: ' + relatedSentences.map(ensurePeriod).join(' ')
                : '';

            return {
                question: `Define "${subject}" and explain its significance.`,
                answer: `${capitalise(subject)} is a ${definition}.`,
                solution: `**Step 1 — Identify the concept:** The term "${subject}" is a key concept in this material.\n\n**Step 2 — Core definition:** ${capitalise(subject)} is a ${definition}.\n\n**Step 3 — Context & significance:** This concept is important because it establishes the foundation for understanding related ideas.${context}`,
                difficulty: 'basic',
                type: 'definition',
                questionFormat: 'short-answer',
                topic: subject,
            };
        },
    },
    {
        name: 'definition_refers',
        regex: /^(.{5,80}?)\s+(?:refers?\s+to|is\s+defined\s+as|is\s+known\s+as|means)\s+(.{15,}?)\.?\s*$/i,
        build(m) {
            const subject = stripPeriod(m[1].trim());
            const definition = capitalise(stripPeriod(m[2].trim()));
            return {
                question: `What does the term "${subject}" refer to?`,
                answer: `${definition}.`,
                solution: `**Definition:** "${subject}" refers to ${definition}.\n\n**Key takeaway:** Understanding this term is essential for grasping the broader concepts discussed in the material.`,
                difficulty: 'basic',
                type: 'definition',
                questionFormat: 'short-answer',
                topic: subject,
            };
        },
    },
    {
        name: 'provides_verb',
        regex: /^(.{5,70}?)\s+(provides?|enables?|allows?|facilitates?|offers?|ensures?|supports?|delivers?)\s+(.{15,}?)\.?\s*$/i,
        build(m) {
            const subject = stripPeriod(m[1].trim());
            const verb = m[2].trim().replace(/s$/i, '');
            const object = stripPeriod(m[3].trim());
            return {
                question: `Explain what ${subject.toLowerCase()} ${verb}s and why this is important.`,
                answer: `${capitalise(subject)} ${verb}s ${object}.`,
                solution: `**What it ${verb}s:** ${capitalise(subject)} ${verb}s ${object}.\n\n**Why it matters:** This capability is significant because it directly impacts the functionality and effectiveness of the system or concept being discussed.`,
                difficulty: 'intermediate',
                type: 'explanation',
                questionFormat: 'short-answer',
                topic: subject,
            };
        },
    },
    {
        name: 'purpose_of',
        regex: /^(?:the\s+)?(?:purpose|goal|aim|objective|role|function)\s+of\s+(.{5,70}?)\s+is\s+(.{15,}?)\.?\s*$/i,
        build(m) {
            const subject = stripPeriod(m[1].trim());
            const purpose = capitalise(stripPeriod(m[2].trim()));
            return {
                question: `What is the primary purpose of ${subject.toLowerCase()}, and how does it achieve this goal?`,
                answer: `The purpose of ${subject.toLowerCase()} is ${purpose}.`,
                solution: `**Primary purpose:** ${purpose}.\n\n**How it works:** ${capitalise(subject)} achieves this by providing structured mechanisms that address the specific needs outlined in the material.\n\n**Real-world relevance:** Understanding this purpose helps contextualize why ${subject.toLowerCase()} is designed the way it is.`,
                difficulty: 'intermediate',
                type: 'explanation',
                questionFormat: 'short-answer',
                topic: subject,
            };
        },
    },
    {
        name: 'used_for',
        regex: /^(.{5,70}?)\s+(?:is|are)\s+used\s+(for|to|in)\s+(.{15,}?)\.?\s*$/i,
        build(m) {
            const subject = stripPeriod(m[1].trim());
            const usage = stripPeriod(m[3].trim());
            return {
                question: `How is ${subject.toLowerCase()} used in practice? Provide specific applications.`,
                answer: `${capitalise(subject)} is used ${m[2]} ${usage}.`,
                solution: `**Application:** ${capitalise(subject)} is used ${m[2]} ${usage}.\n\n**Practical significance:** This application demonstrates the real-world utility of the concept and shows how theoretical knowledge translates into practical outcomes.`,
                difficulty: 'intermediate',
                type: 'application',
                questionFormat: 'short-answer',
                topic: subject,
            };
        },
    },
    {
        name: 'because',
        regex: /^(.{15,120}?)\s+because\s+(.{15,}?)\.?\s*$/i,
        build(m) {
            const effect = stripPeriod(m[1].trim());
            const cause = stripPeriod(m[2].trim());
            return {
                question: `Why does ${effect.replace(/^(.)/i, c => c.toLowerCase())}? Explain the underlying reasoning.`,
                answer: `Because ${cause}.`,
                solution: `**Cause:** ${capitalise(cause)}.\n\n**Effect:** ${capitalise(effect)}.\n\n**Reasoning chain:** The relationship here is causal — the condition described (${cause}) directly leads to the outcome (${effect.toLowerCase()}). This is important for understanding the "why" behind this concept.`,
                difficulty: 'advanced',
                type: 'analytical',
                questionFormat: 'short-answer',
                topic: null,
            };
        },
    },
    {
        name: 'consists_of',
        regex: /^(.{5,70}?)\s+(?:consists?\s+of|is\s+composed\s+of|is\s+made\s+up\s+of|comprises?|includes?)\s+(.{15,}?)\.?\s*$/i,
        build(m) {
            const subject = stripPeriod(m[1].trim());
            const components = capitalise(stripPeriod(m[2].trim()));
            return {
                question: `List and explain the components that make up ${subject.toLowerCase()}.`,
                answer: `${capitalise(subject)} consists of ${components}.`,
                solution: `**Components of ${subject}:**\n\n${components}.\n\n**Why this matters:** Understanding the individual components helps break down a complex concept into manageable parts, making it easier to study and apply.`,
                difficulty: 'intermediate',
                type: 'factual',
                questionFormat: 'short-answer',
                topic: subject,
            };
        },
    },
    {
        name: 'process_by',
        regex: /^(.{5,70}?)\s+(?:works?\s+by|operates?\s+by|functions?\s+by|achieves?\s+this\s+by)\s+(.{15,}?)\.?\s*$/i,
        build(m) {
            const subject = stripPeriod(m[1].trim());
            const process = capitalise(stripPeriod(m[2].trim()));
            return {
                question: `Describe the process by which ${subject.toLowerCase()} operates. What are the key mechanisms?`,
                answer: `${capitalise(subject)} works by ${process}.`,
                solution: `**Process overview:** ${process}.\n\n**Key mechanisms:** The operation of ${subject.toLowerCase()} relies on the following principle: ${process}.\n\n**Step-by-step breakdown:**\n1. The system initiates the process described\n2. The mechanism operates as outlined above\n3. The result is achieved through this systematic approach`,
                difficulty: 'advanced',
                type: 'process',
                questionFormat: 'short-answer',
                topic: subject,
            };
        },
    },
    {
        name: 'subset_of',
        regex: /^(.{5,70}?)\s+(?:is\s+a\s+(?:subset|type|kind|form|branch|part|category|subfield|area)\s+of)\s+(.{5,}?)\.?\s*$/i,
        build(m, allSentences) {
            const child = stripPeriod(m[1].trim());
            const parent = stripPeriod(m[2].trim());
            // Find other subsets of the same parent
            const siblings = allSentences
                .filter(s => s.toLowerCase().includes(parent.toLowerCase()) && s !== m[0])
                .slice(0, 2);

            return {
                question: `What broader field does ${child.toLowerCase()} belong to, and how does it relate to that field?`,
                answer: `${capitalise(child)} is a subfield of ${parent}.`,
                solution: `**Classification:** ${capitalise(child)} is a subfield/subset of ${parent}.\n\n**Relationship:** As a subdivision, ${child.toLowerCase()} focuses on specific aspects while inheriting the foundational principles of ${parent}.${siblings.length > 0 ? '\n\n**Related areas:** ' + siblings.map(ensurePeriod).join(' ') : ''}`,
                difficulty: 'basic',
                type: 'definition',
                questionFormat: 'short-answer',
                topic: child,
            };
        },
    },
    {
        name: 'concerned_with',
        regex: /^(.{5,70}?)\s+(?:is\s+)?(?:concerned\s+with|focused\s+on|deals?\s+with|involves?)\s+(.{15,}?)\.?\s*$/i,
        build(m) {
            const subject = stripPeriod(m[1].trim());
            const focus = capitalise(stripPeriod(m[2].trim()));
            return {
                question: `What is the primary focus of ${subject.toLowerCase()}? Describe its scope and areas of concern.`,
                answer: `${capitalise(subject)} is concerned with ${focus}.`,
                solution: `**Scope:** ${capitalise(subject)} focuses on ${focus}.\n\n**Areas of concern:** The field addresses specific challenges and problems related to this focus area, making it a critical domain of study.`,
                difficulty: 'intermediate',
                type: 'explanation',
                questionFormat: 'short-answer',
                topic: subject,
            };
        },
    },
    {
        name: 'in_order_to',
        regex: /^(.{10,100}?)\s+in\s+order\s+to\s+(.{10,}?)\.?\s*$/i,
        build(m) {
            const action = stripPeriod(m[1].trim());
            const goal = stripPeriod(m[2].trim());
            return {
                question: `What is the goal of ${action.replace(/^(.)/i, c => c.toLowerCase())}?`,
                answer: `The goal is to ${goal}.`,
                solution: `**Goal:** To ${goal}.\n\n**Approach:** This is achieved by ${action.toLowerCase()}.\n\n**Reasoning:** The action-goal relationship here shows purposeful design — the method was chosen specifically to achieve the desired outcome.`,
                difficulty: 'intermediate',
                type: 'explanation',
                questionFormat: 'short-answer',
                topic: null,
            };
        },
    },
];

/**
 * Generate MCQ from a definition sentence.
 */
function generateMCQ(subject, correctAnswer, allTopics, allSentences) {
    // Build distractors from other topics
    const otherTopics = allTopics.filter(t => t.toLowerCase() !== subject.toLowerCase()).slice(0, 6);
    const distractors = [];

    for (const topic of otherTopics) {
        const topicSentence = allSentences.find(s =>
            s.toLowerCase().includes(topic.toLowerCase()) &&
            /\b(?:is|are|refers|means)\b/i.test(s)
        );
        if (topicSentence) {
            const defMatch = topicSentence.match(
                /\b(?:is|are)\s+(?:a|an|the)\s+(.{15,80}?)(?:\.|,|$)/i
            );
            if (defMatch) {
                distractors.push(capitalise(stripPeriod(defMatch[1].trim())));
            }
        }
        if (distractors.length >= 3) break;
    }

    // If not enough distractors, add generic wrong answers
    const fillers = [
        'A type of data structure used exclusively in databases',
        'A hardware component designed for physical computing',
        'A mathematical theorem with no practical applications',
        'A methodology primarily used in manual testing processes',
    ];
    while (distractors.length < 3) {
        distractors.push(fillers[distractors.length]);
    }

    // Shuffle options
    const options = [
        { text: correctAnswer, correct: true },
        ...distractors.slice(0, 3).map(d => ({ text: ensurePeriod(d), correct: false })),
    ];

    // Fisher-Yates shuffle
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }

    const correctLetter = String.fromCharCode(65 + options.findIndex(o => o.correct));

    return {
        question: `Which of the following best describes "${subject}"?`,
        options: options.map((o, i) => ({
            letter: String.fromCharCode(65 + i),
            text: o.text,
            correct: o.correct,
        })),
        answer: `${correctLetter}) ${correctAnswer}`,
        solution: `**Correct answer: ${correctLetter}**\n\n**Explanation:** ${capitalise(subject)} is defined as: ${correctAnswer}\n\n**Why other options are incorrect:**\n${options.filter(o => !o.correct).map((o, i) => `- Option ${String.fromCharCode(65 + options.indexOf(o))}: This describes a different concept and does not match the definition of ${subject.toLowerCase()}.`).join('\n')}`,
        difficulty: 'basic',
        type: 'definition',
        questionFormat: 'mcq',
        topic: subject,
    };
}

function generateQuestions(sentences, topics) {
    const questions = [];
    const seenKeys = new Set();

    function isDuplicate(q) {
        const stem = q.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0, 6).join(' ');
        if (seenKeys.has(stem)) return true;
        for (const existing of seenKeys) {
            if (stem.includes(existing) || existing.includes(stem)) return true;
        }
        seenKeys.add(stem);
        return false;
    }

    // ─── Phase 1: Pattern-based short-answer questions ──────────────────
    for (const sentence of sentences) {
        for (const pattern of QUESTION_PATTERNS) {
            const match = sentence.match(pattern.regex);
            if (match) {
                try {
                    const qa = pattern.build(match, sentences);
                    if (qa && qa.question.length > 10 && qa.answer.length > 10 && !isDuplicate(qa.question)) {
                        questions.push(qa);
                    }
                } catch { /* skip malformed */ }
                break;
            }
        }
    }

    // ─── Phase 2: MCQ questions from definition sentences ──────────────
    const defSentences = sentences.filter(s =>
        /^.{5,80}\s+(?:is|are)\s+(?:a|an|the)\s+.{15,}/i.test(s)
    );

    for (const sentence of defSentences.slice(0, 5)) {
        const match = sentence.match(/^(.{5,80}?)\s+(?:is|are)\s+(?:a|an|the)\s+(.{15,}?)\.?\s*$/i);
        if (match) {
            const subject = stripPeriod(match[1].trim());
            const correctAns = ensurePeriod(`A ${stripPeriod(match[2].trim())}`);
            const mcq = generateMCQ(subject, correctAns, topics, sentences);
            if (!isDuplicate(mcq.question)) {
                questions.push(mcq);
            }
        }
    }

    // ─── Phase 3: Analytical/synthesis questions for longer docs ────────
    if (sentences.length > 8) {
        // "Compare and contrast" question
        const defTerms = [];
        for (const s of sentences) {
            const match = s.match(/^(.{5,60}?)\s+(?:is|are)\s+(?:a|an|the)\s+/i);
            if (match) defTerms.push(stripPeriod(match[1].trim()));
        }
        if (defTerms.length >= 2) {
            const [a, b] = defTerms.slice(0, 2);
            const q = `Compare and contrast ${a.toLowerCase()} and ${b.toLowerCase()}. What are their key similarities and differences?`;
            if (!isDuplicate(q)) {
                const aSentences = sentences.filter(s => s.toLowerCase().includes(a.toLowerCase())).slice(0, 2);
                const bSentences = sentences.filter(s => s.toLowerCase().includes(b.toLowerCase())).slice(0, 2);
                questions.push({
                    question: q,
                    answer: `Both ${a.toLowerCase()} and ${b.toLowerCase()} are related concepts, but they differ in scope and application.`,
                    solution: `**${capitalise(a)}:**\n${aSentences.map(ensurePeriod).join(' ') || 'See source material.'}\n\n**${capitalise(b)}:**\n${bSentences.map(ensurePeriod).join(' ') || 'See source material.'}\n\n**Similarities:** Both concepts are part of the broader domain discussed in the material.\n\n**Differences:** They differ in their specific focus, methods, and applications.`,
                    difficulty: 'advanced',
                    type: 'analytical',
                    questionFormat: 'short-answer',
                    topic: null,
                });
            }
        }

        // Overview question
        const overviewQ = 'Summarize the main concepts covered in this document and explain how they relate to each other.';
        if (!isDuplicate(overviewQ)) {
            const topTopics = topics.slice(0, 8);
            questions.push({
                question: overviewQ,
                answer: `The document covers: ${topTopics.join(', ')}.`,
                solution: `**Main concepts:** ${topTopics.join(', ')}.\n\n**Relationships:** These concepts form an interconnected framework where each builds upon or complements the others. Understanding them together provides a comprehensive view of the subject matter.\n\n**Key connections:** The foundational concepts establish definitions, while the applied concepts demonstrate real-world implementation.`,
                difficulty: 'advanced',
                type: 'analytical',
                questionFormat: 'short-answer',
                topic: null,
            });
        }
    }

    // ─── Phase 4: Topic-based comprehension questions ───────────────────
    const doc = nlp(sentences.join('. '));
    const nlpTopics = doc.topics().out('array');
    const uniqueTopics = [...new Set(nlpTopics.map(t => t.trim()))].filter(t => t.length > 2);

    for (const topic of uniqueTopics.slice(0, 6)) {
        const q = `What is the role and significance of ${topic} as discussed in the material?`;
        if (isDuplicate(q)) continue;

        const candidates = sentences.filter(s => s.toLowerCase().includes(topic.toLowerCase()));
        const defSentence = candidates.find(s => /\b(?:is a|are a|refers? to|defined as)\b/i.test(s));
        const context = defSentence || candidates[0];
        if (!context) continue;

        const additional = candidates.filter(s => s !== context).slice(0, 2);

        questions.push({
            question: q,
            answer: ensurePeriod(context.trim()),
            solution: `**Definition/Role:** ${ensurePeriod(context.trim())}${additional.length > 0 ? '\n\n**Further details:** ' + additional.map(ensurePeriod).join(' ') : ''}\n\n**Significance:** ${topic} plays a critical role in the subject matter because it provides foundational understanding necessary for more advanced concepts.`,
            difficulty: 'intermediate',
            type: 'explanation',
            questionFormat: 'short-answer',
            topic,
        });
    }

    // Sort by difficulty order
    const diffOrder = { basic: 0, intermediate: 1, advanced: 2 };
    questions.sort((a, b) => (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0));

    return questions;
}

// ═══════════════════════════════════════════════════════════════════════
// FLASHCARD GENERATION — CURATED & ORGANIZED
// ═══════════════════════════════════════════════════════════════════════

function condense(sentence, term) {
    const termLower = term.toLowerCase();
    const safeTerm = escapeRegex(termLower);

    const defPatterns = [
        new RegExp(`${safeTerm}\\s+(?:is|are)\\s+(?:a|an|the)?\\s*(.+?)\\s*\\.?\\s*$`, 'i'),
        new RegExp(`${safeTerm}\\s+(?:refers?\\s+to|means|is defined as)\\s+(.+?)\\s*\\.?\\s*$`, 'i'),
    ];

    for (const pat of defPatterns) {
        const match = sentence.match(pat);
        if (match && match[1].length > 10) {
            return ensurePeriod(capitalise(match[1].trim()));
        }
    }

    return ensurePeriod(truncate(sentence.trim(), 220));
}

function categoriseCard(sentence) {
    if (/\b(?:is a|are a|refers? to|defined as|known as|means)\b/i.test(sentence)) return 'definition';
    if (/\b(?:process|step|method|procedure|technique|algorithm|approach)\b/i.test(sentence)) return 'process';
    if (/\b(?:compared|unlike|whereas|difference|versus|vs)\b/i.test(sentence)) return 'comparison';
    if (/\b(?:example|instance|such as|e\.g\.|for instance)\b/i.test(sentence)) return 'example';
    if (/\b(?:important|significant|critical|essential|key|fundamental)\b/i.test(sentence)) return 'key concept';
    return 'key fact';
}

function assignDifficulty(sentence, term) {
    if (/\b(?:is a|are a|means|defined as)\b/i.test(sentence)) return 'basic';
    if (/\b(?:because|therefore|consequently|results? in)\b/i.test(sentence)) return 'advanced';
    return 'intermediate';
}

function generateFlashcards(sentences, topics) {
    const flashcards = [];
    const seenTerms = new Set();

    // Strategy 1: Definition-based flashcards (highest quality)
    for (const sentence of sentences) {
        const defMatch = sentence.match(
            /^(.{3,60}?)\s+(?:is|are)\s+(?:a|an|the)\s+(.{15,}?)\.?\s*$/i
        );
        if (defMatch) {
            const term = defMatch[1].trim();
            const termKey = term.toLowerCase();
            if (!seenTerms.has(termKey) && term.length > 2) {
                seenTerms.add(termKey);
                flashcards.push({
                    front: capitalise(term),
                    back: condense(sentence, term),
                    category: 'definition',
                    difficulty: 'basic',
                    topic: capitalise(term),
                });
            }
        }
        if (flashcards.length >= 20) break;
    }

    // Strategy 2: Topic-based flashcards
    for (const topic of topics) {
        const topicKey = topic.toLowerCase();
        if (seenTerms.has(topicKey)) continue;

        const candidates = sentences.filter(
            s => s.toLowerCase().includes(topicKey) && s.length > 30
        );
        if (candidates.length === 0) continue;

        const best = candidates.find(s => /\b(?:is a|are a|refers? to|defined as)\b/i.test(s)) || candidates[0];

        seenTerms.add(topicKey);
        flashcards.push({
            front: capitalise(topic),
            back: condense(best, topic),
            category: categoriseCard(best),
            difficulty: assignDifficulty(best, topic),
            topic: capitalise(topic),
        });

        if (flashcards.length >= 30) break;
    }

    // Strategy 3: Process/application flashcards from non-definition sentences
    for (const sentence of sentences) {
        if (flashcards.length >= 35) break;

        const isProcess = /\b(?:used\s+(?:for|to|in)|works?\s+by|process|method)\b/i.test(sentence);
        const isCausal = /\b(?:because|therefore|in\s+order\s+to)\b/i.test(sentence);

        if (isProcess || isCausal) {
            // Extract a short question from the sentence
            const subjectMatch = sentence.match(/^(.{5,50}?)\s+(?:is|are|can|works?|provides?|enables?)/i);
            if (subjectMatch) {
                const subject = stripPeriod(subjectMatch[1].trim());
                const subjectKey = subject.toLowerCase();
                if (!seenTerms.has(subjectKey)) {
                    seenTerms.add(subjectKey);
                    flashcards.push({
                        front: isProcess
                            ? `How does ${subject.toLowerCase()} work?`
                            : `Why is ${subject.toLowerCase()} important?`,
                        back: ensurePeriod(truncate(sentence.trim(), 220)),
                        category: isProcess ? 'process' : 'key concept',
                        difficulty: 'intermediate',
                        topic: capitalise(subject),
                    });
                }
            }
        }
    }

    // Strategy 4: Question-answer flashcards from generated questions
    const questions = generateQuestions(sentences, topics);
    for (const qa of questions.slice(0, 8)) {
        if (flashcards.length >= 40) break;
        if (qa.questionFormat === 'mcq') continue; // MCQs don't work well as flashcards

        const qKey = qa.question.toLowerCase().slice(0, 30);
        if (seenTerms.has(qKey)) continue;
        seenTerms.add(qKey);

        flashcards.push({
            front: qa.question,
            back: qa.answer,
            category: qa.type || 'key fact',
            difficulty: qa.difficulty || 'intermediate',
            topic: qa.topic || 'General',
        });
    }

    // Sort: basic → intermediate → advanced
    const diffOrder = { basic: 0, intermediate: 1, advanced: 2 };
    flashcards.sort((a, b) => (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0));

    return flashcards;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════

export function extractContent(text) {
    const cleaned = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s*\d{1,3}\s*$/gm, '')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();

    const sentences = splitSentences(cleaned);
    const topics = extractTopics(cleaned, sentences);
    const summaryData = generateSummary(sentences, topics);
    const questions = generateQuestions(sentences, topics);
    const flashcards = generateFlashcards(sentences, topics);

    return {
        summary: summaryData.text,
        summarySections: summaryData.sections,
        questions,
        flashcards,
        topics,
        stats: {
            totalSentences: sentences.length,
            totalQuestions: questions.length,
            totalFlashcards: flashcards.length,
            totalTopics: topics.length,
            characterCount: cleaned.length,
            wordCount: cleaned.split(/\s+/).length,
        },
    };
}
