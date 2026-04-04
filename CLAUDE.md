# CLAUDE.md - Spot The Pop

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Spotify API を利用した音楽クイズゲーム。2つのゲームモードを搭載:
- **TIMELINE**: 曲の発売年を当てるクイズ（10問、速度ボーナスあり）
- **VERSUS**: お題アーティストと同じくらいのフォロワー数を持つアーティストを予想（5問）

各モードに NORMAL/HARD の難易度があり、四半期シーズン制のランキングで競う。PWA 対応・EN/JA バイリンガルの Web アプリ。

## 技術スタック

- **フレームワーク**: Next.js 15.5 (App Router + Pages Router 混在)
- **言語**: TypeScript 5.8
- **UI**: React 19, Tailwind CSS 3.4
- **CSS**: `@tailwindcss/postcss` v4 系プラグイン使用（tailwindcss 本体は 3.4）
- **アニメーション**: Framer Motion 12.9
- **音声**: Web Audio API（クライアント生成、外部ファイル不要）
- **HTTP**: node-fetch 3.3
- **外部API**: Spotify Web API (Client Credentials Flow)
- **データベース**: Firebase Firestore 11.6 (ランキング保存)
- **PWA**: next-pwa 5.6
- **分析**: @vercel/analytics 2.0
- **i18n**: 自前実装（`lib/i18n.ts`、200+ キー、localStorage で言語保持）
- **パスエイリアス**: `@/*` → プロジェクトルート（tsconfig.json で設定）

## コマンド

```bash
# 開発サーバー起動（Turbopack）
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# Lint チェック
npm run lint

# アーティストデータ拡充
npm run enrich-artists
npm run expand-pool          # アーティストプール拡張
npm run expand-pool:dry      # ドライラン
npm run discover-playlists   # プレイリストからアーティスト発見
npm run discover-playlists:dry
```

## ディレクトリ構成

