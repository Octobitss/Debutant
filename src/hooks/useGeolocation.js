import { useCallback, useState } from "react";
import { SITE_CONFIG } from "../config/siteConfig";

const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function useGeolocation() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [coords, setCoords] = useState(null);

  const check = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setMessage("Your browser doesn't support location services.");
      return;
    }

    setStatus("loading");
    setMessage("Locating you…");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setCoords({ lat: userLat, lng: userLng });

        const { latitude: venueLat, longitude: venueLng } = SITE_CONFIG.venue;

        if (venueLat == null || venueLng == null) {
          setStatus("success");
          setMessage(
            "Location found — add the venue's coordinates in siteConfig.js to show an estimated distance."
          );
          return;
        }

        if (SITE_CONFIG.maps.apiKey) {
          try {
            const origin = `${userLat},${userLng}`;
            const destination = `${venueLat},${venueLng}`;
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origin}&destinations=${destination}&key=${SITE_CONFIG.maps.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            const element = data?.rows?.[0]?.elements?.[0];

            if (element?.status === "OK") {
              setStatus("success");
              setMessage(`Approximately ${element.distance.text} away — about ${element.duration.text} by car.`);
              return;
            }
          } catch (error) {
          }
        }

        const km = haversineKm(userLat, userLng, venueLat, venueLng);
        const distanceLabel = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
        setStatus("success");
        setMessage(`Roughly ${distanceLabel} away in a straight line (estimate only, not a driving distance).`);
      },
      (error) => {
        setStatus("error");
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "We couldn't access your location. Please allow location access in your browser."
            : "We couldn't determine your location right now."
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  return { status, message, coords, check };
}
