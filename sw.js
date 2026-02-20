/**
 * QuietDue service worker
 * Caches static assets only. Does NOT cache user input. No background sync.
 * NOTE: Uses fetch() only for same-origin static files (HTML,CSS,JS). No user
 * data is ever transmitted. App code (app.js) does NOT use fetch/localStorage/
 * sessionStorage/cookies.
 */
const CACHE_NAME = "quietdue-v1";
const STATIC_ASSETS = [
  "/sitemap.xml",
  "/",
  "/index.html",
  "/fertility-window.html",
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
  "/about/",
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

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("formspree") || event.request.url.includes("api")) return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        const clone = response.clone();
        if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function () {
        return caches.match("/") || caches.match("/index.html");
      });
    })
  );
});
