export const theme = {
  colors: {
    primary: '#f90680', // The vibrant neon pink from your design
    primaryDark: '#c20464',
    background: '#0f0a12', // The deep dark purple/black background
    surface: '#1a141e',   // Card and section backgrounds
    surfaceLight: '#251d2a',
    text: '#FFFFFF',
    textSecondary: '#666666',
    border: '#1a141e',
    error: '#CF6679',
    success: '#03DAC6',
    warning: '#F2C94C',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    
    // Seat states
    seatAvailable: '#666666',
    seatSelected: '#f90680',
    seatHeld: '#333333',
    seatBooked: '#333333',
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
      regular: 'SpaceGrotesk_400Regular',
      medium: 'SpaceGrotesk_500Medium',
      bold: 'SpaceGrotesk_700Bold',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    pageTitle: {
      fontSize: 20,
      fontFamily: 'SpaceGrotesk_700Bold',
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
      shadowColor: '#f90680',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#f90680',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
