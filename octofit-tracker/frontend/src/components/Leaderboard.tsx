import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard, parseItems, type ApiItem } from './CapabilityCard.js';

export default function Leaderboard() {
  const [items, setItems] = useState<ApiItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<unknown>('/api/leaderboard')
      .then((response) => {
        if (active) setItems(parseItems(response, 'leaderboard'));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Please try again.');
      });
    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Leaderboard" description="Compare team point totals." emptyMessage="No leaderboard scores yet." items={items} error={error} />;
}
