# CLAUDE.md - Spot The Pop

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Spotify API を利用したアーティスト人気度当てクイズゲーム。ランダムに出題されるアーティストに対して、同じくらいの「人気度」を持つアーティストを予想し、差が少ないほど高得点。10問の合計スコアで競い、Firebase でランキングを管理する PWA 対応の Web アプリ。

## 技術スタック

- **フレームワーク**: Next.js 15.3.1 (App Router + Pages Router 混在)
- **言語**: TypeScript 5.8.3
- **UI**: React 19, Tailwind CSS 3.4
- **CSS**: Tailwind CSS（`@tailwindcss/postcss` v4 系プラグイン使用、tailwindcss 本体は 3.4）
- **アニメーション**: Framer Motion 12.9
- **HTTP**: node-fetch 3.3
- **外部API**: Spotify Web API (Client Credentials Flow)
- **データベース**: Firebase Firestore 11.6 (ランキング保存)
- **PWA**: next-pwa 5.6
- **パスエイリアス**: `@/*` → プロジェクトルート（tsconfig.json で設定）

## コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# Lint チェック
npm run lint

# アーティスト人気度の一括取得（開発用）
npx ts-node lib/fetchPopularityBatch.ts
```

## ディレクトリ構成

```
spot-the-pop/
├── main.py               # 初期プロトタイプ（Python/spotipy版CLI）※本番未使用
├── app/                  # App Router ページ
│   ├── layout.tsx        # ルートレイアウト（lang="ja"）
│   ├── globals.css       # グローバルCSS（Tailwind + ダークテーマ）
│   ├── page.tsx          # トップ（ゲーム説明 + ランキングTOP10をインライン表示）
│   ├── game/page.tsx     # ゲームプレイ画面
│   ├── results/page.tsx  # 結果表示 + 名前登録 + ランキング登録（実装済み）
│   └── ranking/page.tsx  # ランキング一覧
├── pages/api/            # API Routes (Pages Router)
│   ├── popularity.ts     # アーティスト人気度取得
│   ├── randomArtist.ts   # ランダムアーティスト取得
│   ├── ranking.ts        # ※空ファイル・未実装
│   └── ranking/
│       ├── check.ts      # ハイスコア判定 API
│       └── randomArtist.ts # ランキング用ランダムアーティスト取得
├── components/           # UI コンポーネント
│   ├── GameScreen.tsx    # ゲーム画面（実装済み・134行）
│   ├── ResultScreen.tsx  # ※空ファイル（機能は app/results/page.tsx に直接実装済み）
│   ├── NameRegistration.tsx # ※空ファイル（機能は app/results/page.tsx に直接実装済み）
│   └── RankingList.tsx   # ※空ファイル（ランキング表示は app/page.tsx に直接実装済み）
├── lib/                  # ユーティリティ・ビジネスロジック
│   ├── spotify.ts        # Spotify API 認証 (getSpotifyToken)
│   ├── firebase.ts       # Firebase 初期化
│   ├── ranking.ts        # ランキング CRUD (getTopRankings, saveRanking)
│   ├── getRandomArtist.ts # ランダムアーティスト選択ロジック
│   ├── JapaneseArtists.ts # アーティストリスト（人気度付き、約200組）
│   ├── types.ts          # マルチプレイヤー用型定義 (Room, Player)
│   └── fetchPopularityBatch.ts # アーティスト人気度バッチ取得スクリプト
├── types/                # 型定義
│   └── index.ts          # Ranking 型
└── public/               # 静的ファイル・PWA マニフェスト
    ├── manifest.json     # PWA マニフェスト（テーマカラー: #1DB954）
    ├── sw.js             # Service Worker（next-pwa 自動生成）
    └── workbox-*.js      # Workbox ランタイム（next-pwa 自動生成）
```

## アーキテクチャ

### ルーティング
- **App Router**（`app/`）: ページ（UI）を担当
- **Pages Router**（`pages/api/`）: API Routes を担当
- 両方が混在しているため、ページ追加は `app/` に、API 追加は `pages/api/` に配置すること

### 環境変数マッピング（next.config.js）
`next.config.js` で環境変数名をリマッピングしている:
- `SPOTIPY_CLIENT_ID` → `SPOTIFY_CLIENT_ID`
- `SPOTIPY_CLIENT_SECRET` → `SPOTIFY_CLIENT_SECRET`

コード内では `process.env.SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` でアクセス可能。

### スコアリング
- ランキングはスコアが**小さいほど上位**（お題との人気度差が少ない = 高得点）
- Spotify 人気度は 0-100 の公式スコア（日々変動）

### 結果・ランキング登録のデータフロー
- ゲーム終了時に `localStorage` に `gameResults`（score + results配列）を保存
- `app/results/page.tsx` が localStorage から読み取り、結果表示 + 名前登録を担当
- ランキング登録は `lib/ranking.ts` の `saveRanking()` 経由で Firestore に保存
- 重複登録防止のため `rankingSubmittedScore` を localStorage に保存

## 環境変数

`.env` ファイルに以下を設定:

```bash
# Spotify API
SPOTIPY_CLIENT_ID=xxx
SPOTIPY_CLIENT_SECRET=xxx

# Firebase (NEXT_PUBLIC_ プレフィックス必須)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

## API エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/randomArtist` | GET | ランダムアーティスト取得（?count=10） |
| `/api/popularity` | GET | アーティスト人気度取得（?name=xxx） |
| `/api/ranking` | GET/POST | ※未実装（空ファイル） |
| `/api/ranking/check` | POST | ハイスコア判定（{score}） |
| `/api/ranking/randomArtist` | GET | ランキング用ランダムアーティスト取得 |

## ゲームフロー

1. トップページでルール説明とランキングTOP10を表示
2. 「チャレンジ開始」で `/game` に遷移
3. `/api/randomArtist` から10組のアーティスト（お題）を取得
4. 各ラウンドでユーザーがアーティスト名を入力
5. `/api/popularity` で入力アーティストの人気度を取得
6. お題との人気度差を計算しスコア加算
7. 10問終了後 `/results` で結果表示（localStorage 経由でデータ受け渡し）
8. ランキングへ名前登録（`saveRanking` → Firestore）

## 注意事項

- App Router と Pages Router が混在している（API Routes は Pages Router 側）
- `components/ResultScreen.tsx`、`NameRegistration.tsx`、`RankingList.tsx` は空ファイル。対応機能はページファイルに直接実装済みのため、これらのコンポーネントは現在未使用
- `pages/api/ranking.ts` も空ファイル（ランキング操作は `lib/ranking.ts` + Firestore で対応済み）
- `lib/types.ts` にマルチプレイヤー用の型定義あり（将来の拡張用）
- PWA 設定は `next.config.js` で next-pwa により構成
- `manifest.json` で参照しているアイコン（icon-192x192.png, icon-512x512.png）は `public/` に未配置
- tsconfig.json の `module` は `CommonJS` に設定されている（ts-node でのスクリプト実行に対応）
- PostCSS 設定ファイルが2つ存在する（`postcss.config.js` と `postcss.config.mjs`）。`.mjs` 版が `@tailwindcss/postcss` v4 を使用、`.js` 版は旧来の `tailwindcss` + `autoprefixer` 構成。Next.js は `.mjs` を優先するため現状は `.mjs` が有効
- `main.py` は初期プロトタイプ（Python/spotipy版CLI）で本番では未使用。**Spotify API の認証情報がハードコードされている**ため、公開リポジトリにする場合は削除またはクリーンアップが必要
