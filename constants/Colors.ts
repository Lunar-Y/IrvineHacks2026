const lawnLensPalette = {
  background: '#0F1412',
  cardSurface: '#18201D',
  divider: '#FFFFFF1A',
  primary: '#2F6B4F',
  secondary: '#4C8B6B',
  tertiary: '#B7D3C0',
  textPrimary: '#F5F7F6',
  textMuted: '#9FAFAA',
  neutral: '#C7A23A',
  negative: '#B24A3A',
} as const;

export default {
  lawnLens: lawnLensPalette,
  light: {
    text: '#000',
    background: '#fff',
    tint: '#2f95dc',
    tabIconDefault: '#ccc',
    tabIconSelected: '#2f95dc',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: '#fff',
    tabIconDefault: '#ccc',
    tabIconSelected: '#fff',
  },
};
