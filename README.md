# Playwrightテスト実行ガイド

## 📋 目次

- [環境セットアップ](#環境セットアップ)
- [プロキシ設定](#プロキシ設定)
- [テスト実行](#テスト実行)
- [トラブルシューティング](#トラブルシューティング)
- [開発ガイド](#開発ガイド)

---

## 🚀 環境セットアップ

### 必要な環境

- **Node.js**: v18以上
- **npm**: v9以上

### 初回セットアップ手順

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd <project-name>

# 2. 依存パッケージをインストール
npm install

# 3. Playwrightブラウザをインストール
npx playwright install
```

---

## 🔧 プロキシ設定

### 社内ネットワークからテストを実行する場合

社内ネットワークからテストを実行する場合は、プロキシ設定が必要です。

#### ステップ1: .envファイルを作成

プロジェクトルートに `.env` ファイルを作成してください。

```bash
# Windowsの場合
copy .env.example .env

# Mac/Linuxの場合
cp .env.example .env
```

#### ステップ2: プロキシ情報を設定

`.env` ファイルを開いて、以下の情報を入力してください：

```env
# プロキシサーバーのアドレス
PROXY_SERVER=http://proxy.company.com:8080

# プロキシ認証が必要な場合のみ設定
PROXY_USERNAME=your-username
PROXY_PASSWORD=your-password
```

> **⚠️ 重要**: `.env` ファイルは `.gitignore` に含まれているため、Gitにコミットされません。各メンバーが個別に設定する必要があります。

#### ステップ3: 設定確認

プロキシ設定が正しく読み込まれているか確認：

```bash
node -e "require('dotenv').config(); console.log('PROXY_SERVER:', process.env.PROXY_SERVER);"
```

プロキシサーバーのアドレスが表示されればOKです。

### プロキシ設定が不要な場合

自宅や社外ネットワークからテストを実行する場合は、`.env` ファイルの作成は不要です。
プロキシ設定がない場合、テストは通常通り実行されます。

---

## 🧪 テスト実行

### 基本的なテスト実行

```bash
# すべてのテストを実行
npm test

# または
npx playwright test
```

### ブラウザを表示してテスト実行（デバッグ用）

```bash
npx playwright test --headed
```

### 特定のテストファイルのみ実行

```bash
npx playwright test tests/test-1.spec.ts
```

### 特定のブラウザでのみ実行

```bash
# Chromiumのみ
npx playwright test --project=chromium

# Firefoxのみ
npx playwright test --project=firefox

# Microsoft Edgeのみ
npx playwright test --project=Edge
```

### デバッグモード

```bash
npx playwright test --debug
```

### テストレポートの表示

```bash
npx playwright show-report
```

---

## 🛠️ トラブルシューティング

### 問題1: `net::ERR_CONNECTION_TIMED_OUT`

**原因**: プロキシ設定が必要なのに設定されていない、または設定が間違っている

**解決方法**:
1. `.env` ファイルが作成されているか確認
2. `PROXY_SERVER` の値が正しいか確認
3. プロキシサーバーに接続できるか確認

### 問題2: `net::ERR_PROXY_AUTH_REQUESTED`

**原因**: プロキシ認証情報が設定されていない

**解決方法**:
`.env` ファイルに認証情報を追加
```env
PROXY_USERNAME=your-username
PROXY_PASSWORD=your-password
```

### 問題3: `Test timeout of 30000ms exceeded`

**原因**: ネットワークが遅い、またはページの読み込みに時間がかかっている

**解決方法**:
テストコードに以下を追加
```typescript
test.setTimeout(120000); // 120秒に延長
```

### 問題4: iframe内のボタンがクリックできない

**原因**: iframe内のconfirmダイアログが処理されていない

**解決方法**:
以下のコードをiframeのボタンクリック前に追加
```typescript
await page.evaluate(() => {
  const iframe = document.querySelector('iframe.cboxIframe') as HTMLIFrameElement;
  if (iframe?.contentWindow) {
    iframe.contentWindow.confirm = () => true;
    iframe.contentWindow.alert = () => {};
  }
});
```

### 問題5: ブラウザが起動しない

**原因**: Playwrightブラウザがインストールされていない

**解決方法**:
```bash
npx playwright install
```

---

## 📝 開発ガイド

### 新しいテストを作成する

1. `tests/` ディレクトリに新しいファイルを作成
   ```
   tests/new-test.spec.ts
   ```

2. 基本的なテンプレート
   ```typescript
   import { test, expect } from '@playwright/test';

   test('テストの説明', async ({ page }) => {
     // テストコードをここに記述
     await page.goto('https://example.com');
     // ...
   });
   ```

### テストのベストプラクティス

#### 1. タイムアウトを適切に設定

```typescript
test('長時間かかるテスト', async ({ page }) => {
  test.setTimeout(120000); // 120秒
  // ...
});
```

#### 2. iframe内の要素を操作する場合

```typescript
// iframeを待機
await page.locator('iframe.cboxIframe').waitFor({ state: 'attached' });

// iframe内のconfirmをオーバーライド
await page.evaluate(() => {
  const iframe = document.querySelector('iframe.cboxIframe') as HTMLIFrameElement;
  if (iframe?.contentWindow) {
    iframe.contentWindow.confirm = () => true;
    iframe.contentWindow.alert = () => {};
  }
});

// frameLocatorを使用
const frame = page.frameLocator('iframe.cboxIframe');
await frame.locator('button#submit').click({ force: true });
```

#### 3. ログを出力する

```typescript
console.log('✓ ログインが完了しました');
console.log('✓ ボタンをクリックしました');
```

#### 4. スクリーンショットを保存

```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### テストコードのコメント

```typescript
test('DB新規作成', async ({ page }) => {
  // Step 1: ログイン
  await page.goto('https://example.com/login');
  
  // Step 2: DB管理画面へ遷移
  await page.click('a[href="/db"]');
  
  // Step 3: 新規作成
  await page.click('button:has-text("新規作成")');
  
  // 処理完了を待機
  await page.waitForLoadState('networkidle');
  console.log('✓ DB作成完了');
});
```

---

## 📂 プロジェクト構成

```
project-root/
├── .env                    # プロキシ設定（Gitにコミットしない）
├── .env.example           # プロキシ設定のサンプル
├── .gitignore             # .envを除外
├── playwright.config.ts   # Playwright設定
├── package.json
├── README.md              # このファイル
└── tests/                 # テストファイル
    ├── test-1.spec.ts
    └── test-2.spec.ts
```

---

## 🔐 セキュリティ注意事項

### ❌ やってはいけないこと

- `.env` ファイルをGitにコミットする
- プロキシ認証情報をコードに直接記述する
- パスワードをSlackやメールで共有する

### ✅ 推奨事項

- `.env` ファイルは各自で作成・管理
- プロキシ認証情報は会社の認証情報管理システムを使用
- 不明な点は先輩メンバーに直接確認

---

## 📞 サポート

### 質問・問題がある場合

1. まず[トラブルシューティング](#トラブルシューティング)を確認
2. それでも解決しない場合は、以下の情報を添えてチームに質問:
   - エラーメッセージの全文
   - 実行したコマンド
   - 環境情報（OS、Node.jsバージョン）
   - スクリーンショット（あれば）

### 便利なコマンド

```bash
# Node.jsバージョン確認
node --version

# npmバージョン確認
npm --version

# Playwrightバージョン確認
npx playwright --version

# インストール済みブラウザの確認
npx playwright list-files
```

---

## 📚 参考資料

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Playwright API リファレンス](https://playwright.dev/docs/api/class-playwright)
- [社内Wikiのテスト自動化ページ](#) ← 適宜リンクを追加

---

## 🎯 よくある質問（FAQ）

### Q1: プロキシ設定は必須ですか？

**A**: 社内ネットワークからテストを実行する場合は必須です。社外（自宅など）からの場合は不要です。

### Q2: `.env` ファイルはGitにコミットされますか？

**A**: いいえ。`.gitignore` に含まれているため、コミットされません。各メンバーが個別に作成する必要があります。

### Q3: テストが失敗した場合、どこを確認すればいいですか？

**A**: 以下の順で確認してください：
1. `test-results/` フォルダのスクリーンショット
2. `playwright-report/` のHTMLレポート
3. コンソールのエラーメッセージ

### Q4: 複数のブラウザでテストする必要がありますか？

**A**: 通常はChromiumのみで十分です。クロスブラウザ対応が必要な場合のみ、他のブラウザでもテストしてください。

### Q5: テストが遅いのですが、高速化できますか？

**A**: 以下の方法で高速化できます：
- `--headed` オプションを外す（ヘッドレスモードで実行）
- 不要な待機時間を削除
- 並列実行を有効化（`fullyParallel: true`）

---

**更新日**: 2026-01-23  
**バージョン**: 1.0.0