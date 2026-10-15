import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type CapabilityTitle = 'Activities' | 'Teams' | 'Leaderboard' | 'Workout suggestions';
type ApiItem = Record<string, unknown>;
type Props = { title: CapabilityTitle; description: string };

const capabilities: Record<CapabilityTitle, { path: string; collection: string; emptyMessage: string }> = {
  Activities: {
    path: '/api/activities',
    collection: 'activities',
    emptyMessage: 'No activities yet.',
  },
  Teams: {
    path: '/api/teams',
    collection: 'teams',
    emptyMessage: 'No teams yet.',
  },
  Leaderboard: {
    path: '/api/leaderboard',
    collection: 'leaderboard',
    emptyMessage: 'No leaderboard scores yet.',
  },
  'Workout suggestions': {
    path: `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
    collection: 'suggestions',
    emptyMessage: 'No workout suggestions yet.',
  },
};

function isRecord(value: unknown): value is ApiItem {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseItems(response: unknown, collection: string): ApiItem[] {
  if (!isRecord(response) || !Array.isArray(response[collection]) || !response[collection].every(isRecord)) {
    throw new Error('The server returned an invalid response.');
  }
  return response[collection];
}

function text(item: ApiItem, field: string): string | undefined {
  const value = item[field];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

function describeItem(title: CapabilityTitle, item: ApiItem): string {
  if (title === 'Activities') {
    return [text(item, 'type'), text(item, 'minutes') && `${text(item, 'minutes')} min`, text(item, 'points') && `${text(item, 'points')} points`]
      .filter(Boolean)
      .join(' · ');
  }
  if (title === 'Teams') {
    const members = Array.isArray(item.members)
      ? item.members.map((member) => typeof member === 'string' ? member : isRecord(member) ? text(member, 'name') : undefined).filter(Boolean).join(', ')
      : '';
    return [text(item, 'name'), members && `Members: ${members}`].filter(Boolean).join(' · ');
  }
  if (title === 'Leaderboard') {
    return [text(item, 'rank') && `${text(item, 'rank')}.`, text(item, 'teamName'), text(item, 'totalPoints') && `${text(item, 'totalPoints')} points`]
      .filter(Boolean)
      .join(' · ');
  }
  return [
    text(item, 'title'),
    text(item, 'focus'),
    text(item, 'minutes') && `${text(item, 'minutes')} min`,
    text(item, 'reason'),
  ].filter(Boolean).join(' · ');
}

export function CapabilityCard({ title, description }: Props) {
  const [items, setItems] = useState<ApiItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const capability = capabilities[title];

  useEffect(() => {
    let active = true;
    setItems(null);
    setError(null);
    getJson<unknown>(capability.path)
      .then((response) => {
        if (active) setItems(parseItems(response, capability.collection));
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Unable to load data. Please try again.');
      });
    return () => {
      active = false;
    };
  }, [capability]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error ? (
          <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
        ) : items === null ? (
          <p role="status">Loading {title.toLowerCase()}…</p>
        ) : items.length === 0 ? (
          <p>{capability.emptyMessage}</p>
        ) : (
          <ul>
            {items.map((item, index) => (
              <li key={text(item, '_id') ?? `${title}-${index}`}>{describeItem(title, item)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
