interface EvidenceRelationshipsProps {
  relatedTechnologies?: string[];
  relatedObservations?: string[];
}

export function EvidenceRelationships({
  relatedTechnologies,
  relatedObservations,
}: EvidenceRelationshipsProps) {
  const hasTechs = relatedTechnologies && relatedTechnologies.length > 0;
  const hasObs   = relatedObservations  && relatedObservations.length > 0;

  if (!hasTechs && !hasObs) return null;

  return (
    <div className="mb-4 space-y-1.5">
      {hasTechs && (
        <p className="text-[11px] text-muted-foreground/38 leading-none">
          <span className="font-medium">Supports</span>
          {" · "}
          {relatedTechnologies!.join(" · ")}
        </p>
      )}
      {hasObs && (
        <p className="text-[11px] text-muted-foreground/38 leading-none">
          <span className="font-medium">Observation</span>
          {" · "}
          {relatedObservations!.join(" · ")}
        </p>
      )}
    </div>
  );
}
