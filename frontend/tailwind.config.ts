import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
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
          canvas: '#FAF8F5', // Fondo hueso cálido editorial
          card: '#FFFFFF',
          muted: '#F3F1EC',  // Gris piedra cálido (Stone) en lugar de azulado frío
          border: '#E6E2DA',
        },
        content: {
          primary: '#1C1917',   // Carbón cálido (Stone 900)
          secondary: '#57534E', // Piedra media (Stone 600)
          muted: '#8C857B',
        },
        // Tonos semánticos editoriales (Salvia botánico, Burdeos/Vino y Ocre dorado)
        // en lugar de los colores semáforo saturados por defecto
        emerald: {
          50: '#F3F6F4',
          100: '#E3EBE5',
          200: '#C5D6CA',
          500: '#4A7859',
          600: '#386146',
          700: '#2B4C36',
          800: '#213B2A',
          900: '#182B1F',
        },
        red: {
          50: '#FAF3F2',
          100: '#F3E3E1',
          200: '#E4C5C1',
          500: '#B5483A',
          600: '#99392C',
          700: '#7C2D22',
          800: '#63231B',
          900: '#4D1B15',
        },
        amber: {
          50: '#FAF6EE',
          100: '#F2E8D5',
          200: '#E3CFA8',
          400: '#C49638',
          500: '#AE8025',
          600: '#8F6619',
          700: '#725012',
          800: '#593E0E',
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
