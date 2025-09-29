import { Quiz, Question, Answer } from './types';

export class XMLQuizParser {
    /**
     * Parse XML string into Quiz object
     */
    static parseQuiz(xmlString: string): Quiz {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        
        // Check for parsing errors
        if (xmlDoc.querySelector('parsererror')) {
            throw new Error('Invalid XML format');
        }
        
        const quizElement = xmlDoc.querySelector('quiz');
        if (!quizElement) {
            throw new Error('No quiz element found in XML');
        }
        
        const quiz: Quiz = {
            id: this.getElementText(quizElement, 'id') || this.generateId(),
            title: this.getElementText(quizElement, 'title') || 'Untitled Quiz',
            description: this.getElementText(quizElement, 'description') || '',
            difficulty: this.parseDifficulty(this.getElementText(quizElement, 'difficulty')),
            passingScore: parseInt(this.getElementText(quizElement, 'passingScore') || '70'),
            questions: this.parseQuestions(quizElement),
            timeLimit: this.parseTimeLimit(this.getElementText(quizElement, 'timeLimit')),
            category: this.getElementText(quizElement, 'category') || undefined,
            theme: this.getElementText(quizElement, 'theme') || undefined
        };
        
        return quiz;
    }
    
    /**
     * Parse questions from quiz element
     */
    private static parseQuestions(quizElement: Element): Question[] {
        const questionsElement = quizElement.querySelector('questions');
        if (!questionsElement) {
            throw new Error('No questions element found');
        }
        
        const questionElements = questionsElement.querySelectorAll('question');
        if (questionElements.length === 0) {
            throw new Error('No questions found in quiz');
        }
        
        return Array.from(questionElements).map((questionElement, index) => {
            const question: Question = {
                id: this.getElementText(questionElement, 'id') || `q${index + 1}`,
                text: this.getElementText(questionElement, 'text') || '',
                answers: this.parseAnswers(questionElement),
                correctAnswerId: this.getElementText(questionElement, 'correctAnswer') || '',
                explanation: this.getElementText(questionElement, 'explanation') || undefined
            };
            
            if (!question.text) {
                throw new Error(`Question ${question.id} has no text`);
            }
            
            if (question.answers.length === 0) {
                throw new Error(`Question ${question.id} has no answers`);
            }
            
            if (!question.correctAnswerId) {
                throw new Error(`Question ${question.id} has no correct answer specified`);
            }
            
            // Verify correct answer exists in answers
            const correctAnswerExists = question.answers.some(answer => answer.id === question.correctAnswerId);
            if (!correctAnswerExists) {
                throw new Error(`Question ${question.id} has invalid correct answer ID: ${question.correctAnswerId}`);
            }
            
            return question;
        });
    }
    
    /**
     * Parse answers from question element
     */
    private static parseAnswers(questionElement: Element): Answer[] {
        const answersElement = questionElement.querySelector('answers');
        if (!answersElement) {
            throw new Error('No answers element found in question');
        }
        
        const answerElements = answersElement.querySelectorAll('answer');
        return Array.from(answerElements).map((answerElement, index) => ({
            id: answerElement.getAttribute('id') || `a${index + 1}`,
            text: answerElement.textContent || ''
        }));
    }
    
    /**
     * Get text content of a child element
     */
    private static getElementText(parent: Element, tagName: string): string | null {
        const element = parent.querySelector(tagName);
        return element ? element.textContent?.trim() || null : null;
    }
    
    /**
     * Parse difficulty level
     */
    private static parseDifficulty(difficulty: string | null): 'easy' | 'medium' | 'hard' {
        if (!difficulty) return 'medium';
        
        const normalizedDifficulty = difficulty.toLowerCase();
        if (normalizedDifficulty === 'easy' || normalizedDifficulty === 'medium' || normalizedDifficulty === 'hard') {
            return normalizedDifficulty as 'easy' | 'medium' | 'hard';
        }
        
        return 'medium';
    }
    
    /**
     * Parse time limit
     */
    private static parseTimeLimit(timeLimit: string | null): number | undefined {
        if (!timeLimit) return undefined;
        
        const parsed = parseInt(timeLimit);
        return isNaN(parsed) ? undefined : parsed;
    }
    
    /**
     * Generate a random ID
     */
    private static generateId(): string {
        return 'quiz_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Create sample XML quiz for testing
     */
    static createSampleXML(): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <id>sample-quiz-1</id>
    <title>JavaScript Fundamentals</title>
    <description>Test your knowledge of basic JavaScript concepts</description>
    <difficulty>medium</difficulty>
    <passingScore>75</passingScore>
    <timeLimit>15</timeLimit>
    <questions>
        <question>
            <id>q1</id>
            <text>What is the correct way to declare a variable in JavaScript?</text>
            <answers>
                <answer id="a1">var myVar;</answer>
                <answer id="a2">let myVar;</answer>
                <answer id="a3">const myVar;</answer>
                <answer id="a4">All of the above</answer>
            </answers>
            <correctAnswer>a4</correctAnswer>
            <explanation>JavaScript supports var, let, and const for variable declarations, each with different scoping rules.</explanation>
        </question>
        <question>
            <id>q2</id>
            <text>Which method is used to add an element to the end of an array?</text>
            <answers>
                <answer id="a1">push()</answer>
                <answer id="a2">pop()</answer>
                <answer id="a3">shift()</answer>
                <answer id="a4">unshift()</answer>
            </answers>
            <correctAnswer>a1</correctAnswer>
            <explanation>The push() method adds one or more elements to the end of an array and returns the new length.</explanation>
        </question>
        <question>
            <id>q3</id>
            <text>What does '===' operator do in JavaScript?</text>
            <answers>
                <answer id="a1">Compares values only</answer>
                <answer id="a2">Compares types only</answer>
                <answer id="a3">Compares both value and type</answer>
                <answer id="a4">Assigns a value</answer>
            </answers>
            <correctAnswer>a3</correctAnswer>
            <explanation>The strict equality operator (===) compares both value and type without type coercion.</explanation>
        </question>
    </questions>
</quiz>`;
    }
}