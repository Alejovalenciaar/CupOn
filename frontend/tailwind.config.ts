import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          500: '#F97316',
          600: '#EA580C', // Terracota principal (CTAs, canjes y acentos clave)
          700: '#C2410C',
        },
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706', // Ámbar cálido para badges de vigencia y categorías
          700: '#B45309',
        },
        surface: {
          canvas: '#FAF9F6', // Fondo general hueso/arena mate (no blanco cegador)
          card: '#FFFFFF',
          muted: '#F1F5F9',
          border: '#E2E8F0',
        },
        content: {
          primary: '#0F172A',   // Carbón profundo para legibilidad y solidez
          secondary: '#475569', // Texto complementario legible
          muted: '#94A3B8',
        },
      },
      borderRadius: {
        card: '0.625rem',   // 10px: bordes contenidos y modernos
        button: '0.375rem', // 6px: controles compactos
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        hover: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config;
