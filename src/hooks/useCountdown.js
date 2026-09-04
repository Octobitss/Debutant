import { useEffect, useState } from "react";

function diffToUnits(target) {
  const diff = Math.max(target - Date.now(), 0);
  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isComplete: diff <= 0
  };
}

export function useCountdown(isoDate) {
  const target = new Date(isoDate).getTime();
  const [units, setUnits] = useState(() => diffToUnits(target));

  useEffect(() => {
    if (units.isComplete) return undefined;

    const id = window.setInterval(() => {
      setUnits(diffToUnits(target));
    }, 1000);

    return () => window.clearInterval(id);
  }, [target, units.isComplete]);

  return units;
}
