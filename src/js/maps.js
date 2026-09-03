// ==========================================================================
// Location + directions — browser Geolocation API and Google Maps
// Directions URLs. No API key required for this baseline experience;
// SITE_CONFIG.maps.apiKey is reserved for a future live-ETA upgrade.
// ==========================================================================

import { SITE_CONFIG } from "./config.js";

function buildDestinationParam() {
  const { latitude, longitude, address } = SITE_CONFIG.venue;
  if (latitude != null && longitude != null) {
    return `${latitude},${longitude}`;
  }
  return address;
}

function setStatus(statusEl, message, state) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.state = state;
}

export function initMaps(root) {
  if (!root) return;

  const locateBtn = root.querySelector("[data-action='locate']");
  const directionsBtn = root.querySelector("[data-action='directions']");
  const statusEl = root.querySelector("[data-maps-status]");

  let userCoords = null;

  locateBtn?.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      setStatus(statusEl, "Your browser doesn't support location services.", "error");
      return;
    }

    setStatus(statusEl, "Locating you…", "loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setStatus(
          statusEl,
          `You're ready to go — location found (±${Math.round(position.coords.accuracy)}m accuracy).`,
          "success"
        );
      },
      (error) => {
        userCoords = null;
        const denied = error.code === error.PERMISSION_DENIED;
        setStatus(
          statusEl,
          denied
            ? "We couldn't access your location. Please allow location access in your browser."
            : "We couldn't determine your location right now. You can still get directions below.",
          "error"
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });

  directionsBtn?.addEventListener("click", () => {
    const params = new URLSearchParams({
      api: "1",
      destination: buildDestinationParam()
    });

    if (userCoords) {
      params.set("origin", `${userCoords.lat},${userCoords.lng}`);
    }

    const url = `https://www.google.com/maps/dir/?${params.toString()}`;
    window.open(url, "_blank", "noopener");
  });
}
