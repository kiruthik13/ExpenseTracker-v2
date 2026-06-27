import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'pages/login.html'),
        register: resolve(__dirname, 'pages/register.html'),
        dashboard: resolve(__dirname, 'pages/dashboard.html'),
        expenses: resolve(__dirname, 'pages/expenses.html'),
        categories: resolve(__dirname, 'pages/categories.html'),
        budgets: resolve(__dirname, 'pages/budgets.html'),
        analytics: resolve(__dirname, 'pages/analytics.html'),
        profile: resolve(__dirname, 'pages/profile.html'),
        settings: resolve(__dirname, 'pages/settings.html'),
        calendar: resolve(__dirname, 'pages/calendar.html'),
        savings: resolve(__dirname, 'pages/savings.html'),
        subscriptions: resolve(__dirname, 'pages/subscriptions.html'),
      }
    }
  },
  server: {
    port: 3000
  }
});
