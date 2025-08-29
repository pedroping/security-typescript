import { resetWorkers } from "@cache-handle";

const _cookieStore = (window as any).cookieStore;

async function versionCheck() {
  const localHash = localStorage.getItem("cacheVersion");
  const localCache = (await _cookieStore.get("cacheCookie"))?.value;

  console.log(localHash);
  console.log(localCache);

  if (!localHash) {
    fetch("/cacheVersion")
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error("Error");
      })
      .then(async (response) => {
        if (!response) return;

        _cookieStore.set({
          name: "cacheCookie",
          value: response,
          expires: Date.now() + 120000,
        });
        localStorage.setItem("cacheVersion", response);
      })
      .catch((error) => {
        console.log(error);
      });

    return;
  }

  if (localCache) return;

  fetch("/cacheVersion")
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error("Error");
    })
    .then(async (response) => {
      if (!response) return;

      if (localHash === response) {
        await _cookieStore.set({
          name: "cacheCookie",
          value: response,
          expires: Date.now() + 100000,
        });
        return;
      }

      await _cookieStore.set({
        name: "cacheCookie",
        value: response,
        expires: Date.now() + 100000,
      });
      localStorage.setItem("cacheVersion", response);

      resetWorkers();
    })
    .catch((error) => {
      console.log(error);
    });
}

async function versionCheckInterval() {
  await versionCheck();
  setInterval(async () => await versionCheck(), 120000);
}

(async function () {
  versionCheckInterval();

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
