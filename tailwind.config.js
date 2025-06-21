/** @type {import('tailwindcss').Config} */
import lineClamp from '@tailwindcss/line-clamp'

export default {
    content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [lineClamp],
}