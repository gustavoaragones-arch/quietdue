/**
 * QuietDue service worker
 * Caches static assets only. Does NOT cache user input. No background sync.
 * NOTE: Uses fetch() only for same-origin static files (HTML,CSS,JS). No user
 * data is ever transmitted. App code (app.js) does NOT use fetch/localStorage/
 * sessionStorage/cookies.
 */
const CACHE_NAME = "quietdue-v3";
const STATIC_ASSETS = [
  "/sitemap.xml",
  "/",
  "/index.html",
  "/fertility-timing-guide/",
  "/fertility-timing-guide/stress-and-ovulation/",
  "/fertility-timing-guide/is-day-14-ovulation/",
  "/fertility-timing-guide/can-ovulation-change-each-month/",
  "/fertility-timing-guide/luteal-phase-length/",
  "/fertility-timing-guide/irregular-cycles-ovulation/",
  "/fertility-timing-guide/how-is-ovulation-calculated/",
  "/fertility-timing-guide/days-before-ovulation-fertile/",
  "/fertility-timing-guide/what-is-regular-cycle/",
  "/fertility-timing-guide/when-is-fertile-window/",
  "/fertility-timing-guide/how-fertility-calculators-work/",
  "/fertility-timing-guide/can-ovulation-be-late/",
  "/fertility-timing-guide/early-ovulation/",
  "/fertility-timing-guide/how-long-does-ovulation-last/",
  "/fertility-timing-guide/missed-period-timing/",
  "/fertility-timing-guide/travel-and-cycle-timing/",
  "/fertility-timing-guide/cycle-length-variation/",
  "/about/",
  "/education/",
  "/privacy/",
  "/disclaimer/",
  "/contact/",
  "/privacy-and-pregnancy-apps.html",
  "/how-accurate-are-due-dates.html",
  "/understanding-gestational-weeks.html",
  "/fertility-window-education.html",
  "/digital-privacy-health-tools.html",
  "/printable-pregnancy-timeline.html",
  "/manifest.json",
  "/logo.svg",
  "/assets/logo.png",
  "/styles.css",
  "/print.css",
  "/app.js",
  "/fertility.js",
  "/assets/js/timing-engine.js"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function sameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch (e) {
    return false;
  }
}

/** CSS/JS: network-first so style and script edits show up; cache as fallback offline. */
function isStylesheetOrScript(request) {
  if (request.method !== "GET" || !sameOrigin(request.url)) return false;
  try {
    return /\.(css|js)$/.test(new URL(request.url).pathname);
  } catch (e) {
    return false;
  }
}

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("formspree") || event.request.url.includes("api")) return;

  event.respondWith(
    (async function () {
      if (isStylesheetOrScript(event.request)) {
        const cached = await caches.match(event.request);
        try {
          const response = await fetch(event.request);
          if (response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, response.clone());
          }
          return response;
        } catch (e) {
          if (cached) return cached;
          return caches.match("/") || caches.match("/index.html");
        }
      }

      const cached = await caches.match(event.request);
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        const clone = response.clone();
        if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, clone);
        }
        return response;
      } catch (e) {
        return caches.match("/") || caches.match("/index.html");
      }
    })()
  );
});
