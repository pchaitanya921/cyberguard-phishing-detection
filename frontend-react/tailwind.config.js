/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: '#0f1419',
                    secondary: '#1a1f2e',
                    card: '#1e2433',
                    input: '#252b3b',
                },
                primary: {
                    DEFAULT: '#8b5cf6', // purple
                    light: '#a78bfa',
                    dark: '#7c3aed',
                },
                secondary: {
                    DEFAULT: '#3b82f6', // blue
                    light: '#60a5fa',
                    dark: '#2563eb',
                },
                accent: {
                    pink: '#ec4899',
                    cyan: '#06b6d4',
                    orange: '#f59e0b',
                },
                success: '#10b981',
                warning: '#f59e0b',
                critical: '#ef4444',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                }
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'blob': 'blob 7s infinite',
            },
        },
    },
    plugins: [],
}
