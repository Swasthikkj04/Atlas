export interface InfrastructureBriefHighlight {
  id?: string;
  severity: string;
  title: string;
  description: string;
}

export interface InfrastructureBriefRecommendation {
  title: string;
  description: string;
}

export interface InfrastructureBriefResult {
  overallHealth: string;
  summary: string;
  highlights: InfrastructureBriefHighlight[];
  recommendations: InfrastructureBriefRecommendation[];
}
