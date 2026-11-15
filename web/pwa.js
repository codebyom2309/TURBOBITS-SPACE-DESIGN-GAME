// COSMO QUEST Progressive Web App controller: SW registration, install prompt UI, iOS guide & offline status
(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);

  let deferredPrompt = null;
  let swReg = null;
  let updateReady = false;
  let offlineDismissed = false;

  function detectStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.navigator.standalone === true
    );
  }

  function detectIOS() {
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(ua);
    const isIpadOS =
      ua.includes("macintosh") &&
      typeof navigator.maxTouchPoints === "number" &&
      navigator.maxTouchPoints > 1;
    return isAppleMobile || isIpadOS;
  }

  function updateInstallUI() {
    const installed = detectStandalone();
    const ios = detectIOS();
    const installable = !!deferredPrompt;

    const navBtn = $("#navInstallBtn");
    if (navBtn) {
      const showTop = !installed && (installable || ios);
      navBtn.classList.toggle("hidden", !showTop);
      navBtn.title = ios && !installable ? "Add to Home Screen" : "Install COSMO QUEST App";
      navBtn.setAttribute(
        "aria-label",
        ios && !installable ? "Install on iOS Home Screen" : "Install COSMO QUEST Web App"
      );
    }

    const statusEl = $("#setPwaStatus");
    const settingsBtn = $("#setPwaBtn");
    if (statusEl && settingsBtn) {
      if (installed) {
        statusEl.textContent = "INSTALLED (APP MODE)";
        settingsBtn.textContent = "APP INSTALLED";
        settingsBtn.disabled = true;
      } else if (installable) {
        statusEl.textContent = "READY TO INSTALL";
        settingsBtn.textContent = "INSTALL APP";
        settingsBtn.disabled = false;
      } else if (ios) {
        statusEl.textContent = "SAFARI ADD TO HOME";
        settingsBtn.textContent = "IOS INSTALL GUIDE";
        settingsBtn.disabled = false;
      } else {
        statusEl.textContent = "BROWSER INSTALLABLE";
        settingsBtn.textContent = "HOW TO INSTALL";
        settingsBtn.disabled = false;
      }
    }
  }

  function openIosModal(genericFallback = false) {
    const modal = $("#pwaIosModal");
    if (!modal) return;
    const title = $("#pwaGuideTitle");
    const steps = $("#pwaGuideSteps");
    if (title && steps) {
      if (genericFallback) {
        title.textContent = "INSTALL COSMO QUEST APP";
        steps.innerHTML = `
          <p><strong>Desktop (Chrome / Edge):</strong> Click the install icon in the address bar or open browser menu &rarr; <em>Install COSMO QUEST</em>.</p>
          <p><strong>Android (Chrome):</strong> Tap the browser menu (&#8942;) &rarr; <em>Install app</em> or <em>Add to Home screen</em>.</p>
          <p><strong>iPhone / iPad (Safari):</strong> Tap <em>Share</em> &rarr; <em>Add to Home Screen</em>.</p>
        `;
      } else {
        title.textContent = "INSTALL ON IPHONE / IPAD";
        steps.innerHTML = `
          <p>1. Tap the <strong>Share</strong> button in Safari's toolbar.</p>
          <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
          <p>3. Tap <strong>Add</strong> to launch COSMO QUEST fullscreen like a native app.</p>
        `;
      }
    }
    modal.classList.remove("hidden");
  }

  async function triggerInstall() {
    if (detectStandalone()) {
      if (typeof toast === "function") toast("COSMO QUEST is already running in app mode.");
      return false;
    }
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === "accepted") {
          deferredPrompt = null;
          updateInstallUI();
          return true;
        }
      } catch (_) {}
      return false;
    }
    openIosModal(!detectIOS());
    return false;
  }

  function updateOfflineBanner(online) {
    const showOffline = !online && !offlineDismissed;
    document.body.classList.toggle("pwa-offline", showOffline);
    const bar = $("#pwaOfflineBar");
    if (!bar) return;
    bar.classList.toggle("hidden", !showOffline);
  }

  function notifyUpdateAvailable() {
    updateReady = true;
    const updBtn = $("#setPwaUpdateBtn");
    if (updBtn) updBtn.classList.remove("hidden");
    if (typeof toast === "function") {
      toast("App update ready. Reopen or tap Update App in Settings.", 4200);
    }
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", async () => {
      try {
        swReg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (swReg.waiting) notifyUpdateAvailable();
        swReg.addEventListener("updatefound", () => {
          const nw = swReg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              notifyUpdateAvailable();
            }
          });
        });
      } catch (_) {
        // Non-blocking if SW registration fails in restricted iframe/sandbox
      }
    });
  }

  function wireEvents() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      updateInstallUI();
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      updateInstallUI();
      if (typeof toast === "function") toast("COSMO QUEST installed! Launch it anytime from your Home Screen.");
    });

    const dm = window.matchMedia("(display-mode: standalone)");
    if (dm && typeof dm.addEventListener === "function") {
      dm.addEventListener("change", updateInstallUI);
    }

    window.addEventListener("online", () => {
      offlineDismissed = false;
      updateOfflineBanner(true);
      if (typeof toast === "function") toast("Back online — cloud leaderboard & Team Rooms available.");
    });
    window.addEventListener("offline", () => {
      offlineDismissed = false;
      updateOfflineBanner(false);
    });
    updateOfflineBanner(navigator.onLine);

    const bind = (sel, fn) => {
      const el = $(sel);
      if (el) el.addEventListener("click", fn);
    };
    bind("#navInstallBtn", () => {
      if (typeof SFX !== "undefined" && SFX.click) SFX.click();
      triggerInstall();
    });
    bind("#setPwaBtn", () => {
      if (typeof SFX !== "undefined" && SFX.click) SFX.click();
      triggerInstall();
    });
    bind("#setPwaUpdateBtn", () => {
      if (swReg && swReg.waiting) {
        swReg.waiting.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      }
    });
    bind("#pwaOfflineCloseBtn", () => {
      offlineDismissed = true;
      updateOfflineBanner(navigator.onLine);
    });
    bind("#pwaIosCloseBtn", () => {
      const m = $("#pwaIosModal");
      if (m) m.classList.add("hidden");
    });
    bind("#pwaIosOkBtn", () => {
      const m = $("#pwaIosModal");
      if (m) m.classList.add("hidden");
    });
    const modal = $("#pwaIosModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    }
  }

  registerServiceWorker();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      wireEvents();
      updateInstallUI();
    });
  } else {
    wireEvents();
    updateInstallUI();
  }

  window.CosmoPWA = {
    install: triggerInstall,
    isStandalone: detectStandalone,
    isIOS: detectIOS,
    isInstallable: () => !!deferredPrompt,
    isUpdateReady: () => updateReady,
    refreshUI: updateInstallUI,
  };
})();
