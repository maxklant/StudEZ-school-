import { Quiz } from './types';
import { XMLQuizParser } from './xmlParser';

export class AdminManager {
    private isAdminMode: boolean = false;
    private adminPassword: string = 'admin123'; // In een echte app zou dit beveiligd zijn
    private onQuizChange?: () => void;

    constructor() {
        this.initializeAdminEvents();
    }
    
    /**
     * Set callback for when quizzes change
     */
    public setOnQuizChange(callback: () => void): void {
        this.onQuizChange = callback;
    }

    /**
     * Initialize admin event listeners
     */
    private initializeAdminEvents(): void {
        const adminLoginBtn = document.getElementById('admin-login-btn');
        const adminPasswordInput = document.getElementById('admin-password') as HTMLInputElement;
        const adminLogoutBtn = document.getElementById('admin-logout-btn');
        const importQuizBtn = document.getElementById('import-quiz-btn');
        const quizFileInput = document.getElementById('quiz-file-input') as HTMLInputElement;
        const exportQuizzesBtn = document.getElementById('export-quizzes-btn');
        const deleteQuizBtns = document.querySelectorAll('[data-delete-quiz]');

        adminLoginBtn?.addEventListener('click', () => this.handleAdminLogin());
        adminPasswordInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAdminLogin();
        });
        adminLogoutBtn?.addEventListener('click', () => this.handleAdminLogout());
        importQuizBtn?.addEventListener('click', () => quizFileInput?.click());
        quizFileInput?.addEventListener('change', (e) => this.handleQuizImport(e));
        exportQuizzesBtn?.addEventListener('click', () => this.exportAllQuizzes());

        // Add event delegation for delete buttons
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.getAttribute('data-delete-quiz')) {
                this.deleteQuiz(target.getAttribute('data-delete-quiz')!);
            }
        });
    }

    /**
     * Handle admin login
     */
    private handleAdminLogin(): void {
        const passwordInput = document.getElementById('admin-password') as HTMLInputElement;
        const password = passwordInput.value;

        if (password === this.adminPassword) {
            this.isAdminMode = true;
            this.showAdminPanel();
            this.updateAdminQuizList();
            passwordInput.value = '';
            this.showNotification('Admin ingelogd', 'success');
        } else {
            this.showNotification('Onjuist wachtwoord', 'error');
            passwordInput.value = '';
        }
    }

    /**
     * Handle admin logout
     */
    private handleAdminLogout(): void {
        this.isAdminMode = false;
        this.hideAdminPanel();
        this.showNotification('Admin uitgelogd', 'info');
    }

    /**
     * Show admin panel
     */
    private showAdminPanel(): void {
        const adminLogin = document.getElementById('admin-login');
        const adminPanel = document.getElementById('admin-panel');
        
        adminLogin?.classList.add('hidden');
        adminPanel?.classList.remove('hidden');
    }

    /**
     * Hide admin panel
     */
    private hideAdminPanel(): void {
        const adminLogin = document.getElementById('admin-login');
        const adminPanel = document.getElementById('admin-panel');
        
        adminLogin?.classList.remove('hidden');
        adminPanel?.classList.add('hidden');
    }

    /**
     * Handle quiz file import
     */
    private async handleQuizImport(event: Event): Promise<void> {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        
        if (!files || files.length === 0) return;

        const file = files[0];
        
        if (!file.name.endsWith('.xml')) {
            this.showNotification('Alleen XML bestanden zijn toegestaan', 'error');
            return;
        }

        try {
            const xmlContent = await this.readFileAsText(file);
            const quiz = XMLQuizParser.parseQuiz(xmlContent);
            
            // Save quiz to localStorage
            this.saveQuizToStorage(quiz);
            this.updateAdminQuizList();
            this.showNotification(`Quiz "${quiz.title}" succesvol geïmporteerd`, 'success');
            
            // Notify parent app that quizzes changed
            if (this.onQuizChange) {
                this.onQuizChange();
            }
            
            // Reset file input
            target.value = '';
        } catch (error) {
            console.error('Error importing quiz:', error);
            this.showNotification(`Fout bij importeren: ${error}`, 'error');
        }
    }

    /**
     * Read file as text
     */
    private readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * Save quiz to localStorage
     */
    private saveQuizToStorage(quiz: Quiz): void {
        const existingQuizzes = this.getStoredQuizzes();
        
        // Check if quiz with same ID already exists
        const existingIndex = existingQuizzes.findIndex(q => q.id === quiz.id);
        
        if (existingIndex >= 0) {
            existingQuizzes[existingIndex] = quiz; // Update existing
        } else {
            existingQuizzes.push(quiz); // Add new
        }
        
        localStorage.setItem('imported_quizzes', JSON.stringify(existingQuizzes));
    }

    /**
     * Get stored quizzes from localStorage
     */
    private getStoredQuizzes(): Quiz[] {
        const stored = localStorage.getItem('imported_quizzes');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Update admin quiz list display
     */
    private updateAdminQuizList(): void {
        const quizList = document.getElementById('admin-quiz-list');
        if (!quizList) return;

        const storedQuizzes = this.getStoredQuizzes();
        
        if (storedQuizzes.length === 0) {
            quizList.innerHTML = '<p class="no-quizzes">Geen geïmporteerde quizzes gevonden</p>';
            return;
        }

        quizList.innerHTML = storedQuizzes.map(quiz => `
            <div class="admin-quiz-item">
                <div class="quiz-info">
                    <h3>${quiz.title}</h3>
                    <p>${quiz.description}</p>
                    <div class="quiz-meta">
                        <span class="quiz-difficulty ${quiz.difficulty}">${this.translateDifficulty(quiz.difficulty)}</span>
                        <span class="quiz-questions">${quiz.questions.length} vragen</span>
                        <span class="quiz-category">${quiz.category || 'Geen categorie'}</span>
                    </div>
                </div>
                <div class="quiz-actions">
                    <button class="btn btn-primary" onclick="this.closest('.admin-quiz-item').querySelector('.quiz-preview').style.display = this.closest('.admin-quiz-item').querySelector('.quiz-preview').style.display === 'block' ? 'none' : 'block'">
                        Preview
                    </button>
                    <button class="btn btn-danger" data-delete-quiz="${quiz.id}">
                        Verwijderen
                    </button>
                </div>
                <div class="quiz-preview" style="display: none;">
                    <h4>Vragen:</h4>
                    <ol>
                        ${quiz.questions.map(q => `
                            <li>
                                <strong>${q.text}</strong>
                                <ul>
                                    ${q.answers.map(a => `
                                        <li class="${a.id === q.correctAnswerId ? 'correct-answer' : ''}">${a.text}</li>
                                    `).join('')}
                                </ul>
                            </li>
                        `).join('')}
                    </ol>
                </div>
            </div>
        `).join('');
    }

    /**
     * Delete quiz
     */
    private deleteQuiz(quizId: string): void {
        if (!confirm('Weet je zeker dat je deze quiz wilt verwijderen?')) return;

        const existingQuizzes = this.getStoredQuizzes();
        const filteredQuizzes = existingQuizzes.filter(q => q.id !== quizId);
        
        localStorage.setItem('imported_quizzes', JSON.stringify(filteredQuizzes));
        this.updateAdminQuizList();
        this.showNotification('Quiz verwijderd', 'success');
        
        // Notify parent app that quizzes changed
        if (this.onQuizChange) {
            this.onQuizChange();
        }
    }

    /**
     * Export all quizzes
     */
    private exportAllQuizzes(): void {
        const quizzes = this.getStoredQuizzes();
        
        if (quizzes.length === 0) {
            this.showNotification('Geen quizzes om te exporteren', 'warning');
            return;
        }

        const dataStr = JSON.stringify(quizzes, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `studyez-quizzes-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Quizzes geëxporteerd', 'success');
    }

    /**
     * Translate difficulty to Dutch
     */
    private translateDifficulty(difficulty: string): string {
        const translations: { [key: string]: string } = {
            'easy': 'Makkelijk',
            'medium': 'Gemiddeld',
            'hard': 'Moeilijk',
            'makkelijk': 'Makkelijk',
            'gemiddeld': 'Gemiddeld',
            'moeilijk': 'Moeilijk'
        };
        return translations[difficulty.toLowerCase()] || difficulty;
    }

    /**
     * Show notification
     */
    private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
        // Create notification if it doesn't exist
        let notification = document.querySelector('.admin-notification') as HTMLElement;
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'admin-notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.className = `admin-notification ${type} show`;

        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    /**
     * Get all quizzes (including imported ones)
     */
    public getAllQuizzes(): Quiz[] {
        return this.getStoredQuizzes();
    }

    /**
     * Check if admin mode is active
     */
    public isAdmin(): boolean {
        return this.isAdminMode;
    }
}