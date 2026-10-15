import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard, parseItems, type ApiItem } from './CapabilityCard.js';

export default function Teams() {
  const [items, setItems] = useState<ApiItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<unknown>('/api/teams')
      .then((response) => {
        if (active) setItems(parseItems(response, 'teams'));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Please try again.');
      });
    return () => {
      active = false;
    };
  }, []);

  return <CapabilityCard title="Teams" description="Manage teams and members." emptyMessage="No teams yet." items={items} error={error} />;
}
