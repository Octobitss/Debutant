import { initEntrance } from "./entrance.js";
import { initThreeScene } from "./three-scene.js";
import { initCountdown } from "./countdown.js";
import { initScrollAnimations } from "./scroll.js";
import { initMaps } from "./maps.js";
import { initInteractions } from "./interactions.js";
import { initAudio } from "./audio.js";
import { SITE_CONFIG } from "./config.js";
import { getByPath } from "./utils.js";

const COVER_IMAGE_URL = "/assets/images/invitation-cover.webp";
const MIN_LOADING_MS = 900;

function applyContentBindings() {
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const value = getByPath(SITE_CONFIG, el.dataset.bind);
    if (value != null) el.textContent = value;
  });

  document.querySelectorAll("[data-bind-href]").forEach((el) => {
    const value = getByPath(SITE_CONFIG, el.dataset.bindHref);
    if (value != null) {
      el.href = value;
      el.target = "_blank";
      el.rel = "noopener";
    }
  });
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
  });
}

function bootSite() {
  const canvas = document.getElementById("atmosphere-canvas");
  const threeScene = canvas ? initThreeScene(canvas) : null;

  initScrollAnimations({ threeScene });
  initCountdown(document.querySelector("[data-countdown-root]"));
  initMaps(document.querySelector("[data-maps-root]"));
  initInteractions();
  initAudio();

  document.dispatchEvent(new CustomEvent("entrance:complete"));
}

async function boot() {
  applyContentBindings();

  const loadingScreen = document.querySelector("[data-loading-screen]");
  const entranceRoot = document.querySelector("[data-entrance]");
  const entranceCanvas = document.querySelector("[data-entrance-canvas]");
  const entranceHint = document.querySelector("[data-entrance-hint]");
  const entranceFallback = document.querySelector("[data-entrance-fallback]");

  const minDelay = new Promise((resolve) => window.setTimeout(resolve, MIN_LOADING_MS));
  await Promise.all([preloadImage(COVER_IMAGE_URL), minDelay]);

  if (loadingScreen) {
    loadingScreen.hidden = true;
  }

  if (entranceRoot) {
    entranceRoot.hidden = false;
    initEntrance({
      root: entranceRoot,
      canvas: entranceCanvas,
      hint: entranceHint,
      fallbackButton: entranceFallback,
      coverImageUrl: COVER_IMAGE_URL,
      onComplete: () => {
        document.body.classList.remove("is-locked");
        bootSite();
      }
    });
  } else {
    document.body.classList.remove("is-locked");
    bootSite();
  }
}

boot();
