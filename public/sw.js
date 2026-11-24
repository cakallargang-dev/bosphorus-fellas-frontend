/* Bosphorus Fellas — Service Worker
 *
 * İki görev:
 *  1) Web Push bildirimleri (mevcut davranış korunur).
 *  2) Çevrimdışı açılış: uygulama kabuğunu (HTML/JS/CSS/görsel/font) önbelleğe alır.
 *
 * ⚠️ Veri önbelleği YOK — API istekleri (`/api/`) her zaman ağa gider; internet
 * yokken başarısız olur ve ekranlar "veri yok" durumunu gösterir. Bu bilinçli:
 * eski veriyi taze gibi göstermek yanlış bilgi üretiyordu.
 */

const VERSION = "bf-v3";
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const PRECACHE_FILES = [
  "/",
  "/dashboard",
  "/ekip",
  "/chat",
  "/harita",
  "/medya",
  "/profile",
  "/offline",
  "/manifest.json",
  "/brand-mark-white.png",
  "/icon-192.png",
  "/chat-bg.png",
  "/brand-bg-wide.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // Tek tek ekle: biri 404 olursa install düşmesin.
      await Promise.all(
        PRECACHE_FILES.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            if (res.ok) await cache.put(url, res.clone());
          } catch {
            /* çevrimdışı kurulum — yoksay */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    /\.(?:js|css|woff2?|ttf|png|jpe?g|webp|svg|ico|json|mp4)$/i.test(url.pathname)
  );
}

function isApi(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.port === "5050" ||
    /railway\.app$/.test(url.hostname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // POST/PUT (sohbet, form) her zaman ağa gider

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // API/görsel CDN'leri doğrudan
  if (isApi(url)) return; // veriyi asla önbellekleme

  // 1) Next.js statik dosyaları: cache-first (içerik hash'li, değişmez)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME);
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      })()
    );
    return;
  }

  // 2) Görseller/fontlar: stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME);
        const hit = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || network;
      })()
    );
    return;
  }

  // 3) Sayfa navigasyonları: ağ önce, düşerse önbellek
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL);
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          const hit = await cache.match(req);
          if (hit) return hit;
          const dash = await cache.match("/dashboard");
          if (dash) return dash;
          const offline = await cache.match("/offline");
          if (offline) return offline;
          return new Response(
            "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><body style='background:#030711;color:#e6edf5;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center'><div><h1 style='font-size:18px'>İnternet yok</h1><p style='color:#7a8da4;font-size:13px'>Bağlantı gelince tekrar deneyin.</p></div></body>",
            { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
          );
        }
      })()
    );
  }
});

// ─── Web Push ────────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Bosphorus Fellas", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Bosphorus Fellas";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "bf-notification",
    renotify: true,
    data: { url: data.url || "/dashboard" },
    vibrate: [120, 60, 120],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target =
    (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
