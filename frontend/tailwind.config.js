/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        grotesk: ['Anton', 'sans-serif'],
        condiment: ['Condiment', 'cursive'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        primary: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        border: 'var(--border-subtle)',
        glass: 'var(--glass-bg)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
      },
    },
  },
  plugins: [],
};
