export function resolveTerrainMode(): string | null {
  const requested = new URLSearchParams(window.location.search).get("terrain")
  const localPreview = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"

  // The licensed reference imagery is only used for local visual inspection.
  if (requested === "registration") return localPreview ? requested : null
  if (requested) return requested
  return localPreview ? "registration" : null
}
