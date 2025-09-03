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

function embedScripts() {
  let bootstrapScript = document.createElement("script");
  let sessionValidatorScript = document.createElement("script");

  bootstrapScript.src =
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/js/bootstrap.bundle.min.js";
  bootstrapScript.integrity =
    "sha384-j1CDi7MgGQ12Z7Qab0qlWQ/Qqz24Gc6BM0thvEMVjHnfYGF0rmFCozFSxQBxwHKO";
  bootstrapScript.crossOrigin = "anonymous";
  bootstrapScript.async = true;

  sessionValidatorScript.src = "/dist/session-validator.bundle.js";
  sessionValidatorScript.crossOrigin = "anonymous";
  sessionValidatorScript.async = true;

  document.body.appendChild(bootstrapScript);
  document.body.appendChild(sessionValidatorScript);
}

window.onload = () => {
  embedScripts();
  document
    .querySelector("button")
    .addEventListener("click", () => resetWorkers({ noMessage: true }));
};

window.addEventListener("online", () => {
  resetWorkers({ noMessage: true });
});
