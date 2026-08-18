import { darkTheme, lightTheme } from '@strapi/design-system';

const lightColors = {
  ...lightTheme.colors,
  neutral0: '#fffdf9',
  neutral100: '#f7f3ed',
  neutral150: '#f1ebe2',
  neutral200: '#e8e0d5',
  neutral300: '#ddd2c3',
  neutral600: '#756d63',
  neutral700: '#514b44',
  neutral800: '#2f2b27',
  neutral900: '#1a1917',
  neutral1000: '#11100f',
  primary100: '#f3ede4',
  primary200: '#e5d8c7',
  primary500: '#9a805b',
  primary600: '#7d6645',
  primary700: '#5f4d35',
  buttonPrimary500: '#8d744f',
  buttonPrimary600: '#6f593d',
  secondary100: '#f7f3ed',
  secondary200: '#e8e0d5',
  secondary500: '#9a805b',
  secondary600: '#7d6645',
  secondary700: '#5f4d35',
};

const darkColors = {
  ...darkTheme.colors,
  neutral0: '#171512',
  neutral100: '#1d1a17',
  neutral150: '#24201c',
  neutral200: '#302a24',
  neutral300: '#443b32',
  neutral600: '#b8aa99',
  neutral700: '#d7ccbe',
  neutral800: '#eee7dd',
  neutral900: '#f8f4ed',
  neutral1000: '#fffdf9',
  primary100: '#30281f',
  primary200: '#4d3f30',
  primary500: '#b49667',
  primary600: '#c6a778',
  primary700: '#dcc49e',
  buttonPrimary500: '#a98a60',
  buttonPrimary600: '#b99a6d',
  secondary100: '#30281f',
  secondary200: '#4d3f30',
  secondary500: '#b49667',
  secondary600: '#c6a778',
  secondary700: '#dcc49e',
};

export const priscilaLightTheme = {
  ...lightTheme,
  colors: lightColors,
};

export const priscilaDarkTheme = {
  ...darkTheme,
  colors: darkColors,
};
