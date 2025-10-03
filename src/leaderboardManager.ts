import { StreakData } from './streakManager';

export interface LeaderboardEntry {
    playerName: string;
    totalPoints: number;
    longestStreak: number;
    totalQuizzesPassed: number;
    lastActive: string;
    rank: number;
}

export class LeaderboardManager {
    private static readonly LEADERBOARD_COOKIE = 'studyez_leaderboard';
    private static readonly PLAYER_NAME_COOKIE = 'studyez_player_name';
    
    /**
     * Get current player name
     */
    static getPlayerName(): string {
        const name = this.getCookie(this.PLAYER_NAME_COOKIE);
        return name || 'Anonymous Player';
    }
    
    /**
     * Set player name
     */
    static setPlayerName(name: string): void {
        this.setCookie(this.PLAYER_NAME_COOKIE, name, 365);
    }
    
    /**
     * Update leaderboard with current player's stats
     */
    static updateLeaderboard(streakData: StreakData): void {
        const playerName = this.getPlayerName();
        const leaderboard = this.getLeaderboard();
        
        // Find existing entry or create new one
        let playerEntry = leaderboard.find(entry => entry.playerName === playerName);
        
        if (playerEntry) {
            // Update existing entry
            playerEntry.totalPoints = streakData.totalPoints;
            playerEntry.longestStreak = streakData.longestStreak;
            playerEntry.totalQuizzesPassed = streakData.totalQuizzesPassed;
            playerEntry.lastActive = new Date().toISOString();
        } else {
            // Create new entry
            playerEntry = {
                playerName,
                totalPoints: streakData.totalPoints,
                longestStreak: streakData.longestStreak,
                totalQuizzesPassed: streakData.totalQuizzesPassed,
                lastActive: new Date().toISOString(),
                rank: 0 // Will be calculated when sorting
            };
            leaderboard.push(playerEntry);
        }
        
        // Sort by total points (descending) and update ranks
        leaderboard.sort((a, b) => {
            if (b.totalPoints === a.totalPoints) {
                // If points are equal, sort by longest streak
                if (b.longestStreak === a.longestStreak) {
                    // If streaks are equal, sort by total quizzes passed
                    return b.totalQuizzesPassed - a.totalQuizzesPassed;
                }
                return b.longestStreak - a.longestStreak;
            }
            return b.totalPoints - a.totalPoints;
        });
        
        // Update ranks
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        
        // Keep only top 100 entries
        const topEntries = leaderboard.slice(0, 100);
        
        this.saveLeaderboard(topEntries);
    }
    
    /**
     * Get leaderboard data
     */
    static getLeaderboard(): LeaderboardEntry[] {
        const cookieData = this.getCookie(this.LEADERBOARD_COOKIE);
        
        if (cookieData) {
            try {
                return JSON.parse(cookieData) || [];
            } catch (error) {
                console.error('Error parsing leaderboard data:', error);
            }
        }
        
        return [];
    }
    
    /**
     * Get current player's rank
     */
    static getCurrentPlayerRank(): number {
        const playerName = this.getPlayerName();
        const leaderboard = this.getLeaderboard();
        
        const playerEntry = leaderboard.find(entry => entry.playerName === playerName);
        return playerEntry ? playerEntry.rank : 0;
    }
    
    /**
     * Get top N players
     */
    static getTopPlayers(limit: number = 10): LeaderboardEntry[] {
        const leaderboard = this.getLeaderboard();
        return leaderboard.slice(0, limit);
    }
    
    /**
     * Get players around current player's rank
     */
    static getPlayersAroundRank(playerRank: number, range: number = 2): LeaderboardEntry[] {
        const leaderboard = this.getLeaderboard();
        const startIndex = Math.max(0, playerRank - range - 1);
        const endIndex = Math.min(leaderboard.length, playerRank + range);
        
        return leaderboard.slice(startIndex, endIndex);
    }
    
    /**
     * Clear all leaderboard data
     */
    static clearLeaderboard(): void {
        this.deleteCookie(this.LEADERBOARD_COOKIE);
    }
    
    /**
     * Add sample data for testing
     */
    static addSampleData(): void {
        const sampleData: LeaderboardEntry[] = [
            { playerName: 'Quiz Master', totalPoints: 150, longestStreak: 25, totalQuizzesPassed: 20, lastActive: new Date().toISOString(), rank: 1 },
            { playerName: 'Study Pro', totalPoints: 128, longestStreak: 18, totalQuizzesPassed: 16, lastActive: new Date().toISOString(), rank: 2 },
            { playerName: 'Brain Trainer', totalPoints: 95, longestStreak: 15, totalQuizzesPassed: 12, lastActive: new Date().toISOString(), rank: 3 },
            { playerName: 'Knowledge Seeker', totalPoints: 87, longestStreak: 12, totalQuizzesPassed: 11, lastActive: new Date().toISOString(), rank: 4 },
            { playerName: 'Learner123', totalPoints: 76, longestStreak: 10, totalQuizzesPassed: 9, lastActive: new Date().toISOString(), rank: 5 },
            { playerName: 'Code Ninja', totalPoints: 65, longestStreak: 8, totalQuizzesPassed: 8, lastActive: new Date().toISOString(), rank: 6 },
            { playerName: 'Tech Student', totalPoints: 54, longestStreak: 7, totalQuizzesPassed: 7, lastActive: new Date().toISOString(), rank: 7 },
            { playerName: 'Rookie Dev', totalPoints: 43, longestStreak: 6, totalQuizzesPassed: 6, lastActive: new Date().toISOString(), rank: 8 },
            { playerName: 'Future Coder', totalPoints: 32, longestStreak: 5, totalQuizzesPassed: 5, lastActive: new Date().toISOString(), rank: 9 },
            { playerName: 'Beginner', totalPoints: 21, longestStreak: 4, totalQuizzesPassed: 4, lastActive: new Date().toISOString(), rank: 10 }
        ];
        
        this.saveLeaderboard(sampleData);
    }
    
    /**
     * Save leaderboard to cookies
     */
    private static saveLeaderboard(leaderboard: LeaderboardEntry[]): void {
        const cookieValue = JSON.stringify(leaderboard);
        this.setCookie(this.LEADERBOARD_COOKIE, cookieValue, 365);
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
}