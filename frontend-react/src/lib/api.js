// API Service for CyberGuard Backend

export const api = {
    // Analyze a URL
    analyzeUrl: async (url) => {
        try {
            const response = await fetch('/api/analyze-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });
            if (!response.ok) throw new Error('Analysis failed');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Get System Stats
    getStats: async () => {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) throw new Error('Failed to fetch stats');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Get Recent Threats
    getRecentThreats: async (limit = 10) => {
        try {
            const response = await fetch(`/api/recent-threats?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch threats');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Get All Analysis Logs
    getAnalysisLogs: async (limit = 20) => {
        try {
            const response = await fetch(`/api/analysis-logs?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch analysis logs');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};
