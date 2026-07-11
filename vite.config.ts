import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pagesはプロジェクトページだと /リポジトリ名/ 配下に配信されるため、
  // 相対パスにしてリポジトリ名を設定に持ち込まないようにする
  // (ユーザーページ直下や独自ドメインでも同じ設定でそのまま動く)。
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
