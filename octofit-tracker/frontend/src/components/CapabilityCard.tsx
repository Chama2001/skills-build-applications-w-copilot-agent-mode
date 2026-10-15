export type CapabilityTitle = 'Activities' | 'Teams' | 'Leaderboard' | 'Workout suggestions';
export type ApiItem = Record<string, unknown>;
type Props = {
  title: CapabilityTitle;
  description: string;
  emptyMessage: string;
  items: ApiItem[] | null;
  error: string | null;
};

function isRecord(value: unknown): value is ApiItem {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseItems(response: unknown, collection: string): ApiItem[] {
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

export function CapabilityCard({ title, description, emptyMessage, items, error }: Props) {
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
          <p>{emptyMessage}</p>
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
