import { useEffect, useState } from "react";

const QUERY = "(max-width: 768px)";

function getMatches(query) {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

export function useIsMobileViewport(query = QUERY) {
  const [isMobile, setIsMobile] = useState(() => getMatches(query));

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return isMobile;
}

// Keep the lighter rendering profile on touch devices in landscape, too.
export function useMobilePerformance() {
  return useIsMobileViewport("(max-width: 768px), (pointer: coarse)");
}
