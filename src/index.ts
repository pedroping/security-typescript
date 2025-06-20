class TestsCalss {
  logSomething(a: string) {
    console.log(a);

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
  }
}

const test = new TestsCalss();

const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration =
        await navigator.serviceWorker.register("sw.bundle.js");
      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

test.logSomething("Test at an new class");

registerServiceWorker();

window.onload = () => {
  document.querySelector("button").addEventListener("click", () => {
    if (window.navigator && navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        console.log(registrations);

        for (let registration of registrations) {
          registration.unregister();
        }

        window.location.reload();
      });
    }
  });
};