```
spot-the-pop/
├── main.py                   # 初期プロトタイプ（Python/spotipy版CLI）※本番未使用
├── app/                      # App Router ページ
│   ├── layout.tsx            # ルートレイアウト（lang="ja"、OGメタ）
│   ├── globals.css           # グローバルCSS（Tailwind + ダークテーマ）
│   ├── page.tsx              # トップ（モード選択 + ランキングリンク）
│   ├── game/page.tsx         # VERSUS ゲーム画面（5問）
│   ├── year/page.tsx         # TIMELINE ゲーム画面（10問、テンキー入力）
│   ├── daily/
│   │   ├── page.tsx          # デイリーチャレンジ（5問、60秒制限）
│   │   └── results/page.tsx  # デイリー結果表示
│   ├── results/page.tsx      # VERSUS 結果 + 名前登録 + ランキング登録
│   ├── ranking/
│   │   ├── page.tsx          # ランキング一覧（2x2: MODE × DIFFICULTY）
│   │   └── history/
│   │       └── season0/page.tsx  # シーズン0アーカイブ
│   ├── challenge/[id]/page.tsx   # フレンドチャレンジ
│   └── api/og/route.tsx      # OG画像生成（App Router API）
├── pages/api/                # API Routes (Pages Router)
│   ├── randomArtist.ts       # ランダムアーティスト取得
│   ├── popularity.ts         # アーティスト人気度取得
│   ├── search.ts             # アーティスト検索（オートコンプリート）
│   ├── ranking.ts            # ※空ファイル（未使用）
│   ├── ranking/
│   │   ├── check.ts          # ハイスコア判定 API
│   │   └── randomArtist.ts   # ランキング用ランダムアーティスト取得
│   ├── year/
│   │   └── tracks.ts         # TIMELINE用 楽曲+発売年取得
│   ├── daily/
│   │   ├── questions.ts      # デイリー出題
│   │   └── ranking.ts        # デイリーランキング
│   ├── challenge/
│   │   ├── create.ts         # チャレンジ作成
│   │   └── [id].ts           # チャレンジ取得
│   └── artists/
│       └── expand.ts         # アーティストプール拡張
├── components/               # UI コンポーネント
│   ├── GameScreen.tsx        # VERSUSゲーム画面（入力 + オートコンプリート）
│   ├── ArtistSearch.tsx      # アーティスト検索ドロップダウン
│   ├── ShareButton.tsx       # X/Twitter シェアボタン
│   ├── ShareSection.tsx      # シェア・コピーボタン群
│   ├── RoundFeedback.tsx     # ラウンド結果アニメーション
│   ├── ConfirmModal.tsx      # 名前確認ダイアログ
│   ├── AnimatedScore.tsx     # スコアカウントアップ
│   ├── HintPanel.tsx         # ジャンル・範囲ヒント
│   ├── Timer.tsx             # 60秒カウントダウン
│   ├── ScoreRank.tsx         # スコアランク表示
│   ├── Logo.tsx              # ブランドロゴ
│   ├── GenreSelector.tsx     # ジャンルフィルタ
│   ├── MetricSelector.tsx    # メトリクスセレクタ
│   ├── MuteToggle.tsx        # ミュートボタン
│   ├── ResultScreen.tsx      # ※空ファイル（app/results/page.tsx に実装済み）
│   ├── NameRegistration.tsx  # ※空ファイル（app/results/page.tsx に実装済み）
│   └── RankingList.tsx       # ※空ファイル（未使用）
├── lib/                      # ユーティリティ・ビジネスロジック
│   ├── spotify.ts            # Spotify API 認証 + 検索
│   ├── firebase.ts           # Firebase 初期化
│   ├── ranking.ts            # ランキング CRUD（シーズン制、ベストスコア制）
│   ├── getRandomArtist.ts    # ランダムアーティスト選択（除外リスト付き）
│   ├── metrics.ts            # スコア計算（対数比率: 1問最大20pt）
│   ├── i18n.ts               # EN/JA 翻訳（200+キー）
│   ├── sound.ts              # Web Audio API 効果音生成
│   ├── genres.ts             # ジャンルカテゴリ定義
│   ├── playerId.ts           # プレイヤーID生成（UUID、localStorage永続）
│   ├── challenge.ts          # チャレンジ作成ヘルパー
│   ├── dailyChallenge.ts     # デイリーチャレンジロジック
│   ├── fetchArtistData.ts    # Spotifyデータ拡充
│   ├── JapaneseArtists.ts    # 日本アーティストデータ（約4,000組）
│   ├── GlobalArtists.ts      # グローバルアーティストデータ（約11,000組）
│   ├── types.ts              # マルチプレイヤー用型定義（将来用）
│   └── fetchPopularityBatch.ts # 人気度バッチ取得
├── types/
│   └── index.ts              # 型定義（Ranking, GameMode, Difficulty, Artist等）
├── scripts/                  # データ生成・メンテナンス
│   ├── buildQuestionBank.ts      # JP問題バンク生成
│   ├── buildGlobalQuestionBank.ts # グローバル問題バンク生成
│   ├── buildWeeklyPacks.ts       # TIMELINE週間パック生成
│   ├── fetchGlobalArtists.ts     # グローバルアーティスト取得
│   ├── addJapaneseNames.ts       # 日本語名追加
│   ├── discoverFromPlaylists.ts  # プレイリストからアーティスト発見
│   ├── expandJP.ts               # JPアーティストプール拡張
│   ├── expandPool.ts             # 一般プール拡張
│   ├── enrichArtists.ts          # ジャンル・画像拡充
│   └── archiveSeason.ts          # シーズンアーカイブ
├── data/                     # 問題バンク（JSON、gitignore推奨の大容量ファイル）
│   ├── questionBank.json         # JP問題バンク（~11MB）
│   └── globalQuestionBank.json   # グローバル問題バンク（~15MB）
└── public/                   # 静的ファイル・PWA
    ├── manifest.json         # PWA マニフェスト（テーマカラー: #1DB954）
    ├── sw.js                 # Service Worker（next-pwa 自動生成）
    ├── packs/                # TIMELINE週間パック（buildWeeklyPacks.ts で生成）
    │   └── jp/week-YYYY-WXX.json
    └── workbox-*.js          # Workbox ランタイム
```

## アーキテクチャ

### ルーティング
- **App Router**（`app/`）: ページ（UI）を担当
- **Pages Router**（`pages/api/`）: API Routes を担当
- 両方が混在しているため、ページ追加は `app/` に、API 追加は `pages/api/` に配置すること
- 例外: `app/api/og/route.tsx` は App Router 側の API Route（OG画像生成用）

### ゲームモード

#### TIMELINE（`app/year/page.tsx`、~730行）
- 曲のアルバムアートを見て発売年を当てる
- 10問、テンキー入力（1960-2026）
- スコア計算（難易度別）:
  - **NORMAL**: ベース `10 × (1 - diff/11)^1.13`（差0→10pt、差11以上→0pt）、速度ボーナスなし。合計最大100pt
  - **HARD**: ベース `7.5 × (1 - diff/11)^1.13`（差0→7.5pt）+ 速度ボーナス（5秒以内+2.5pt、10秒以内+1.5pt、15秒以内+0.5pt）。合計最大100pt
- 週間パック: `/packs/jp/week-YYYY-WXX.json`（静的）をまず試行、失敗時は API フォールバック

#### VERSUS（`app/game/page.tsx`、174行）
- お題アーティストと同じフォロワー数のアーティストを予想
- 5問、テキスト入力（オートコンプリート付き）
- スコア計算: `max(0, 20 - 20 × |log10(theme) - log10(answer)|)`
  - 同一アーティスト→20pt、2倍差→約14pt、10倍差→0pt
  - 合計最大: 100pt

