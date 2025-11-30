import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['**/*.test.ts'],
    // セットアップファイルを指定
    setupFiles: ['./setup.ts'],
    // テストを順次実行（DBの整合性を保つため）
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // テストのタイムアウト
    testTimeout: 30000,
  },
});

