const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("sw.bundle.js");
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

const resetWorkers = () => {
  if (window.navigator && navigator.serviceWorker) {
    navigator.serviceWorker
      .getRegistrations()
      .then(async function (registrations) {
        for (let registration of registrations) {
          await registration.unregister();
        }

        setTimeout(() => {
          alert("New version available!!!");

          window.location.reload();
        }, 10);
      });
  }
};

registerServiceWorker();

class TestsCalss {
  doSomething() {
    fetch("/test", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((a) => {
        console.log(a);
      });

    fetch("/cacheVersion")
      .catch((err) => console.log(err))
      .then((response) => response && response.text())
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
      });
  }
}

const test = new TestsCalss();
test.doSomething();

window.onload = () => {
  document.querySelector("button").addEventListener("click", resetWorkers);
};

window.addEventListener("online", () => {
  resetWorkers();
});
