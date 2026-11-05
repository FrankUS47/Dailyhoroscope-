星盤運勢 — iPhone 離線版（不需 App Store）

【安裝步驟】
1. 把整個資料夾上傳到任一免費靜態網站空間（GitHub Pages、Cloudflare Pages、Netlify 等，必須是 https 網址）。
   上傳時保持資料夾結構：index.html、sw.js、manifest.webmanifest、css/、js/、icons/ 都要一起。
2. 用 iPhone 的 Safari 開啟該網址（要用 Safari，Chrome 等其他瀏覽器無法加入主畫面）。
3. 等頁面最下方出現「✓ 已儲存於本機，可離線使用」。
4. 點 Safari 下方的「分享」圖示 → 「加入主畫面」→ 「新增」。
5. 之後從主畫面圖示開啟即可，沒有網路也能使用。出生資料只在手機本機計算，不會上傳。

【更新版本】
整個資料夾覆蓋上傳。若要讓手機立刻吃到新版，請把 sw.js 第二行的 VERSION（astro-v2）改成新的名稱（例如 astro-v3）。
手機在有網路時開啟一次，會自動更新，下一次開啟即為新版。

【檔案結構】
index.html            頁面骨架
css/style.css         樣式（含 iPhone 版面設定）
js/data.js            星座、行星、地點資料
js/astro.js           天文計算與歷史時區換算
js/fortune.js         運勢引擎
js/interpret.js       本命解讀（入廟旺陷、命主星、月相、相位）
js/ui.js              介面流程
js/pwa.js             離線快取註冊與加入主畫面提示
sw.js                 離線快取（service worker）
manifest.webmanifest  主畫面應用程式設定
icons/                圖示

【注意】
- 離線需要先在有網路時用 https 開啟過一次。直接從「檔案」App 或 AirDrop 開啟 HTML 無法離線使用，iPhone 的 Safari 不支援。
- iPhone 若長時間未使用，系統可能清除網站儲存資料，清除後再連網開啟一次即可恢復。
