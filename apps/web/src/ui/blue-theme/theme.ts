import { createTheme } from '@mantine/core';
import type { MantineColorsTuple } from '@mantine/core';

const blue: MantineColorsTuple = [
  '#e1f8ff',
  '#cbedff',
  '#9ad7ff',
  '#64c1ff',
  '#3aaefe',
  '#20a2fe',
  '#099cff',
  '#0088e4',
  '#0079cd',
  '#0068b6',
];

const indigo: MantineColorsTuple = [
  '#eaedff',
  '#d1d6ff',
  '#a0a9fb',
  '#818cf8',
  '#4151f3',
  '#2638f2',
  '#162af2',
  '#071ed8',
  '#001ac2',
  '#0015ab',
];

export const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue,
    indigo,
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
});
