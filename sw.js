/* Offline atbalsts. Mainot failus, palielini VERSION, lai iPhone ielādētu jauno versiju. */
const VERSION = "stage3-v2";
const FILES = [
  "./", "index.html", "css/style.css", "js/app.js", "data/vocabulary.js",
  "manifest.webmanifest", "icons/icon.svg", "icons/apple-touch-icon.png",
  "icons/icon-192.png", "icons/icon-512.png"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Tīkls vispirms (lai redzētu jaunākos vārdus), kešatmiņa – ja nav interneta. */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
