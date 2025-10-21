import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12 Pro as reference)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Device type detection
export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  
  return (
    (adjustedWidth >= 1000 && adjustedHeight >= 1000) ||
    SCREEN_WIDTH >= 768 ||
    (SCREEN_WIDTH > SCREEN_HEIGHT && SCREEN_WIDTH >= 1024)
  );
};

export const isSmallScreen = () => SCREEN_WIDTH < 375;
export const isMediumScreen = () => SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeScreen = () => SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768;
export const isExtraLargeScreen = () => SCREEN_WIDTH >= 768;

// Responsive scaling functions
export const scaleWidth = (size) => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

export const scaleHeight = (size) => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

export const scaleFont = (size) => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  const newSize = size * scale;
  
  if (isTablet()) {
    return newSize * 1.2; // Slightly larger fonts for tablets
  }
  
  return Math.max(12, newSize); // Minimum font size of 12
};

export const scaleSize = (size) => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  return size * scale;
};

// Responsive padding/margin
export const getResponsivePadding = (basePadding) => {
  if (isTablet()) {
    return basePadding * 1.5;
  }
  if (isSmallScreen()) {
    return basePadding * 0.8;
  }
  return basePadding;
};

export const getResponsiveMargin = (baseMargin) => {
  if (isTablet()) {
    return baseMargin * 1.5;
  }
  if (isSmallScreen()) {
    return baseMargin * 0.8;
  }
  return baseMargin;
};

// Grid columns based on screen size
export const getGridColumns = () => {
  if (isTablet()) {
    return 3; // 3 columns for tablets
  }
  if (isLargeScreen()) {
    return 2; // 2 columns for large phones
  }
  return 1; // 1 column for small/medium phones
};

// Card dimensions
export const getCardWidth = () => {
  if (isTablet()) {
    return SCREEN_WIDTH * 0.3; // 30% width for tablets
  }
  if (isLargeScreen()) {
    return SCREEN_WIDTH * 0.45; // 45% width for large phones
  }
  return SCREEN_WIDTH * 0.9; // 90% width for small phones
};

// Modal dimensions
export const getModalWidth = () => {
  if (isTablet()) {
    return SCREEN_WIDTH * 0.6; // 60% width for tablets
  }
  return SCREEN_WIDTH * 0.9; // 90% width for phones
};

export const getModalHeight = () => {
  if (isTablet()) {
    return SCREEN_HEIGHT * 0.7; // 70% height for tablets
  }
  return SCREEN_HEIGHT * 0.8; // 80% height for phones
};

// Button dimensions
export const getButtonHeight = () => {
  if (isTablet()) {
    return 56; // Larger buttons for tablets
  }
  if (isSmallScreen()) {
    return 44; // Smaller buttons for small screens
  }
  return 48; // Standard button height
};

// Icon sizes
export const getIconSize = (baseSize) => {
  if (isTablet()) {
    return baseSize * 1.3;
  }
  if (isSmallScreen()) {
    return baseSize * 0.9;
  }
  return baseSize;
};

// Input field dimensions
export const getInputHeight = () => {
  if (isTablet()) {
    return 56;
  }
  if (isSmallScreen()) {
    return 44;
  }
  return 48;
};

// Table cell dimensions
export const getTableCellHeight = () => {
  if (isTablet()) {
    return 60;
  }
  if (isSmallScreen()) {
    return 40;
  }
  return 50;
};

// Chart dimensions
export const getChartHeight = () => {
  if (isTablet()) {
    return 300;
  }
  if (isSmallScreen()) {
    return 180;
  }
  return 220;
};

export const getChartWidth = () => {
  return SCREEN_WIDTH - getResponsivePadding(32);
};

// Screen dimensions
export const SCREEN_DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isTablet: isTablet(),
  isSmallScreen: isSmallScreen(),
  isMediumScreen: isMediumScreen(),
  isLargeScreen: isLargeScreen(),
  isExtraLargeScreen: isExtraLargeScreen(),
};

// Responsive breakpoints
export const BREAKPOINTS = {
  small: 375,
  medium: 414,
  large: 768,
  extraLarge: 1024,
};

export default {
  scaleWidth,
  scaleHeight,
  scaleFont,
  scaleSize,
  getResponsivePadding,
  getResponsiveMargin,
  getGridColumns,
  getCardWidth,
  getModalWidth,
  getModalHeight,
  getButtonHeight,
  getIconSize,
  getInputHeight,
  getTableCellHeight,
  getChartHeight,
  getChartWidth,
  SCREEN_DIMENSIONS,
  BREAKPOINTS,
};
