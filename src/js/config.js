// ==========================================================================
// Central configuration — edit event details here only.
// ==========================================================================

export const SITE_CONFIG = {
  debutantName: "Trina",
  title: "Trina's XVIII",
  subtitle: "Wildest Dreams",
  tagline: "A Night of Fairy Tales and Endless Memories",

  event: {
    // ISO 8601 with offset — update this single value to move the whole site.
    date: "2026-12-12T18:00:00+08:00",
    displayDate: "December 12, 2026",
    displayTime: "6:00 in the evening"
  },

  venue: {
    name: "The Grand Pavilion",
    address: "123 Celebration Avenue, Alabang, Muntinlupa City, Metro Manila, Philippines",
    latitude: null,
    longitude: null
  },

  rsvp: {
    url: "https://forms.gle/jcm1jQLy4WrLwLaUA"
  },

  maps: {
    // Optional: set for a future Distance Matrix / live-ETA upgrade.
    // Not required for the geolocation + directions-link experience below.
    apiKey: null
  }
};

// Literal alias kept for the countdown module, single source of truth above.
export const EVENT_CONFIG = {
  date: SITE_CONFIG.event.date,
  title: SITE_CONFIG.title
};

export const AUDIO_CONFIG = {
  enabled: false,
  source: "/assets/audio/background.mp3",
  volume: 0.35
};
