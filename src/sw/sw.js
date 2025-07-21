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
  const blockedPatterns = ["chrome-extension", "cacheVersion", "session"];

  const allowedPatterns = ["session-validator.bundle"];

  return (
    !allowedPatterns.some((part) => request.url.includes(part)) &&
    blockedPatterns.some((part) => request.url.includes(part))
  );
};

const cacheFirst = async ({ request, preloadResponsePromise }) => {
  if (shouldIgnoreRequest(request)) return fetch(request);

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
      "./dist/session-validator.bundle.js",
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/js/bootstrap.bundle.min.js",
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css",
    ])
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.disable();
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
  const preloadResponsePromise = event.preloadResponse || Promise.resolve(null);

  if (request.method === "GET" && !shouldIgnoreRequest(request)) {
    event.respondWith(cacheFirst({ request, preloadResponsePromise }));
  }
});
