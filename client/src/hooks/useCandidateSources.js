import { useEffect, useState } from 'react';
import { candidatesApi } from '../services/api';

/**
 * Loads the canonical candidate source list from the API (Candidate model enum).
 * Never hardcode board/source names for filters — use this hook.
 */
export function useCandidateSources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    candidatesApi
      .sources()
      .then(({ data }) => {
        if (!cancelled) setSources(data.data.sources || []);
      })
      .catch(() => {
        if (!cancelled) setSources([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { sources, loading };
}
