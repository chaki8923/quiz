# QuizLive - リアルタイムクイズアプリ

複数人でリアルタイムにクイズに挑戦できるWebアプリです。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router, TypeScript)
- **スタイリング**: Tailwind CSS
- **DB / リアルタイム**: Supabase (PostgreSQL + Realtime)
- **ホスティング**: Vercel

## 機能

- クイズのカテゴリー管理（作成・編集・削除）
- クイズ管理（4択・補足説明付き・作成・編集・削除）
- 複数人でのリアルタイムクイズセッション
- 参加前に氏名を入力
- 全員の回答状況をリアルタイム表示
- 最終スコアの集計・表示

## セットアップ

### 環境変数

`.env.local` に以下を設定:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Vercelデプロイ

以下の環境変数をVercelのプロジェクト設定に追加:

| 変数名 | 値 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |

## ページ一覧

| URL | 説明 |
|-----|------|
| `/` | トップ（カテゴリー一覧・セッション開始） |
| `/admin` | 管理ダッシュボード |
| `/admin/categories` | カテゴリー管理 |
| `/admin/categories/[id]` | クイズ管理 |
| `/sessions/[id]/join` | 氏名入力・参加 |
| `/sessions/[id]` | クイズ回答（参加者） |
| `/sessions/[id]/host` | ホスト操作画面 |
| `/sessions/[id]/result` | 結果表示 |
