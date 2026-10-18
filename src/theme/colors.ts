export type ThemePreference = 'system' | 'light' | 'dark';
export const palettes = {
  light: { background: '#F3F6FB', paper: '#FFFFFF', text: '#202737', muted: '#65728A', accent: '#315BB8', border: '#DCE3EF', soft: '#EAF0FC', danger: '#B52C3B' },
  dark: { background: '#111722', paper: '#192130', text: '#E4EAF5', muted: '#A5B1C7', accent: '#A5BEFF', border: '#344057', soft: '#263550', danger: '#FF9AA6' },
};
export type Palette = typeof palettes.light;
