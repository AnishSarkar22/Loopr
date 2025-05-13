import forms from '@tailwindcss/forms';
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
  },
  plugins: [
    forms,
    daisyui
  ],
  daisyui: {
    themes: ["luxury", "light"],
    defaultTheme: "luxury",
  }
}