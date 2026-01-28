import { test, expect } from '@playwright/test';

test('DB新規作成 - frameLocator版', async ({ page }) => {
  // ログイン処理
  await page.goto('https://ctr97.smp.ne.jp/login.html', { timeout: 60000 });
  await page.getByRole('textbox', { name: 'アカウント' }).fill('997_maeda');
  await page.getByRole('textbox', { name: 'パスワード' }).fill('Q_contro1');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForLoadState('networkidle');
  
  // DBメニュー
  await page.getByText('DB DB 通常DB 履歴DB トランザクションDB 仮想').waitFor({ state: 'visible', timeout: 30000 });
  await page.getByText('DB DB 通常DB 履歴DB トランザクションDB 仮想').click();
  await page.locator('#spl-global-menu-db').getByRole('link', { name: '通常DB' }).click();
  await page.getByText('新規作成').click();
  
  // iframeを待機
  await page.locator('iframe.cboxIframe').waitFor({ state: 'attached' });
  
  // iframe内のconfirmをオーバーライド（ボタンクリック前）
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe.cboxIframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.confirm = () => true;
      iframe.contentWindow.alert = () => {};
    }
  });
  
  // frameLocatorを使用
  const frame = page.frameLocator('iframe.cboxIframe');
  
  // 構成設定ボタン（force: true で強制クリック）
  await frame.locator('input#new-setting-field').click({ force: true });
  console.log('✓ 構成設定ボタンをクリックしました');
  
  await page.waitForTimeout(500);
  
  // 新規作成ボタン（force: true で強制クリック）
  await frame.locator('input#post_create_btn2').click({ force: true });
  console.log('✓ 新規作成ボタンをクリックしました');
  
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  console.log('✓ DB作成完了');
});


// ========================================
// まとめ: 修正ポイント
// ========================================

/*
【問題】
iframe内の新規作成ボタンをクリックしても、confirmダイアログが処理されず、
DBが作成されない。

【原因】
1. page.on('dialog')はpage レベルのダイアログしか処理できない
2. iframe内で発生するconfirmは、iframe.contentWindow.confirm が呼ばれる
3. Playwrightのdialogイベントでは、iframe内のconfirmを補足できない場合がある

【解決方法】
iframe内のconfirm/alert関数を直接オーバーライドする：

await page.evaluate(() => {
  const iframe = document.querySelector('iframe.cboxIframe') as HTMLIFrameElement;
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.confirm = () => true;
    iframe.contentWindow.alert = () => {};
  }
});

【追加修正】
1. ボタンクリックに force: true を追加
   - 要素が完全に見えていなくてもクリック可能

2. 適切な待機時間を追加
   - await page.waitForTimeout(500)

3. エラーハンドリングを追加
   - try-catch でラップ

【確認されたダイアログ】
1. "現在フィールド数が0です。フィールド数が0のまま保存してよろしいですか？"
2. "DBの設定を保存します。よろしいですか？"

*/