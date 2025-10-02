import { StreakData } from './streakManager';
import { loadLeaderboard, saveLeaderboard, clearLeaderboardStorage, LocalLeaderboardEntry } from './localDatabase';

export interface LeaderboardEntry {
    playerName: string;
    totalPoints: number;
    longestStreak: number;
    totalQuizzesPassed: number;
    lastActive: string;
    rank: number;
}

export class LeaderboardManager {
    private static readonly PLAYER_NAME_KEY = 'studyez_player_name';
    
    /**
     * Get current player name
     */
    static getPlayerName(): string {
        try {
            const name = localStorage.getItem(this.PLAYER_NAME_KEY);
            return name || 'Anonymous Player';
        } catch (e) {
            console.error('Error reading player name from localStorage', e);
            return 'Anonymous Player';
        }
    }
    
    /**
     * Set player name
     */
    static setPlayerName(name: string): void {
        try {
            localStorage.setItem(this.PLAYER_NAME_KEY, name);
        } catch (e) {
            console.error('Error saving player name to localStorage', e);
        }
    }
    
    /**
     * Update leaderboard with current player's stats
     */
    static updateLeaderboard(streakData: StreakData): void {
        const playerName = this.getPlayerName();
        const leaderboard = loadLeaderboard() as LocalLeaderboardEntry[];
        
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
        
        saveLeaderboard(topEntries);
    }
    
    /**
     * Get leaderboard data
     */
    static getLeaderboard(): LeaderboardEntry[] {
        // Convert stored local entries to LeaderboardEntry type
        const entries = loadLeaderboard();
        return entries.map(e => ({
            playerName: e.playerName,
            totalPoints: e.totalPoints,
            longestStreak: e.longestStreak,
            totalQuizzesPassed: e.totalQuizzesPassed,
            lastActive: e.lastActive,
            rank: e.rank
        }));
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
        clearLeaderboardStorage();
    }
    
    /**
     * Add sample data for testing
     */
    static addSampleData(): void {
        const sampleData: LocalLeaderboardEntry[] = [
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
        
        saveLeaderboard(sampleData);
    }
    
}