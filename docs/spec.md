# Megere Pace 仕様書

## 概要

Megere Paceは、Next.js（App Router構成）を用いたGPSランニングペース計測Webアプリです。100mごと等の区間ごとにペースを計測し、音声で通知します。PWA対応・Web Push通知機能も備えています。

## 主な機能

- GPSによるランニング計測（100m/500m/1000m区間ごと）
- 区間ごとのペース計測・履歴表示
- 音声によるペース通知（Web Speech API）
- テストモード（GPS不要、手動/自動でペース追加）
- Web Push通知（Service Worker, VAPID対応）
- PWA対応（manifest.json, オフライン対応）
- **バックグラウンド動作維持機能**
  - スマホのバックグラウンドや画面ロック時でもGPS計測を継続するため、無音またはユーザー選択のmp3ファイルをループ再生
  - Media Session APIでロック画面に「計測中」等の情報を表示し、OSからプロセスが破棄されないよう制御
  - バックグラウンド実行モードのトグルスイッチ、音声ファイル選択UIを提供

## 画面構成

### 1. メインページ（/）

- 計測開始/停止/リセットボタン
- 区間距離切替（100m/500m/1000m）
- 現在の距離・ペース・平均ペース表示
- 区間ごとの履歴表示
- 音声案内ボタン
- テストモード切替
- **バックグラウンド実行モードのトグルスイッチ**
  - 有効時は無音または選択したmp3をループ再生し、Media Session APIで「ランニング計測中...」等をロック画面に表示
- **音声ファイルの読み込み/選択ボタン**
  - デフォルトの無音ファイル（public/audio/silent.mp3）またはユーザーアップロードmp3を選択可能

### 2. サンドボックス（/sandbox）

- Push通知購読デモ
- Service Worker登録・Push購読・サーバー連携

## 主な技術・構成

- Next.js 15（App Router）
- React 19
- Web Push API（web-pushライブラリ）
- Web Speech API
- Geolocation API
- Tailwind CSS（postcss経由）
- ESLint, jsconfig
- PWA（manifest.json, serviceworker.js）
- **Media Session API**（ロック画面制御・メタデータ表示）
- **HTML5 Audio API**（無音/任意mp3のループ再生）

## 主要ファイル構成

- src/app/page.js: メインUI・計測ロジック、バックグラウンド実行UI
- src/hooks/useGPS.js: GPS計測・ペース管理カスタムフック
- src/hooks/useBackgroundStayAlive.js: バックグラウンド動作維持用カスタムフック（無音/任意mp3ループ再生、Media Session API制御）
- src/app/api/notify/route.js: Push通知APIエンドポイント
- src/app/sandbox/page.js: Push購読デモ
- public/manifest.json: PWAマニフェスト
- public/serviceworker.js: Service Worker
- public/audio/silent.mp3: デフォルト無音ファイル

## バックグラウンド動作維持機能 仕様詳細

- **目的**: スマホのバックグラウンドやロック画面でもGPS計測を維持し、OSによるプロセス停止を防ぐ
- **方式**:
  - 無音またはユーザー選択のmp3ファイルをAudio APIでループ再生
  - Media Session APIでロック画面に「ランニング計測中...」等の情報を表示
  - 再生開始/停止はユーザー操作（ボタン）またはGPS計測開始/停止と連動
  - ブラウザの自動再生制限（Autoplay Policy）に対応し、ユーザーインタラクション後に再生開始
  - 音声ファイルはpublic/audio/silent.mp3（デフォルト）またはアップロードファイルを選択可
- **UI**:
  - メインページに「バックグラウンド実行モード」トグルスイッチ
  - 音声ファイル選択ボタン（ファイルアップロード対応）
  - 状態表示（再生中/停止中）
- **実装例**:
  - src/hooks/useBackgroundStayAlive.jsでカスタムフック化
    - startStayAlive(), stopStayAlive(), setAudioFile() などのメソッドを提供
    - useGPS.jsと連携し、計測開始/停止時に自動で再生制御可能
  - Media Session APIのmetadataにタイトル「ランニング計測中...」、アーティスト「Megere Pace」等を設定
  - サービスワーカーと連携し、再生中断時の通知や音声ダッキング（音量制御）も検討

## API仕様

### POST /api/notify

- 概要: Push購読情報とGPS情報を受け取り、1分間（5秒間隔×12回）Push通知を送信
- リクエスト: { subscription, gps }
- レスポンス: { status: "ok" | "ng", message?, error? }

## 設定・ビルド

- `npm run dev` で開発サーバ起動
- `npm run build` でビルド
- PWA/Push通知にはVAPID公開鍵の環境変数設定が必要

## 備考

- 本番運用時はPush購読情報の永続化（DB等）が必要
- テストモードでGPS不要の動作確認が可能
- 詳細は各ソースコメント参照
