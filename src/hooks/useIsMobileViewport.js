import { useEffect, useState } from "react";

const QUERY = "(max-width: 768px)";

function getMatches() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}

export function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(getMatches);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
