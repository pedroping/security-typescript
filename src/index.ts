import { resetWorkers } from "@cache-handle";

const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("sw.bundle.js");
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

registerServiceWorker();

class TestsCalss {
  doSomething() {
    console.log("AHA");
  }
}

const test = new TestsCalss();
test.doSomething();

window.onload = () => {
  document
    .querySelector("button")
    .addEventListener("click", () => resetWorkers({ noMessage: true }));
};

window.addEventListener("online", () => {
  resetWorkers({ noMessage: true });
});
