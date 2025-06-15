class TestsCalss {
  logSomething(a: string) {
    console.log(a);
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
