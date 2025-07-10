const addResourcesToCache = async (resources) => {
  const cache = await caches.open("myCache");
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  if (
    request.url.includes("chrome-extension") ||
    request.url.includes("cacheVersion") ||
    request.url.includes("session")
  )
    return;

  const cache = await caches.open("myCache");
  await cache.put(request, response);
};

const cacheFirst = async ({ request, preloadResponsePromise }) => {
  if (
    request.url.includes("chrome-extension") ||
    request.url.includes("cacheVersion") ||
    request.url.includes("session")
  ) {
    return await fetch(request);
  }

  const responseFromCache = await caches.match(request);

  if (responseFromCache) {
    preloadResponsePromise && preloadResponsePromise.catch(() => {});
    return responseFromCache;
  }

  try {
    const preloadResponse = await preloadResponsePromise;
    if (preloadResponse) {
      await putInCache(request, preloadResponse.clone());
      return preloadResponse;
    }
  } catch (error) {
    console.warn("Navigation preload failed:", error);
  }

  try {
    const responseFromNetwork = await fetch(request.clone());
    await putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

self.addEventListener("activate", (event) => {
  event.waitUntil(async function () {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    return;
  })();
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
    event.request.url.includes("chrome-extension") ||
    event.request.url.includes("cacheVersion") ||
    event.request.url.includes("session")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.method === "POST" && event.request.mode === "navigate") {
    event.respondWith(new Response(null, { status: 204 }));
  }

  const responsePromise = (async () => {
    const preloadPromise = event.preloadResponse || Promise.resolve(null);

    const responseFromCache = await caches.match(event.request);

    if (responseFromCache) {
      preloadPromise.catch(() => {});
      return responseFromCache;
    }

    return cacheFirst({
      request: event.request,
      preloadResponsePromise: preloadPromise,
    });
  })();

  event.waitUntil(responsePromise);
  event.respondWith(responsePromise);
});
