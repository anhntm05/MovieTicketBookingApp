export const theme = {
  colors: {
    primary: '#E50914', // A vibrant red for movie apps
    primaryDark: '#B80710',
    background: '#121212', // Dark mode default
    surface: '#1E1E1E',   // Card backgrounds
    surfaceLight: '#2C2C2C',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    border: '#333333',
    error: '#CF6679',
    success: '#03DAC6',
    warning: '#F2C94C',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    
    // Seat states
    seatAvailable: '#333333',
    seatSelected: '#E50914',
    seatHeld: '#F2C94C',
    seatBooked: '#444444',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  typography: {
    fontFamilies: {
      regular: 'System', // Typically defaults to Roboto on Android, San Francisco on iOS
      medium: 'System',
      bold: 'System',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
