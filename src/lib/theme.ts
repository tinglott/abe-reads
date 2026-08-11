export const theme = {
  color: {
    bg: '#FFF8E7',
    card: '#FFFFFF',
    ink: '#2B2118',
    inkSoft: '#6B5B4A',
    primary: '#2D6A9F',
    primaryDark: '#1E4C75',
    accent: '#E8A33D',
    accentDark: '#C4821F',
    correct: '#3E8E5A',
    correctBg: '#E4F4E9',
    wrong: '#C2453D',
    wrongBg: '#FBE6E4',
    border: '#E5D9C3',
    highlight: '#FFE9A8',
  },
  radius: { sm: 10, md: 16, lg: 24, pill: 999 },
  space: (n: number) => n * 4,
  font: {
    body: 18,
    read: 22,
    h1: 30,
    h2: 22,
    small: 14,
  },
  shadow: {
    shadowColor: '#2B2118',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

export type Theme = typeof theme;
