import './styles.css';
import { Quiz, QuizResult, QuizState } from './types';
import { XMLQuizParser } from './xmlParser';
import { QuizManager } from './quizManager';
// import { StreakManager, StreakData } from './streakManager';
// import { LeaderboardManager } from './leaderboardManager';

class StudyEZApp {
    private quizManager: QuizManager;
    private availableQuizzes: Quiz[] = [];
    private currentResult: QuizResult | null = null;
    private currentStreakData: StreakData;
    private totalPointsEarned: number = 0;
    private activeTab: 'top' | 'around' = 'top';
    
    // DOM Elements
    private homeScreen!: HTMLElement;
    private quizScreen!: HTMLElement;
    private resultsScreen!: HTMLElement;
    private leaderboardScreen!: HTMLElement;
    private settingsScreen!: HTMLElement;
    
    constructor() {
        this.quizManager = new QuizManager();
        this.quizManager.setOnStateChange(this.handleStateChange.bind(this));
        
        // Initialize streak data
        this.currentStreakData = StreakManager.getStreakData();
        
        this.initializeApp();
        this.loadSampleQuizzes();
    }
    
    /**
     * Initialize the application
     */
    private initializeApp(): void {
        // Get DOM elements
        this.homeScreen = document.getElementById('home-screen')!;
        this.quizScreen = document.getElementById('quiz-screen')!;
        this.resultsScreen = document.getElementById('results-screen')!;
        this.leaderboardScreen = document.getElementById('leaderboard-screen')!;
        this.settingsScreen = document.getElementById('settings-screen')!;
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Show home screen initially
        this.showScreen('home');
        
        // Update streak display
        this.updateStreakDisplay();
        
        // Initialize navigation
        this.updateActiveNavigation('home');
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const navbar = document.querySelector('.navbar');
            const target = e.target as HTMLElement;
            
            if (navbar && !navbar.contains(target)) {
                this.closeMobileMenu();
            }
        });
    }
    
    /**
     * Set up event listeners
     */
    private setupEventListeners(): void {
        // Quiz navigation buttons
        const prevBtn = document.getElementById('prev-btn')!;
        const nextBtn = document.getElementById('next-btn')!;
        const submitBtn = document.getElementById('submit-btn')!;
        
        prevBtn.addEventListener('click', () => this.previousQuestion());
        nextBtn.addEventListener('click', () => this.nextQuestion());
        submitBtn.addEventListener('click', () => this.submitQuiz());
        
        // Results screen buttons
        const retryBtn = document.getElementById('retry-btn')!;
        const homeBtn = document.getElementById('home-btn')!;
        
        retryBtn.addEventListener('click', () => this.retryQuiz());
        homeBtn.addEventListener('click', () => this.goHome());
        
        // Navigation buttons
        const homeNavBtn = document.getElementById('home-nav-btn')!;
        const homeNav = document.getElementById('home-nav')!;
        const leaderboardNav = document.getElementById('leaderboard-nav')!;
        const settingsNav = document.getElementById('settings-nav')!;
        const mobileMenuBtn = document.getElementById('mobile-menu-btn')!;
        
        homeNavBtn.addEventListener('click', () => this.navigateToHome());
        homeNav.addEventListener('click', () => this.navigateToHome());
        leaderboardNav.addEventListener('click', () => this.navigateToLeaderboard());
        settingsNav.addEventListener('click', () => this.navigateToSettings());
        mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        
        // Leaderboard screen buttons
        const topPlayersTab = document.getElementById('top-players-tab')!;
        const aroundMeTab = document.getElementById('around-me-tab')!;
        const saveNameBtn = document.getElementById('save-name-btn')!;
        const addSampleDataBtn = document.getElementById('add-sample-data-btn')!;
        const clearLeaderboardBtn = document.getElementById('clear-leaderboard-btn')!;
        const leaderboardHomeBtn = document.getElementById('leaderboard-home-btn')!;
        
        topPlayersTab.addEventListener('click', () => this.switchLeaderboardTab('top'));
        aroundMeTab.addEventListener('click', () => this.switchLeaderboardTab('around'));
        saveNameBtn.addEventListener('click', () => this.savePlayerName());
        addSampleDataBtn.addEventListener('click', () => this.addSampleLeaderboardData());
        clearLeaderboardBtn.addEventListener('click', () => this.clearLeaderboard());
        leaderboardHomeBtn.addEventListener('click', () => this.goHome());
        
        // Settings screen buttons
        const settingsSaveNameBtn = document.getElementById('settings-save-name-btn')!;
        const exportDataBtn = document.getElementById('export-data-btn')!;
        const resetAllDataBtn = document.getElementById('reset-all-data-btn')!;
        const settingsHomeBtn = document.getElementById('settings-home-btn')!;
        
        settingsSaveNameBtn.addEventListener('click', () => this.savePlayerNameFromSettings());
        exportDataBtn.addEventListener('click', () => this.exportUserData());
        resetAllDataBtn.addEventListener('click', () => this.confirmResetAllData());
        settingsHomeBtn.addEventListener('click', () => this.goHome());
    }
    
    /**
     * Load sample quizzes
     */
    private async loadSampleQuizzes(): Promise<void> {
        try {
            const quizFiles = [
                'corporate-business-nl.xml',
                'zorg-welzijn.xml', 
                'techniek-nl.xml',
                'training-advies-nl.xml'
            ];

            for (const file of quizFiles) {
                try {
                    const response = await fetch(`./quizzes/${file}`);
                    if (response.ok) {
                        const xmlText = await response.text();
                        const quiz = XMLQuizParser.parseQuiz(xmlText);
                        this.availableQuizzes.push(quiz);
                    }
                } catch (error) {
                    console.warn(`Failed to load quiz file: ${file}`, error);
                }
            }
            
            // Fallback to sample quiz if no XML files loaded
            if (this.availableQuizzes.length === 0) {
                const jsQuizXML = XMLQuizParser.createSampleXML();
                const jsQuiz = XMLQuizParser.parseQuiz(jsQuizXML);
                this.availableQuizzes.push(jsQuiz);
            }
            
            this.renderQuizList();
        } catch (error) {
            console.error('Error loading quizzes:', error);
        }
    }
    
    /**
     * Render quiz list on home screen
     */
    private renderQuizList(): void {
        const quizList = document.getElementById('quiz-list')!;
        quizList.innerHTML = '';
        
        this.availableQuizzes.forEach(quiz => {
            const quizCard = document.createElement('div');
            quizCard.className = 'quiz-card';
            quizCard.setAttribute('data-category', quiz.category || 'Default');
            quizCard.innerHTML = `
                <h3>${quiz.title}</h3>
                <p>${quiz.description}</p>
                <div class="quiz-meta">
                    <span class="quiz-difficulty difficulty-${quiz.difficulty}">${quiz.difficulty}</span>
                    <span class="quiz-questions">5 questions</span>
                </div>
                <div class="quiz-meta">
                    <span>Passing Score: ${quiz.passingScore}%</span>
                    ${quiz.timeLimit ? `<span>Time Limit: ${quiz.timeLimit} min</span>` : ''}
                </div>
            `;
            
            quizCard.addEventListener('click', () => this.startQuiz(quiz));
            quizList.appendChild(quizCard);
        });
    }
    
    /**
     * Randomly select 5 questions from a quiz
     */
    private selectRandomQuestions(quiz: Quiz, count: number = 5): Quiz {
        const shuffledQuestions = [...quiz.questions].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffledQuestions.slice(0, Math.min(count, quiz.questions.length));
        
        return {
            ...quiz,
            questions: selectedQuestions
        };
    }

    /**
     * Start a quiz
     */
    private startQuiz(quiz: Quiz): void {
        // Create a new quiz with 5 random questions
        const shortQuiz = this.selectRandomQuestions(quiz, 5);
        this.quizManager.startQuiz(shortQuiz);
        this.showScreen('quiz');
    }
    
    /**
     * Handle state changes from quiz manager
     */
    private handleStateChange(state: QuizState): void {
        if (state.currentQuiz && !state.isCompleted) {
            this.updateQuizDisplay(state);
        }
    }
    
    /**
     * Update quiz display
     */
    private updateQuizDisplay(state: QuizState): void {
        if (!state.currentQuiz) return;
        
        const quiz = state.currentQuiz;
        const currentQuestion = this.quizManager.getCurrentQuestion();
        
        if (!currentQuestion) return;
        
        // Update quiz title
        const quizTitle = document.getElementById('quiz-title')!;
        quizTitle.textContent = quiz.title;
        
        // Update progress
        const questionCounter = document.getElementById('question-counter')!;
        questionCounter.textContent = `Vraag ${state.currentQuestionIndex + 1} van ${quiz.questions.length}`;
        
        const progressFill = document.getElementById('progress-fill')!;
        const progress = this.quizManager.getProgress();
        progressFill.style.width = `${progress}%`;
        
        // Update question
        const questionText = document.getElementById('question-text')!;
        questionText.textContent = currentQuestion.text;
        
        // Update answers
        const answersContainer = document.getElementById('answers-container')!;
        answersContainer.innerHTML = '';
        
        const currentAnswer = this.quizManager.getCurrentQuestionAnswer();
        
        currentQuestion.answers.forEach(answer => {
            const answerDiv = document.createElement('div');
            answerDiv.className = 'answer-option';
            if (currentAnswer === answer.id) {
                answerDiv.classList.add('selected');
            }
            answerDiv.textContent = answer.text;
            
            answerDiv.addEventListener('click', () => {
                // Remove selected class from all options
                answersContainer.querySelectorAll('.answer-option').forEach(option => {
                    option.classList.remove('selected');
                });
                
                // Add selected class to clicked option
                answerDiv.classList.add('selected');
                
                // Record the answer
                this.quizManager.answerQuestion(answer.id);
                
                // Update streak for this answer
                const isCorrect = answer.id === currentQuestion.correctAnswerId;
                const streakUpdate = StreakManager.updateStreakForAnswer(isCorrect);
                this.currentStreakData = streakUpdate.data;
                this.totalPointsEarned += streakUpdate.pointsEarned;
                
                // Update header display
                this.updateStreakDisplay();
                
                // Update buttons
                this.updateNavigationButtons(state);
            });
            
            answersContainer.appendChild(answerDiv);
        });
        
        this.updateNavigationButtons(state);
    }
    
    /**
     * Update navigation buttons
     */
    private updateNavigationButtons(state: QuizState): void {
        if (!state.currentQuiz) return;
        
        const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
        const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
        const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
        
        // Previous button
        prevBtn.disabled = state.currentQuestionIndex === 0;
        
        // Next/Submit button logic
        const isLastQuestion = state.currentQuestionIndex === state.currentQuiz.questions.length - 1;
        
        if (isLastQuestion) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
            submitBtn.disabled = !this.quizManager.areAllQuestionsAnswered();
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
            nextBtn.disabled = !this.quizManager.isCurrentQuestionAnswered();
        }
    }
    
    /**
     * Go to previous question
     */
    private previousQuestion(): void {
        this.quizManager.previousQuestion();
    }
    
    /**
     * Go to next question
     */
    private nextQuestion(): void {
        this.quizManager.nextQuestion();
    }
    
    /**
     * Submit quiz and show results
     */
    private submitQuiz(): void {
        try {
            this.currentResult = this.quizManager.completeQuiz();
            this.showResults(this.currentResult);
            this.showScreen('results');
        } catch (error) {
            console.error('Error submitting quiz:', error);
            alert('Error submitting quiz. Please try again.');
        }
    }
    
    /**
     * Show quiz results
     */
    private showResults(result: QuizResult): void {
        // Update score display
        const scorePercentage = document.getElementById('score-percentage')!;
        const scoreText = document.getElementById('score-text')!;
        const passStatus = document.getElementById('pass-status')!;
        
        scorePercentage.textContent = `${result.percentage}%`;
        scoreText.textContent = `Je hebt ${result.score} van de ${result.totalQuestions} goed`;
        
        passStatus.textContent = result.passed ? 'Geslaagd!' : 'Gezakt';
        passStatus.className = `status ${result.passed ? 'passed' : 'failed'}`;
        
        // Show detailed results
        const detailedResults = document.getElementById('detailed-results')!;
        detailedResults.innerHTML = '<h3>Detailed Results</h3>';
        
        result.answers.forEach((answer, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = `result-item ${answer.isCorrect ? 'correct' : 'incorrect'}`;
            
            const selectedAnswer = answer.question.answers.find(a => a.id === answer.selectedAnswerId);
            const correctAnswer = answer.question.answers.find(a => a.id === answer.question.correctAnswerId);
            
            resultItem.innerHTML = `
                <div class="result-question">Q${index + 1}: ${answer.question.text}</div>
                <div class="result-answer">
                    Your answer: ${selectedAnswer?.text || 'Not answered'}
                    ${!answer.isCorrect ? `<br>Correct answer: ${correctAnswer?.text}` : ''}
                </div>
                ${answer.question.explanation ? `<div class="result-explanation">${answer.question.explanation}</div>` : ''}
            `;
            
            detailedResults.appendChild(resultItem);
        });
        
        // Update quiz statistics
        this.currentStreakData = StreakManager.updateQuizStats(result.passed);
        
        // Update leaderboard
        LeaderboardManager.updateLeaderboard(this.currentStreakData);
        
        // Show streak and points update in results
        this.showResultsWithPoints(result);
    }
    
    /**
     * Retry current quiz
     */
    private retryQuiz(): void {
        if (this.currentResult) {
            const quiz = this.availableQuizzes.find(q => q.id === this.currentResult!.quizId);
            if (quiz) {
                this.startQuiz(quiz);
            }
        }
    }
    
    /**
     * Go back to home screen
     */
    private goHome(): void {
        this.quizManager.reset();
        this.currentResult = null;
        this.showScreen('home');
        this.updateStreakDisplay();
        this.updateActiveNavigation('home');
    }
    
    /**
     * Show specific screen
     */
    private showScreen(screenName: 'home' | 'quiz' | 'results' | 'leaderboard' | 'settings'): void {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show requested screen
        const screenMap = {
            'home': this.homeScreen,
            'quiz': this.quizScreen,
            'results': this.resultsScreen,
            'leaderboard': this.leaderboardScreen,
            'settings': this.settingsScreen
        };
        
        screenMap[screenName].classList.add('active');
    }
    
    /**
     * Create HTML quiz XML
     */
    private createHTMLQuizXML(): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <id>html-basics</id>
    <title>HTML Fundamentals</title>
    <description>Test your knowledge of HTML basics and structure</description>
    <difficulty>easy</difficulty>
    <passingScore>70</passingScore>
    <timeLimit>10</timeLimit>
    <questions>
        <question>
            <id>h1</id>
            <text>What does HTML stand for?</text>
            <answers>
                <answer id="a1">Hyper Text Markup Language</answer>
                <answer id="a2">High Tech Modern Language</answer>
                <answer id="a3">Home Tool Markup Language</answer>
                <answer id="a4">Hyperlink and Text Markup Language</answer>
            </answers>
            <correctAnswer>a1</correctAnswer>
            <explanation>HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.</explanation>
        </question>
        <question>
            <id>h2</id>
            <text>Which HTML tag is used for the largest heading?</text>
            <answers>
                <answer id="a1">&lt;h6&gt;</answer>
                <answer id="a2">&lt;h1&gt;</answer>
                <answer id="a3">&lt;header&gt;</answer>
                <answer id="a4">&lt;heading&gt;</answer>
            </answers>
            <correctAnswer>a2</correctAnswer>
            <explanation>The &lt;h1&gt; tag represents the largest heading, with headings getting smaller from h1 to h6.</explanation>
        </question>
        <question>
            <id>h3</id>
            <text>Which attribute specifies the URL of the page the link goes to?</text>
            <answers>
                <answer id="a1">src</answer>
                <answer id="a2">href</answer>
                <answer id="a3">url</answer>
                <answer id="a4">link</answer>
            </answers>
            <correctAnswer>a2</correctAnswer>
            <explanation>The href attribute specifies the URL of the page the link goes to in an anchor (&lt;a&gt;) tag.</explanation>
        </question>
        <question>
            <id>h4</id>
            <text>What is the correct HTML for creating a hyperlink?</text>
            <answers>
                <answer id="a1">&lt;a url="http://www.example.com"&gt;Example&lt;/a&gt;</answer>
                <answer id="a2">&lt;a href="http://www.example.com"&gt;Example&lt;/a&gt;</answer>
                <answer id="a3">&lt;a&gt;http://www.example.com&lt;/a&gt;</answer>
                <answer id="a4">&lt;a link="http://www.example.com"&gt;Example&lt;/a&gt;</answer>
            </answers>
            <correctAnswer>a2</correctAnswer>
            <explanation>The correct syntax for a hyperlink uses the href attribute: &lt;a href="URL"&gt;Link text&lt;/a&gt;</explanation>
        </question>
    </questions>
