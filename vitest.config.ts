import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    /**
     * Pinned to the timezone the institute actually works in.
     *
     * Dates here are not abstract — a follow-up booked for "tomorrow" has to appear in My Day on
     * the right morning in Parbhani, and the backend already stores and reasons in IST. Left to
     * the machine's own zone, a date test passes on a counsellor's laptop and fails in CI, or
     * worse, passes in both while proving nothing about either.
     */
    env: { TZ: 'Asia/Kolkata' },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
