/**
 * Design System Configuration
 * Central place for all design tokens and consistent styling
 */

export const DESIGN_TOKENS = {
  // Spacing system (8px base unit)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Typography scale
  typography: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  // Border radius
  borderRadius: {
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Animation durations
  transitions: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
}

// Utility classes for consistent styling
export const CN_UTILS = {
  // Card styles
  card: 'bg-white border border-gray-200 rounded-lg shadow-sm',
  cardHover: 'hover:shadow-md transition-shadow duration-200',
  
  // Button base styles
  button: 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  
  // Input styles
  input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  
  // Container styles
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  pageContainer: 'min-h-screen bg-gray-50',
  
  // Layout styles
  sidebar: 'w-64 bg-white border-r border-gray-200 min-h-screen p-6',
  mainContent: 'flex-1 p-6',
  
  // Text styles
  heading: 'font-semibold text-gray-900',
  subheading: 'font-medium text-gray-700',
  body: 'text-gray-600',
  muted: 'text-gray-500',
  
  // Spacing utilities
  formGroup: 'space-y-2',
  cardContent: 'p-6',
  sectionSpacing: 'space-y-6',
  itemSpacing: 'space-y-4',
}

// Color palette (using Tailwind's default colors)
export const COLORS = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  secondary: {
    50: '#f8fafc',
    500: '#64748b',
    600: '#475569',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
}