</quiz>`;
    }
    
    /**
     * Create CSS quiz XML
     */
    private createCSSQuizXML(): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
    <id>css-basics</id>
    <title>CSS Fundamentals</title>
    <description>Test your knowledge of CSS styling and selectors</description>
    <difficulty>hard</difficulty>
    <passingScore>80</passingScore>
    <timeLimit>20</timeLimit>
    <questions>
        <question>
            <id>c1</id>
            <text>What does CSS stand for?</text>
            <answers>
                <answer id="a1">Creative Style Sheets</answer>
                <answer id="a2">Cascading Style Sheets</answer>
                <answer id="a3">Computer Style Sheets</answer>
                <answer id="a4">Colorful Style Sheets</answer>
            </answers>
            <correctAnswer>a2</correctAnswer>
            <explanation>CSS stands for Cascading Style Sheets, which describes how HTML elements are displayed.</explanation>
        </question>
        <question>
            <id>c2</id>
            <text>Which CSS property is used to change the text color?</text>
            <answers>
                <answer id="a1">color</answer>
                <answer id="a2">text-color</answer>
                <answer id="a3">font-color</answer>
                <answer id="a4">text-style</answer>
            </answers>
            <correctAnswer>a1</correctAnswer>
            <explanation>The 'color' property is used to set the color of text in CSS.</explanation>
        </question>
        <question>
            <id>c3</id>
            <text>How do you select an element with id "myId"?</text>
            <answers>
                <answer id="a1">.myId</answer>
                <answer id="a2">#myId</answer>
                <answer id="a3">*myId</answer>
                <answer id="a4">myId</answer>
            </answers>
            <correctAnswer>a2</correctAnswer>
            <explanation>The # symbol is used to select elements by their ID in CSS.</explanation>
        </question>
        <question>
            <id>c4</id>
            <text>Which property is used to change the background color?</text>
            <answers>
                <answer id="a1">bg-color</answer>
                <answer id="a2">background-color</answer>
                <answer id="a3">bgcolor</answer>
                <answer id="a4">color-background</answer>
            </answers>
            <correctAnswer>a2</correctAnswer>
            <explanation>The 'background-color' property is used to set the background color of an element.</explanation>
        </question>
        <question>
            <id>c5</id>
            <text>What is the correct syntax for CSS comments?</text>
            <answers>
                <answer id="a1">// This is a comment</answer>
                <answer id="a2">&lt;!-- This is a comment --&gt;</answer>
                <answer id="a3">/* This is a comment */</answer>
                <answer id="a4"># This is a comment</answer>
            </answers>
            <correctAnswer>a3</correctAnswer>
            <explanation>CSS comments are written using /* comment text */ syntax.</explanation>
        </question>
    </questions>
</quiz>`;
    }
    
    /**
     * Update streak display in header
     */
    private updateStreakDisplay(): void {
        const streakMessage = document.getElementById('streak-message')!;
        const streakStats = document.getElementById('streak-stats')!;
        
        streakMessage.textContent = StreakManager.getStreakMessage(this.currentStreakData);
        streakStats.textContent = StreakManager.getStatsMessage(this.currentStreakData);
        
        // Add celebration animation if streak is notable
        if (this.currentStreakData.currentStreak > 0 && this.currentStreakData.currentStreak % 5 === 0) {
            streakMessage.classList.add('streak-celebration');
            setTimeout(() => {
                streakMessage.classList.remove('streak-celebration');
            }, 600);
        }
    }
    
    /**
     * Show streak update in results screen
     */
    private showStreakUpdate(passed: boolean, previousStreak: number, newStreakData: StreakData): void {
        const streakChangeMessage = document.getElementById('streak-change-message')!;
        const newStreakStats = document.getElementById('new-streak-stats')!;
        
        if (passed) {
            if (previousStreak === 0) {
                streakChangeMessage.textContent = "🎉 Great job! You've started your streak!";
                streakChangeMessage.className = 'streak-increase';
            } else {
                streakChangeMessage.textContent = `🔥 Streak increased to ${newStreakData.currentStreak}!`;
                streakChangeMessage.className = 'streak-increase';
            }
            
            // Special messages for milestone streaks
            if (newStreakData.currentStreak === 5) {
                streakChangeMessage.textContent = "🔥🔥 Amazing! You've reached a 5-quiz streak!";
            } else if (newStreakData.currentStreak === 10) {
                streakChangeMessage.textContent = "🔥🔥🔥 Incredible! 10-quiz streak achieved!";
            } else if (newStreakData.currentStreak >= 20) {
                streakChangeMessage.textContent = `🔥🔥🔥 LEGENDARY! ${newStreakData.currentStreak}-quiz streak!`;
            }
            
            // Check if it's a new longest streak
            if (newStreakData.currentStreak === newStreakData.longestStreak && newStreakData.currentStreak > 1) {
                streakChangeMessage.textContent += " NEW PERSONAL BEST!";
            }
        } else {
            if (previousStreak > 0) {
                streakChangeMessage.textContent = `💔 Streak reset! You had a ${previousStreak}-quiz streak.`;
                streakChangeMessage.className = 'streak-reset';
            } else {
                streakChangeMessage.textContent = "Keep trying! Pass a quiz to start your streak.";
                streakChangeMessage.className = '';
            }
        }
        
        newStreakStats.textContent = StreakManager.getStatsMessage(newStreakData);
        
        // Update header display as well
        this.updateStreakDisplay();
    }
    
    /**
     * Navigate to home and update nav
     */
    private navigateToHome(): void {
        this.goHome();
        this.updateActiveNavigation('home');
        this.closeMobileMenu();
    }
    
    /**
     * Navigate to leaderboard and update nav
     */
    private navigateToLeaderboard(): void {
        this.showLeaderboard();
        this.updateActiveNavigation('leaderboard');
        this.closeMobileMenu();
    }
    
    /**
     * Navigate to settings and update nav
     */
    private navigateToSettings(): void {
        this.showSettings();
        this.updateActiveNavigation('settings');
        this.closeMobileMenu();
    }
    
    /**
     * Update active navigation button
     */
    private updateActiveNavigation(active: 'home' | 'leaderboard' | 'settings'): void {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        const activeButton = document.getElementById(`${active}-nav`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
    
    /**
     * Toggle mobile menu
     */
    private toggleMobileMenu(): void {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn')!;
        const navLinks = document.querySelector('.nav-links')!;
        
        mobileMenuBtn.classList.toggle('active');
        navLinks.classList.toggle('mobile-open');
    }
    
    /**
     * Close mobile menu
     */
    private closeMobileMenu(): void {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn')!;
        const navLinks = document.querySelector('.nav-links')!;
        
        mobileMenuBtn.classList.remove('active');
        navLinks.classList.remove('mobile-open');
    }

    /**
     * Show results with points information
     */
    private showResultsWithPoints(result: QuizResult): void {
        const streakChangeMessage = document.getElementById('streak-change-message')!;
        const newStreakStats = document.getElementById('new-streak-stats')!;
        const pointsEarned = document.getElementById('points-earned')!;
        
        // Show points earned this quiz
        if (this.totalPointsEarned > 0) {
            pointsEarned.textContent = `🎉 You earned ${this.totalPointsEarned} points this quiz!`;
            pointsEarned.className = 'points-earned streak-increase';
        } else {
            pointsEarned.textContent = "No points earned - get into a streak to start earning!";
            pointsEarned.className = 'points-earned';
        }
        
        // Show streak status
        if (this.currentStreakData.isInStreak) {
            streakChangeMessage.textContent = `🔥 Active streak: ${this.currentStreakData.currentStreak} correct answers!`;
            streakChangeMessage.className = 'streak-increase';
        } else {
            if (this.currentStreakData.consecutiveCorrectAnswers > 0) {
                streakChangeMessage.textContent = `You need ${3 - this.currentStreakData.consecutiveCorrectAnswers} more correct to start a streak!`;
            } else {
                streakChangeMessage.textContent = "Answer 3 questions correctly in a row to start earning points!";
            }
            streakChangeMessage.className = 'streak-reset';
        }
        
        newStreakStats.textContent = StreakManager.getStatsMessage(this.currentStreakData);
        
        // Reset points earned for next quiz
        this.totalPointsEarned = 0;
        
        // Update header display
        this.updateStreakDisplay();
    }
    
    /**
     * Show leaderboard screen
     */
    private showLeaderboard(): void {
        this.showScreen('leaderboard');
        this.updateLeaderboardDisplay();
        this.updatePlayerNameInput();
        this.updateActiveNavigation('leaderboard');
    }
    
    /**
     * Show settings screen
     */
    private showSettings(): void {
        this.showScreen('settings');
        this.updateSettingsDisplay();
        this.updateActiveNavigation('settings');
    }
    
    /**
     * Switch leaderboard tab
     */
    private switchLeaderboardTab(tab: 'top' | 'around'): void {
        this.activeTab = tab;
        
        // Update tab buttons
        const topTab = document.getElementById('top-players-tab')!;
        const aroundTab = document.getElementById('around-me-tab')!;
        
        topTab.classList.toggle('active', tab === 'top');
        aroundTab.classList.toggle('active', tab === 'around');
        
        this.updateLeaderboardContent();
    }
    
    /**
     * Update leaderboard display
     */
    private updateLeaderboardDisplay(): void {
        this.updateCurrentPlayerRank();
        this.updateLeaderboardContent();
    }
    
    /**
     * Update current player rank display
     */
    private updateCurrentPlayerRank(): void {
        const currentPlayerRank = document.getElementById('current-player-rank')!;
        const playerName = LeaderboardManager.getPlayerName();
        const rank = LeaderboardManager.getCurrentPlayerRank();
        
        currentPlayerRank.textContent = `${playerName} - Positie: ${rank > 0 ? '#' + rank : 'Niet Gerangschikt'} | Punten: ${this.currentStreakData.totalPoints}`;
    }
    
    /**
     * Update leaderboard content based on active tab
     */
    private updateLeaderboardContent(): void {
        const leaderboardList = document.querySelector('.leaderboard-list')!;
        let entries: any[] = [];
        
        if (this.activeTab === 'top') {
            entries = LeaderboardManager.getTopPlayers(10);
        } else {
            const playerRank = LeaderboardManager.getCurrentPlayerRank();
            entries = LeaderboardManager.getPlayersAroundRank(playerRank, 3);
        }
        
        if (entries.length === 0) {
            leaderboardList.innerHTML = `
                <div class="empty-leaderboard">
                    <h3>No players yet!</h3>
                    <p>Be the first to appear on the leaderboard by earning points through streaks.</p>
                    <button id="add-sample-data-temp" class="btn btn-primary" style="margin-top: 1rem;">Add Sample Data</button>
                </div>
            `;
            
            const addSampleBtn = document.getElementById('add-sample-data-temp');
            if (addSampleBtn) {
                addSampleBtn.addEventListener('click', () => this.addSampleLeaderboardData());
            }
            return;
        }
        
        const currentPlayerName = LeaderboardManager.getPlayerName();
        
        leaderboardList.innerHTML = entries.map(entry => {
            const isCurrentPlayer = entry.playerName === currentPlayerName;
            const rankClass = entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : entry.rank === 3 ? 'bronze' : '';
            
            return `
                <div class="leaderboard-entry ${isCurrentPlayer ? 'current-player' : ''}">
                    <div class="rank-badge ${rankClass}">${entry.rank}</div>
                    <div class="player-info-entry">
                        <div class="player-name">${entry.playerName} ${isCurrentPlayer ? '(Jij)' : ''}</div>
                        <div class="player-stats">Langste Streak: ${entry.longestStreak} | Quizzes Geslaagd: ${entry.totalQuizzesPassed}</div>
                    </div>
                    <div class="player-points">${entry.totalPoints} pts</div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Save player name
     */
    private savePlayerName(): void {
        const nameInput = document.getElementById('player-name-input') as HTMLInputElement;
        const name = nameInput.value.trim();
        
        if (name && name.length > 0) {
            LeaderboardManager.setPlayerName(name);
            LeaderboardManager.updateLeaderboard(this.currentStreakData);
            this.updateLeaderboardDisplay();
            this.updateStreakDisplay();
        }
    }
    
    /**
     * Save player name from settings
     */
    private savePlayerNameFromSettings(): void {
        const nameInput = document.getElementById('settings-player-name') as HTMLInputElement;
        const name = nameInput.value.trim();
        
        if (name && name.length > 0) {
            LeaderboardManager.setPlayerName(name);
            LeaderboardManager.updateLeaderboard(this.currentStreakData);
            this.updateStreakDisplay();
            alert('Name saved successfully!');
        }
    }
    
    /**
     * Update player name inputs
     */
    private updatePlayerNameInput(): void {
        const nameInput = document.getElementById('player-name-input') as HTMLInputElement;
        nameInput.value = LeaderboardManager.getPlayerName();
    }
    
    /**
     * Update settings display
     */
    private updateSettingsDisplay(): void {
        const settingsNameInput = document.getElementById('settings-player-name') as HTMLInputElement;
        settingsNameInput.value = LeaderboardManager.getPlayerName();
        
        // Update user statistics
        const userStats = document.getElementById('user-stats')!;
        const rank = LeaderboardManager.getCurrentPlayerRank();
        const passRate = this.currentStreakData.totalQuizzesTaken > 0 
            ? Math.round((this.currentStreakData.totalQuizzesPassed / this.currentStreakData.totalQuizzesTaken) * 100)
            : 0;
        
        userStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${this.currentStreakData.totalPoints}</span>
                <span class="stat-label">Totaal Punten</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${rank > 0 ? '#' + rank : 'Niet Gerangschikt'}</span>
                <span class="stat-label">Ranglijst Positie</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${this.currentStreakData.currentStreak}</span>
                <span class="stat-label">Huidige Streak</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${this.currentStreakData.longestStreak}</span>
                <span class="stat-label">Langste Streak</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${this.currentStreakData.totalQuizzesPassed}</span>
                <span class="stat-label">Quizzes Geslaagd</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${passRate}%</span>
                <span class="stat-label">Slagingspercentage</span>
            </div>
        `;
    }
    
    /**
     * Add sample leaderboard data
     */
    private addSampleLeaderboardData(): void {
        LeaderboardManager.addSampleData();
        this.updateLeaderboardDisplay();
    }
    
    /**
     * Clear leaderboard
     */
    private clearLeaderboard(): void {
        if (confirm('Are you sure you want to clear the entire leaderboard? This action cannot be undone.')) {
            LeaderboardManager.clearLeaderboard();
            this.updateLeaderboardDisplay();
        }
    }
    
    /**
     * Export user data
     */
    private exportUserData(): void {
        const data = {
            playerName: LeaderboardManager.getPlayerName(),
            streakData: this.currentStreakData,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `studyez-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Confirm reset all data
     */
    private confirmResetAllData(): void {
        if (confirm('Are you sure you want to reset ALL your data? This will clear your streaks, points, and remove you from the leaderboard. This action cannot be undone.')) {
            this.resetAllData();
        }
    }
    
    /**
     * Reset all user data
     */
    private resetAllData(): void {
        this.currentStreakData = StreakManager.resetStreak();
        this.totalPointsEarned = 0;
        this.updateStreakDisplay();
        
        if (this.leaderboardScreen.classList.contains('active')) {
            this.updateLeaderboardDisplay();
        }
        
        alert('All data has been reset.');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StudyEZApp();
});


import { addScoreToLeaderboard, getLeaderboard } from './leaderboardManager'

// Score toevoegen na een quiz:
async function handleQuizCompleted(username: string, score: number) {
  await addScoreToLeaderboard(username, score)
  const leaderboard = await getLeaderboard()
  // Toon leaderboard in je UI
  console.log(leaderboard)
}