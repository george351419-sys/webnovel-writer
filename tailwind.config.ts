import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Catppuccin Mocha
        'ctp-base':    '#1e1e2e',
        'ctp-mantle':  '#181825',
        'ctp-crust':   '#11111b',
        'ctp-surface0':'#313244',
        'ctp-surface1':'#45475a',
        'ctp-surface2':'#585b70',
        'ctp-overlay0':'#6c7086',
        'ctp-overlay1':'#7f849c',
        'ctp-overlay2':'#9399b2',
        'ctp-subtext0':'#a6adc8',
        'ctp-subtext1':'#bac2de',
        'ctp-text':    '#cdd6f4',
        'ctp-lavender':'#b4befe',
        'ctp-blue':    '#89b4fa',
        'ctp-sapphire':'#74c7ec',
        'ctp-sky':     '#89dceb',
        'ctp-teal':    '#94e2d5',
        'ctp-green':   '#a6e3a1',
        'ctp-yellow':  '#f9e2af',
        'ctp-peach':   '#fab387',
        'ctp-maroon':  '#eba0ac',
        'ctp-red':     '#f38ba8',
        'ctp-mauve':   '#cba6f7',
        'ctp-pink':    '#f5c2e7',
        'ctp-flamingo':'#f2cdcd',
        'ctp-rosewater':'#f5e0dc',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
    },
  },
  plugins: [],
} satisfies Config
