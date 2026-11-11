// Offline működés: az alkalmazás fájljait a készülék eltárolja.
// A PDF-eket NEM tároljuk itt (azok a készülék saját könyvtárában vannak).
// Új verzió kiadásakor elég ezt a számot növelni.
const CACHE = 'konyv-lapozo-v1';
const FILES = [
    './',
    './index.html',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/maskable-512.png',
    './icons/apple-touch-icon.png',
    './icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
    // Egyenként tároljuk el; egy hiányzó ikon miatt ne álljon le az egész.
    e.waitUntil((async () => {
        const c = await caches.open(CACHE);
        await Promise.all(FILES.map(async (f) => {
            try {
                const res = await fetch(f, { cache: 'reload' });
                if (res.ok) await c.put(f, res);
            } catch (err) { /* majd legközelebb */ }
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Előbb a hálózat (hogy a frissítés megérkezzen), ha nincs net, a tárolt változat.
self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
    e.respondWith(
        fetch(req)
            .then(res => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE).then(c => c.put(req, copy));
                }
                return res;
            })
            .catch(() => caches.match(req, { ignoreSearch: true })
                .then(hit => hit || caches.match('./index.html')))
    );
});
