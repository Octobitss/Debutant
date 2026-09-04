export const SITE_CONFIG = {
  debutantName: "Trina",
  title: "Trina @ XVIII",
  tagline: "Where Eighteen Blooms",

  event: {
    date: "2026-10-17T18:00:00+08:00",
    displayDate: "October 17, 2026",
    displayTime: "6:00 in the evening"
  },

  venue: {
    name: "Villa Annabelle Resort & Events Place",
    address: "Villa Annabelle Resort & Events Place, Philippines",
    latitude: 14.828751985685066,
    longitude: 121.03944037511054,
    mapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4986.899968477452!2d121.03944037511054!3d14.828751985685066!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397af18888234ef%3A0xcfd15777a5cd74af!2sVilla%20Annabelle%20Resort!5e1!3m2!1sen!2sph!4v1788508639490!5m2!1sen!2sph"
  },

  rsvp: {
    url: "https://forms.gle/jcm1jQLy4WrLwLaUA"
  },

  maps: {
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
