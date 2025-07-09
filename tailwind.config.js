module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        'deep-red': '#991B1B',
        'status-critical': '#991B1B',
        'status-warning': '#DC2626',
        'status-caution': '#D97706',
        'status-success': '#059669',
        background: '#FFFFFF',
        secondary: '#F9FAFB',
        accent: '#F3F4F6',
        card: '#FFFFFF',
        'card-foreground': '#111827',
        'muted-foreground': '#6B7280',
        'popover': '#FFFFFF',
        'popover-foreground': '#111827',
        'destructive': '#DC2626',
        'destructive-foreground': '#FFFFFF',
        border: '#E5E7EB',
        input: '#E5E7EB',
        ring: '#111827',
        // Chart colors
        'chart-primary': '#3B82F6',
        'chart-secondary': '#10B981',
        'chart-accent': '#F59E0B',
        'chart-grid': '#E5E7EB',
      },
      fontSize: {
        hero: ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }], // 32px
        section: ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }], // 24px
        subsection: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }], // 20px
        body: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }], // 14px
        detail: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }], // 12px
      },
      spacing: {
        'xs': '0.25rem', // 4px
        'sm': '0.5rem', // 8px
        'md': '1rem', // 16px
        'lg': '1.5rem', // 24px
        'xl': '2rem', // 32px
      },
      borderRadius: {
        'sm': '0.25rem', // 4px
        'md': '0.5rem', // 8px
        'lg': '0.75rem', // 12px
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      transitionTimingFunction: {
        'fast': 'cubic-bezier(0.4, 0, 0.6, 1)',
        'normal': 'ease',
        'slow': 'ease-in-out',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      screens: {
        mobile: '768px',
        tablet: '1024px',
        desktop: '1280px',
      },
    },
  },
  plugins: [],
}; 