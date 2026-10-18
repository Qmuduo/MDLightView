export type ThemePreference = 'system' | 'light' | 'dark';
export type Palette = {
  background: string;
  paper: string;
  text: string;
  muted: string;
  slate: string;
  accent: string;
  border: string;
  soft: string;
  onAccent: string;
  feature: string;
  water: string;
  draftBackground: string;
  draftText: string;
  danger: string;
  dangerMark: string;
};

export const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    background: '#F3F6FA', paper: '#FFFFFF', text: '#24354B', muted: '#506D7E',
    slate: '#5B7A8C', accent: '#2E59A7', border: '#DCE5ED', soft: '#E9EFF9',
    onAccent: '#FFFFFF', feature: '#EAF2F6', water: '#5AA4AE',
    draftBackground: '#F6BEC8', draftText: '#71394A', danger: '#A53D20', dangerMark: '#ED6D46',
  },
  dark: {
    background: '#131C2B', paper: '#1B2739', text: '#E6EDF7', muted: '#A6BCCA',
    slate: '#A6BCCA', accent: '#ACC7FF', border: '#34465E', soft: '#283C5D',
    onAccent: '#142B50', feature: '#22374B', water: '#7EC0C8',
    draftBackground: '#553542', draftText: '#FFDCE3', danger: '#FFAE91', dangerMark: '#ED6D46',
  },
};
