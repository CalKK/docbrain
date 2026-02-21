// Create a minimal test DOCX file
import { writeFileSync } from 'fs';
import { Buffer } from 'buffer';

// A minimal DOCX is actually a ZIP archive. Let's create a simple one.
// We'll use the archiver concept but a simpler approach: 
// Just create a text file and test the API with curl

const testText = `Machine Learning is a subset of artificial intelligence that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.

Supervised learning is the machine learning task of learning a function that maps an input to an output based on example input-output pairs.

Neural networks are computing systems inspired by biological neural networks that constitute animal brains.

Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning.

Natural language processing is a subfield of linguistics, computer science, and artificial intelligence concerned with the interactions between computers and human language.

Computer vision is an interdisciplinary scientific field that deals with how computers can gain high-level understanding from digital images or videos.

Transfer learning is a machine learning method where a model developed for a task is reused as the starting point for a model on a second task.

Feature engineering is the process of using domain knowledge to extract features from raw data via data mining techniques because it allows algorithms to focus on the most relevant information.

Reinforcement learning is an area of machine learning concerned with how intelligent agents ought to take actions in an environment in order to maximize cumulative reward.

The purpose of deep learning is to model high-level abstractions in data by using a deep graph with many processing layers.`;

// Test the NLP extractor directly
import { extractContent } from './server/nlp/extractor.js';

const result = extractContent(testText);

console.log('=== EXTRACTION RESULTS ===');
console.log('\n--- Summary ---');
console.log(result.summary);
console.log('\n--- Questions (' + result.questions.length + ') ---');
result.questions.forEach((q, i) => {
    console.log(`${i + 1}. Q: ${q.question}`);
    console.log(`   A: ${q.answer.substring(0, 80)}...`);
});
console.log('\n--- Flashcards (' + result.flashcards.length + ') ---');
result.flashcards.slice(0, 5).forEach((f, i) => {
    console.log(`${i + 1}. Front: ${f.front}`);
    console.log(`   Back: ${f.back.substring(0, 80)}...`);
});
console.log('\n--- Topics ---');
console.log(result.topics.join(', '));
console.log('\n--- Stats ---');
console.log(JSON.stringify(result.stats, null, 2));
