export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastQuizDate: string;
    totalQuizzesPassed: number;
    totalQuizzesTaken: number;
    totalPoints: number;
    consecutiveCorrectAnswers: number;
    isInStreak: boolean;
}

export class StreakManager {
    private static readonly COOKIE_NAME = 'studyez_streak_data';
    private static readonly COOKIE_EXPIRY_DAYS = 365;
    
    /**
     * Get current streak data from cookies
     */
    static getStreakData(): StreakData {
        const cookieData = this.getCookie(this.COOKIE_NAME);
        
        if (cookieData) {
            try {
                const parsed = JSON.parse(cookieData);
                return {
                    currentStreak: parsed.currentStreak || 0,
                    longestStreak: parsed.longestStreak || 0,
                    lastQuizDate: parsed.lastQuizDate || '',
                    totalQuizzesPassed: parsed.totalQuizzesPassed || 0,
                    totalQuizzesTaken: parsed.totalQuizzesTaken || 0,
                    totalPoints: parsed.totalPoints || 0,
                    consecutiveCorrectAnswers: parsed.consecutiveCorrectAnswers || 0,
                    isInStreak: parsed.isInStreak || false
                };
            } catch (error) {
                console.error('Error parsing streak data from cookie:', error);
            }
        }
        
        // Return default data if no cookie exists or parsing failed
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastQuizDate: '',
            totalQuizzesPassed: 0,
            totalQuizzesTaken: 0,
            totalPoints: 0,
            consecutiveCorrectAnswers: 0,
            isInStreak: false
        };
    }
    
    /**
     * Update streak based on individual answer (not whole quiz)
     */
    static updateStreakForAnswer(isCorrect: boolean): { data: StreakData; pointsEarned: number } {
        const currentData = this.getStreakData();
        let pointsEarned = 0;
        
        if (isCorrect) {
            // Correct answer - increment consecutive count
            currentData.consecutiveCorrectAnswers++;
            
            // Check if we've reached streak threshold (3 consecutive correct)
            if (currentData.consecutiveCorrectAnswers >= 3 && !currentData.isInStreak) {
                currentData.isInStreak = true;
                currentData.currentStreak = currentData.consecutiveCorrectAnswers;
            }
            
            // If already in streak, continue building it
            if (currentData.isInStreak) {
                currentData.currentStreak = currentData.consecutiveCorrectAnswers;
                pointsEarned = 1; // Earn 1 point per correct answer while in streak
                currentData.totalPoints += pointsEarned;
                
                // Update longest streak if current is higher
                if (currentData.currentStreak > currentData.longestStreak) {
                    currentData.longestStreak = currentData.currentStreak;
                }
            }
        } else {
            // Wrong answer - reset everything
            currentData.consecutiveCorrectAnswers = 0;
            currentData.currentStreak = 0;
            currentData.isInStreak = false;
        }
        
        // Save updated data to cookies
        this.saveStreakData(currentData);
        
        return { data: currentData, pointsEarned };
    }

    /**
     * Update total quiz statistics
     */
    static updateQuizStats(passed: boolean): StreakData {
        const currentData = this.getStreakData();
        const today = new Date().toDateString();
        
        currentData.totalQuizzesTaken++;
        if (passed) {
            currentData.totalQuizzesPassed++;
        }
        
        currentData.lastQuizDate = today;
        this.saveStreakData(currentData);
        
        return currentData;
    }
    
    /**
     * Save streak data to cookies
     */
    private static saveStreakData(data: StreakData): void {
        const cookieValue = JSON.stringify(data);
        this.setCookie(this.COOKIE_NAME, cookieValue, this.COOKIE_EXPIRY_DAYS);
    }
    
    /**
     * Reset all streak data
     */
    static resetStreak(): StreakData {
        const resetData: StreakData = {
            currentStreak: 0,
            longestStreak: 0,
            lastQuizDate: '',
            totalQuizzesPassed: 0,
            totalQuizzesTaken: 0,
            totalPoints: 0,
            consecutiveCorrectAnswers: 0,
            isInStreak: false
        };
        
        this.saveStreakData(resetData);
        return resetData;
    }
    
    /**
     * Get streak status message
     */
    static getStreakMessage(streakData: StreakData): string {
        if (!streakData.isInStreak) {
            if (streakData.consecutiveCorrectAnswers === 0) {
                return "Beantwoord 3 vragen correct achter elkaar om een streak te starten!";
            } else if (streakData.consecutiveCorrectAnswers === 1) {
                return "✅ 1 goed! Nog 2 correct voor je streak!";
            } else if (streakData.consecutiveCorrectAnswers === 2) {
                return "✅✅ 2 goed! Nog één voor je streak!";
            }
        }
        
        if (streakData.isInStreak) {
            if (streakData.currentStreak < 5) {
                return `🔥 Streak Actief! ${streakData.currentStreak} goede antwoorden op een rij!`;
            } else if (streakData.currentStreak < 10) {
                return `🔥🔥 Geweldige streak! ${streakData.currentStreak} goede antwoorden!`;
            } else if (streakData.currentStreak < 20) {
                return `🔥🔥🔥 Ongelooflijk! ${streakData.currentStreak} antwoorden streak!`;
            } else {
                return `🔥🔥🔥🔥 LEGENDARISCH! ${streakData.currentStreak} antwoorden streak!`;
            }
        }
        
        return "Blijf doorgaan!";
    }
    
    /**
     * Get comprehensive stats message
     */
    static getStatsMessage(streakData: StreakData): string {
        const passRate = streakData.totalQuizzesTaken > 0 
            ? Math.round((streakData.totalQuizzesPassed / streakData.totalQuizzesTaken) * 100)
            : 0;
            
        return `Punten: ${streakData.totalPoints} | Huidige Streak: ${streakData.currentStreak} | Langste: ${streakData.longestStreak} | Slagingspercentage: ${passRate}%`;
    }
    
    /**
     * Check if streak should be reset due to inactivity (optional feature)
     */
    static checkStreakExpiry(maxDaysInactive: number = 7): boolean {
        const streakData = this.getStreakData();
        
        if (!streakData.lastQuizDate || streakData.currentStreak === 0) {
            return false;
        }
        
        const lastQuizDate = new Date(streakData.lastQuizDate);
        const today = new Date();
        const daysDifference = Math.floor((today.getTime() - lastQuizDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDifference > maxDaysInactive) {
            // Reset streak due to inactivity
            const updatedData = { ...streakData, currentStreak: 0 };
            this.saveStreakData(updatedData);
            return true;
        }
        
        return false;
    }
    
    /**
     * Set a cookie
     */
    private static setCookie(name: string, value: string, days: number): void {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }
    
    /**
     * Get a cookie value
     */
    private static getCookie(name: string): string | null {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        
        return null;
    }
    
    /**
     * Delete a cookie
     */
    private static deleteCookie(name: string): void {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
    
    /**
     * Export streak data for backup
     */
    static exportStreakData(): string {
        const data = this.getStreakData();
        return JSON.stringify(data, null, 2);
    }
    
    /**
     * Import streak data from backup
     */
    static importStreakData(jsonData: string): boolean {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate the imported data structure
            if (typeof data.currentStreak === 'number' &&
                typeof data.longestStreak === 'number' &&
                typeof data.lastQuizDate === 'string' &&
                typeof data.totalQuizzesPassed === 'number' &&
                typeof data.totalQuizzesTaken === 'number') {
                
                this.saveStreakData(data);
                return true;
            } else {
                throw new Error('Invalid data structure');
            }
        } catch (error) {
            console.error('Error importing streak data:', error);
            return false;
        }
    }
}
