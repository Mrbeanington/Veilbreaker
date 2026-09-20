// The web app manifest as data, so a test can check it without a build (the generated file is not committed).
export function buildManifest(title: string) {
  return {
    name: title,
    short_name: title,
    description: `${title} — a client-only 3v3 turn-based arena.`,
    id: "./",
    lang: "en",
    categories: ["games"],
    orientation: "any",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#100d18",
    theme_color: "#100d18",
    icons: [
      { src: "./icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "./icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
