export interface Question {
    id: string;
    text: string;
    answers: Answer[];
    correctAnswerId: string;
    explanation?: string;
}

export interface Answer {
    id: string;
    text: string;
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    passingScore: number;
    questions: Question[];
    timeLimit?: number; // in minutes
    category?: string;
    theme?: string;
}

export interface QuizResult {
    quizId: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    answers: UserAnswer[];
    completedAt: Date;
}

export interface UserAnswer {
    questionId: string;
    selectedAnswerId: string;
    isCorrect: boolean;
    question: Question;
}

export interface QuizState {
    currentQuiz: Quiz | null;
    currentQuestionIndex: number;
    userAnswers: Map<string, string>;
    startTime: Date | null;
    isCompleted: boolean;
}