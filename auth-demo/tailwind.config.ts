import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Include the installed @hyperyai/sdk package so Tailwind generates its component classes
    './node_modules/@hyperyai/sdk/dist/**/*.js',
  ],
};

export default config;

