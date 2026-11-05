/* Service worker：首次載入後把全部檔案存進本機，之後完全離線可用 */
const VERSION = 'astro-v2';
const FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './css/style.css',
    './js/data.js',
    './js/astro.js',
    './js/fortune.js',
    './js/interpret.js',
    './js/ui.js',
    './js/pwa.js',
    './icons/icon-180.png',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// 快取優先；有網路時在背景更新，下次開啟即為新版
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
    event.respondWith(
        caches.match(req, { ignoreSearch: true }).then(hit => {
            const net = fetch(req).then(res => {
                if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
                return res;
            }).catch(() => hit || caches.match('./index.html'));
            return hit || net;
        })
    );
});
