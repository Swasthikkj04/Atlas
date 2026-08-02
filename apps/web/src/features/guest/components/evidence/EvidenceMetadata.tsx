function collectedLabel(dateStr: string): string {
  const date     = new Date(dateStr);
  const today    = new Date();
  const todayMid = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const entryMid = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const diff     = Math.round((todayMid - entryMid) / 86_400_000);

  if (diff === 0) return "Collected today";
  if (diff === 1) return "Collected yesterday";
  if (diff <= 6)  return `Collected ${diff} days ago`;
  if (diff <= 13) return "Collected last week";
  return `Collected ${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
}

interface EvidenceMetadataProps {
  collectedAt: string;
  source?:      string;
  collector?:   string;
  hash?:        string;
}

export function EvidenceMetadata({
  collectedAt,
  source,
  collector,
  hash,
}: EvidenceMetadataProps) {
  const metaParts: string[] = [collectedLabel(collectedAt)];
  if (source)    metaParts.push(source);
  if (collector) metaParts.push(collector);
  if (hash)      metaParts.push("SHA-256 available");

  return (
    <p className="text-[11px] text-muted-foreground/28 leading-none mb-4">
      {metaParts.map((part, i) => (
        <span key={part}>
          {i > 0 && <span className="mx-1.5 opacity-50" aria-hidden="true">·</span>}
          {part}
        </span>
      ))}
    </p>
  );
}
