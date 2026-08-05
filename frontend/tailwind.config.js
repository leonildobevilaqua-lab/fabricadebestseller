/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                shine: {
                    '0%': { left: '-100%' },
                    '100%': { left: '100%' }
                },
                scroll: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' }
                }
            },
            animation: {
                shine: 'shine 1.5s infinite',
                'spin-slow': 'spin 3s linear infinite',
                'scroll-slow': 'scroll 40s linear infinite',
            },
            colors: {
                'deep-charcoal': '#0A0A0A',
                'cyber-gold': '#FFD700',
                'signal-orange': '#FF4D00',
                brand: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                }
            }
        },
    },
    plugins: [],
}
