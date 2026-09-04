import { SITE_CONFIG } from "../../config/siteConfig";
import { useGeolocation } from "../../hooks/useGeolocation";
import Button from "./Button.jsx";
import "./MapEmbed.scss";

function buildDirectionsUrl(userCoords) {
  const { latitude, longitude, address } = SITE_CONFIG.venue;
  const destination = latitude != null && longitude != null ? `${latitude},${longitude}` : address;
  const params = new URLSearchParams({ api: "1", destination });
  if (userCoords) {
    params.set("origin", `${userCoords.lat},${userCoords.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function MapEmbed() {
  const { status, message, coords, check } = useGeolocation();

  return (
    <div className="map-embed">
      <div className="map-embed__frame">
        <div id="google-map">
          <iframe
            src={SITE_CONFIG.venue.mapsEmbedUrl}
            title={SITE_CONFIG.venue.name}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>

      <div className="map-embed__side">
        <p>
          Use <strong>Check My Location</strong> to see roughly how far you are, then{" "}
          <strong>Open in Google Maps</strong> for turn-by-turn navigation on the night.
        </p>
        <div className="map-embed__actions">
          <Button variant="outline" type="button" onClick={check}>
            Check My Location
          </Button>
          <Button
            variant="primary"
            as="a"
            href={buildDirectionsUrl(coords)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Google Maps
          </Button>
        </div>
        <p className="map-embed__status" data-state={status} role="status" aria-live="polite">
          {message}
        </p>
      </div>
    </div>
  );
}
