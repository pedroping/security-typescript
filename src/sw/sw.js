const CACHE_NAME = "myCache-v1";

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  if (shouldIgnoreRequest(request)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
};

const shouldIgnoreRequest = (request) => {
  const blockedPatterns = [
    "chrome-extension",
    "cacheVersion",
    "session",
    "session-validator",
  ];
  return blockedPatterns.some((part) => request.url.includes(part));
};

const cacheFirst = async ({ request, preloadResponsePromise }) => {
  if (shouldIgnoreRequest(request)) return null;

  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    preloadResponsePromise?.catch(() => {});
    return cachedResponse;
  }

  if (request.mode === "navigate") {
    try {
      const preloadResponse = await preloadResponsePromise;
      if (preloadResponse) {
        await putInCache(request, preloadResponse.clone());
        return preloadResponse;
      }
    } catch (error) {
      console.warn("Navigation preload failed:", error);
    }
  }

  try {
    const networkResponse = await fetch(request);
    await putInCache(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    if (request.mode === "navigate") {
      const fallback = await caches.match("./offline.html");
      return fallback || new Response("Offline", { status: 503 });
    }

    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      "./",
      "./dist/index.bundle.js",
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/js/bootstrap.bundle.min.js",
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css",
    ])
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (shouldIgnoreRequest(request) || request.method !== "GET") return;

  const preloadResponsePromise = event.preloadResponse || Promise.resolve(null);

  event.respondWith(cacheFirst({ request, preloadResponsePromise }));
});
