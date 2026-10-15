import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard, parseItems, type ApiItem } from './CapabilityCard.js';

export default function Activities() {
  const [items, setItems] = useState<ApiItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<unknown>('/api/activities')
      .then((response) => {
        if (active) setItems(parseItems(response, 'activities'));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Please try again.');
      });
    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Activities" description="Track student activity minutes and points." emptyMessage="No activities yet." items={items} error={error} />;
}
