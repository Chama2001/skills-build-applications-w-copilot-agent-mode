import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard, parseItems, type ApiItem } from './CapabilityCard.js';

export default function Workouts() {
  const [items, setItems] = useState<ApiItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<unknown>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then((response) => {
        if (active) setItems(parseItems(response, 'suggestions'));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Please try again.');
      });
    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." emptyMessage="No workout suggestions yet." items={items} error={error} />;
}
