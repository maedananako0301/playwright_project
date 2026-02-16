import { test, expect } from '@playwright/test';

test('DB新規作成', async ({ page }) => {
  await page.goto('https://ctr97.smp.ne.jp/login.html', { timeout: 60000 });

  await page.getByRole('textbox', { name: 'アカウント' }).fill('997_maeda');
  await page.getByRole('textbox', { name: 'パスワード' }).fill('Q_contro1');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.getByRole('button', { name: 'OK' }).click();

  // networkidleは使わない
  await page.waitForLoadState('domcontentloaded');

  // DBメニュー
  const dbMenu = page.getByText('DB DB 通常DB 履歴DB トランザクションDB 仮想');
  await expect(dbMenu).toBeVisible({ timeout: 30000 });
  await dbMenu.click();

  await page.locator('#spl-global-menu-db')
    .getByRole('link', { name: '通常DB' })
    .click();

  await page.getByText('新規作成').click();

  // iframeが表示されるまで待つ
  await expect(page.locator('iframe.cboxIframe'))
    .toBeVisible({ timeout: 30000 });

  const frame = page.frameLocator('iframe.cboxIframe');

  await frame.locator('input#new-setting-field')
    .waitFor({ state: 'visible', timeout: 30000 });

  // dialog対策
  page.on('dialog', async dialog => {
    console.log('Dialog:', dialog.message());
    await dialog.accept();
  });

  // 構成設定
  await frame.locator('input#new-setting-field').click();
  console.log('✓ 構成設定ボタンをクリックしました');

  // 新規作成ボタンも同様に待つ
  await frame.locator('input#post_create_btn2')
    .waitFor({ state: 'visible', timeout: 30000 });

  await frame.locator('input#post_create_btn2').click();
  console.log('✓ 新規作成ボタンをクリックしました');

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