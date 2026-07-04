import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Include the auth package so Tailwind scans its components
    '../../packages/hypery-auth/src/**/*.{js,ts,jsx,tsx}',
  ],
};

export default config;

