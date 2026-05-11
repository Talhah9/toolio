/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fg: {
          DEFAULT: '#0A0A0A',
          2: '#404040',
          3: '#737373',
          4: '#A3A3A3',
        },
        'bg-soft': '#FAFAFA',
        'bg-hover': '#F5F5F5',
        accent: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          soft: '#EEF2FF',
        },
        border: {
          DEFAULT: '#EAEAEA',
          strong: '#D4D4D4',
        },
      },
      fontFamily: {
        sans: ['"Inter var"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
};