#### デイリーチャレンジ（`app/daily/page.tsx`）
- 5問、1問60秒制限
- タイムアウト時は0点

#### フレンドチャレンジ（`app/challenge/[id]/page.tsx`）
- URLベースの対戦チャレンジ

### 難易度
- **NORMAL（easy）**: フォロワー40万以上のアーティスト/楽曲
- **HARD**: フォロワー10万以上のアーティスト/楽曲

### ランキングシステム（`lib/ranking.ts`）
- **四半期シーズン制**: Season 1 = 2026年Q2（4-6月）、以降3ヶ月ごと
- **4次元フィルタ**: gameType（timeline/versus）× difficulty（easy/hard）
- **ベストスコア制**: `(playerId, gameType, difficulty, season)` ごとに最高スコアのみ保持
- **レート制限**: プレイヤーあたり60秒に5回まで
- **TOP50表示**: メダル（金銀銅）、自分のハイライト、圏外時はランク表示
- **シーズン0**: 2026年4月以前の旧スコアリング（アーカイブ済み）

### 環境変数マッピング（next.config.js）
`next.config.js` で環境変数名をリマッピング:
- `SPOTIPY_CLIENT_ID` → `SPOTIFY_CLIENT_ID`
- `SPOTIPY_CLIENT_SECRET` → `SPOTIFY_CLIENT_SECRET`

### データフロー
- ゲーム終了時に `localStorage` に `gameResults` を保存
- 結果ページが localStorage から読み取り、結果表示 + 名前登録
- ランキング登録は `lib/ranking.ts` の `saveRanking()` 経由で Firestore に保存
- 重複登録防止: `rankingSubmittedScore` を localStorage に保存
- プレイヤー識別: `playerId`（UUID、localStorage 永続）

### アーティストデータ
- `lib/JapaneseArtists.ts`: 約4,000組（nameJa, genres, popularity, followers付き）
- `lib/GlobalArtists.ts`: 約11,000組
- 除外リスト: VTuber、プロセカユニット、Hans Zimmer 等（`EXCLUDED_IDS`）

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
| `/api/randomArtist` | GET | ランダムアーティスト取得（?count=5&locale=ja&difficulty=hard） |
| `/api/popularity` | GET | アーティスト人気度取得（?name=xxx or ?id=xxx） |
| `/api/search` | GET | アーティスト検索（オートコンプリート） |
| `/api/year/tracks` | GET | TIMELINE用 楽曲+発売年取得（?count=10&locale=ja&difficulty=hard） |
| `/api/ranking/check` | POST | ハイスコア判定（{score}） |
| `/api/ranking/randomArtist` | GET | ランキング用ランダムアーティスト取得 |
| `/api/daily/questions` | GET | デイリーチャレンジ出題 |
| `/api/daily/ranking` | GET/POST | デイリーランキング |
| `/api/challenge/create` | POST | フレンドチャレンジ作成 |
| `/api/challenge/[id]` | GET | フレンドチャレンジ取得 |
| `/api/artists/expand` | POST | アーティストプール拡張 |
| `/api/og` | GET | OG画像生成（App Router） |

## 型定義（`types/index.ts`）

- `Difficulty = 'easy' | 'hard'`
- `GameMode = 'classic' | 'daily' | 'genre' | 'challenge'`
- `MetricMode = 'followers' | 'popularity'`（popularity は実質未使用）
- `GenreCategory = 'rock' | 'pop' | 'hiphop' | 'electronic' | 'idol' | 'anime' | 'all'`
- `Ranking`: playerName, score, gameType('versus'|'timeline'), region('jp'|'global'), difficulty, createdAt, playerId

## 注意事項

- App Router と Pages Router が混在（ページは `app/`、API は `pages/api/`、例外: `app/api/og/`）
- `components/ResultScreen.tsx`、`NameRegistration.tsx`、`RankingList.tsx` は空ファイル（機能はページに直接実装済み）
- `pages/api/ranking.ts` も空ファイル（ランキング操作は `lib/ranking.ts` + Firestore で対応済み）
- PostCSS 設定ファイルが2つ存在（`.mjs` が有効、`.js` は旧構成）
- tsconfig.json の `module` は `CommonJS`（ts-node でのスクリプト実行に対応）
- `data/` 配下の JSON ファイルは大容量（合計 50MB+）
- `main.py` は初期プロトタイプで本番未使用。**Spotify API 認証情報がハードコード**されているため公開時は要削除
- TIMELINE の週間パックは `scripts/buildWeeklyPacks.ts` で事前生成し `public/packs/` に配置
