export const resetWorkers = (config?: {
  noMessage?: boolean;
  customMessage?: string;
}) => {
  if (window.navigator && navigator.serviceWorker) {
    navigator.serviceWorker
      .getRegistrations()
      .then(async function (registrations) {
        for (let registration of registrations) {
          await registration.unregister();
        }

        setTimeout(() => {
          if (config?.noMessage) return window.location.reload();

          alert(config?.customMessage || "New version available!!!");

          window.location.reload();
        }, 10);
      });
  }
};
