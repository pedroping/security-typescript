const addResourcesToCache = async (resources) => {
  const cache = await caches.open("myCache");
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  if (
    !request.url.includes("session-validator") &&
    (request.url.includes("chrome-extension") ||
      request.url.includes("cacheVersion") ||
      request.url.includes("session"))
  )
    return;

  const cache = await caches.open("myCache");
  await cache.put(request, response);
};

const cacheFirst = async ({ request, preloadResponsePromise }) => {
  if (
    !request.url.includes("session-validator") &&
    (request.url.includes("chrome-extension") ||
      request.url.includes("cacheVersion") ||
      request.url.includes("session"))
  ) {
    return null;
  }

  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    preloadResponsePromise?.catch(() => {});
    return responseFromCache;
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

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );
});

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

self.addEventListener("fetch", (event) => {
  if (
    !event.request.url.includes("session-validator") &&
    (event.request.url.includes("chrome-extension") ||
      event.request.url.includes("cacheVersion") ||
      event.request.url.includes("session"))
  ) {
    return;
  }

  if (event.request.method === "POST" && event.request.mode === "navigate") {
    return;
  }

  const responsePromise = cacheFirst({
    request: event.request,
    preloadResponsePromise: event.preloadResponse || Promise.resolve(null),
  });

  event.waitUntil(responsePromise);
  event.respondWith(responsePromise);
});
