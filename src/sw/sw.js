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
    return responseFromCache;
  }

  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) {
    putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }
  try {
    const responseFromNetwork = await fetch(request.clone());
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    await self.registration.navigationPreload.enable();
  }
};

self.addEventListener("activate", (event) => {
  event.waitUntil(enableNavigationPreload());
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
  )
    return;

  event.respondWith(
    cacheFirst({
      request: event.request,
      preloadResponsePromise: event.preloadResponse,
    })
  );
});
