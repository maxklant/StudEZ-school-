import { Quiz, QuizState, QuizResult, UserAnswer } from './types';

export class QuizManager {
    private state: QuizState;
    private onStateChange?: (state: QuizState) => void;
    
    constructor() {
        this.state = {
            currentQuiz: null,
            currentQuestionIndex: 0,
            userAnswers: new Map(),
            startTime: null,
            isCompleted: false
        };
    }
    
    /**
     * Set callback for state changes
     */
    setOnStateChange(callback: (state: QuizState) => void): void {
        this.onStateChange = callback;
    }
    
    /**
     * Start a new quiz
     */
    startQuiz(quiz: Quiz): void {
        this.state = {
            currentQuiz: quiz,
            currentQuestionIndex: 0,
            userAnswers: new Map(),
            startTime: new Date(),
            isCompleted: false
        };
        this.notifyStateChange();
    }
    
    /**
     * Answer the current question
     */
    answerQuestion(answerId: string): void {
        if (!this.state.currentQuiz || this.state.isCompleted) {
            throw new Error('No active quiz');
        }
        
        const currentQuestion = this.getCurrentQuestion();
        if (!currentQuestion) {
            throw new Error('No current question');
        }
        
        this.state.userAnswers.set(currentQuestion.id, answerId);
        this.notifyStateChange();
    }
    
    /**
     * Move to next question
     */
    nextQuestion(): boolean {
        if (!this.state.currentQuiz) {
            throw new Error('No active quiz');
        }
        
        if (this.state.currentQuestionIndex < this.state.currentQuiz.questions.length - 1) {
            this.state.currentQuestionIndex++;
            this.notifyStateChange();
            return true;
        }
        
        return false;
    }
    
    /**
     * Move to previous question
     */
    previousQuestion(): boolean {
        if (!this.state.currentQuiz) {
            throw new Error('No active quiz');
        }
        
        if (this.state.currentQuestionIndex > 0) {
            this.state.currentQuestionIndex--;
            this.notifyStateChange();
            return true;
        }
        
        return false;
    }
    
    /**
     * Go to specific question by index
     */
    goToQuestion(index: number): boolean {
        if (!this.state.currentQuiz) {
            throw new Error('No active quiz');
        }
        
        if (index >= 0 && index < this.state.currentQuiz.questions.length) {
            this.state.currentQuestionIndex = index;
            this.notifyStateChange();
            return true;
        }
        
        return false;
    }
    
    /**
     * Complete the quiz and calculate results
     */
    completeQuiz(): QuizResult {
        if (!this.state.currentQuiz || !this.state.startTime) {
            throw new Error('No active quiz');
        }
        
        const quiz = this.state.currentQuiz;
        const userAnswers: UserAnswer[] = [];
        let correctCount = 0;
        
        // Process each question and user answer
        for (const question of quiz.questions) {
            const selectedAnswerId = this.state.userAnswers.get(question.id) || '';
            const isCorrect = selectedAnswerId === question.correctAnswerId;
            
            if (isCorrect) {
                correctCount++;
            }
            
            userAnswers.push({
                questionId: question.id,
                selectedAnswerId,
                isCorrect,
                question
            });
        }
        
        const totalQuestions = quiz.questions.length;
        const percentage = Math.round((correctCount / totalQuestions) * 100);
        const passed = percentage >= quiz.passingScore;
        
        const result: QuizResult = {
            quizId: quiz.id,
            score: correctCount,
            totalQuestions,
            percentage,
            passed,
            answers: userAnswers,
            completedAt: new Date()
        };
        
        this.state.isCompleted = true;
        this.notifyStateChange();
        
        return result;
    }
    
    /**
     * Get current question
     */
    getCurrentQuestion() {
        if (!this.state.currentQuiz) {
            return null;
        }
        
        return this.state.currentQuiz.questions[this.state.currentQuestionIndex] || null;
    }
    
    /**
     * Get current state
     */
    getState(): QuizState {
        return { ...this.state };
    }
    
    /**
     * Check if current question is answered
     */
    isCurrentQuestionAnswered(): boolean {
        const currentQuestion = this.getCurrentQuestion();
        if (!currentQuestion) {
            return false;
        }
        
        return this.state.userAnswers.has(currentQuestion.id);
    }
    
    /**
     * Get answer for current question
     */
    getCurrentQuestionAnswer(): string | undefined {
        const currentQuestion = this.getCurrentQuestion();
        if (!currentQuestion) {
            return undefined;
        }
        
        return this.state.userAnswers.get(currentQuestion.id);
    }
    
    /**
     * Check if all questions are answered
     */
    areAllQuestionsAnswered(): boolean {
        if (!this.state.currentQuiz) {
            return false;
        }
        
        return this.state.currentQuiz.questions.every(question => 
            this.state.userAnswers.has(question.id)
        );
    }
    
    /**
     * Reset quiz state
     */
    reset(): void {
        this.state = {
            currentQuiz: null,
            currentQuestionIndex: 0,
            userAnswers: new Map(),
            startTime: null,
            isCompleted: false
        };
        this.notifyStateChange();
    }
    
    /**
     * Get progress percentage
     */
    getProgress(): number {
        if (!this.state.currentQuiz) {
            return 0;
        }
        
        return Math.round(((this.state.currentQuestionIndex + 1) / this.state.currentQuiz.questions.length) * 100);
    }
    
    /**
     * Notify state change
     */
    private notifyStateChange(): void {
        if (this.onStateChange) {
            this.onStateChange(this.getState());
        }
    }
}