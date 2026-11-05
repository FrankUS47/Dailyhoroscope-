/* PWA：註冊 service worker（離線快取）並在 iPhone Safari 顯示「加入主畫面」提示 */
(function () {
    function store(op, key, val) {
        try { return op === 'get' ? localStorage.getItem(key) : localStorage.setItem(key, val); } catch (e) { return null; }
    }
    var statusEl = document.getElementById('pwaStatus');
    function setStatus(t) { if (statusEl) statusEl.textContent = t; }

    var standalone = window.navigator.standalone === true ||
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    var ua = navigator.userAgent || '';
    var isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

    // 離線快取
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').then(function (reg) {
                function ready() { setStatus('✓ 已儲存於本機，可離線使用'); }
                if (reg.active && !reg.installing && !reg.waiting) ready();
                var w = reg.installing || reg.waiting;
                if (w) w.addEventListener('statechange', function () { if (w.state === 'activated') ready(); });
                navigator.serviceWorker.ready.then(ready);
            }).catch(function () { setStatus(''); });
        });
    } else if (location.protocol === 'file:') {
        setStatus('提示：需從網址（https）開啟一次，才能儲存離線使用');
    }

    // iPhone Safari（非主畫面模式）顯示安裝教學
    var banner = document.getElementById('pwaBanner');
    if (banner && isIOS && !standalone && store('get', 'pwaHintDismissed') !== '1') {
        banner.style.display = 'block';
        var btn = document.getElementById('pwaDismiss');
        if (btn) btn.addEventListener('click', function () {
            banner.style.display = 'none';
            store('set', 'pwaHintDismissed', '1');
        });
    }
})();
