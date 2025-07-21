import { resetWorkers } from "@cache-handle";

fetch("/cacheVersion")
  .then((response) => {
    if (response.ok) {
      return response.text();
    }
    throw new Error("Error");
  })
  .then((response) => {
    console.log(response);

    if (!response) return;

    const localCache = localStorage.getItem("cacheVersion");

    if (!localCache) {
      localStorage.setItem("cacheVersion", response);
      return;
    }

    if (localCache === response) return;

    localStorage.setItem("cacheVersion", response);

    resetWorkers();
  })
  .catch((error) => {
    console.log(error);
  });

(async function () {
  try {
    const resp = await fetch("/session", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok || resp.status == 401) resetWorkers({ noMessage: true });
  } catch (_) {
    console.log(_);
  }
})();
