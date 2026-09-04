// ==========================================================================
// Central configuration — edit event details here only.
// ==========================================================================

export const SITE_CONFIG = {
  debutantName: "Trina",
  title: "Trina @ XVIII",
  tagline: "Where Eighteen Blooms",

  event: {
    // ISO 8601 with offset — update this single value to move the whole site.
    date: "2026-10-17T18:00:00+08:00",
    displayDate: "October 17, 2026",
    displayTime: "6:00 in the evening"
  },

  venue: {
    name: "Villa Annabelle Resort & Events Place",
    address: "Villa Annabelle Resort & Events Place, Philippines",
    latitude: null,
    longitude: null
  },

  rsvp: {
    url: "https://forms.gle/jcm1jQLy4WrLwLaUA"
  },

  maps: {
    // Optional: set VITE_GOOGLE_MAPS_API_KEY to enable a real driving-time
    // estimate via Distance Matrix. Without it, distance is a clearly
    // labeled straight-line estimate.
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || null
  },

  dressCode: {
    women: "Long or midi gowns in blush, mauve or plum tones",
    men: "Formal suit or barong in charcoal, plum or muted rose"
  },

  letter: [
    "Step into my whimsical garden, a little world filled with blooming flowers, cherished memories, and eighteen beautiful chapters that have shaped who I am today.",
    "As I step into this new chapter of my life, I invite you to wander through this garden with me — a celebration of the people, moments, and experiences that made my journey so special.",
    "Tonight, we celebrate not just eighteen years, but every little moment that brought me here.",
    "Here's to new beginnings, beautiful dreams, and a garden filled with memories yet to bloom."
  ]
};

export const AUDIO_CONFIG = {
  enabled: false,
  source: "/assets/audio/background.mp3",
  volume: 0.35
};
