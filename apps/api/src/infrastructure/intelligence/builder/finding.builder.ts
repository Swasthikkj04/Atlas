import * as crypto from 'node:crypto';
import { FindingCategory, FindingModule, Severity } from '@prisma/client';

import { CanonicalObservation } from '../../normalization/contracts/canonical-observation.interface';
import { IntelligenceFinding } from '../contracts/intelligence-finding.interface';

export class FindingBuilder {
  private ruleId!: string;
  private ruleVersion!: string;
  private module: FindingModule = FindingModule.HTTP;
  private category: FindingCategory = FindingCategory.SECURITY_HEADER;
  private severity: Severity = Severity.MEDIUM;
  private title!: string;
  private description!: string;
  private matchedObservations: string[] = [];
  private evidenceIds: string[] = [];
  private confidence = 1.0;
  private state: 'MATCHED' | 'UNKNOWN' = 'MATCHED';

  setRule(id: string, version: string): this {
    this.ruleId = id;
    this.ruleVersion = version;
    return this;
  }

  setModule(module: FindingModule): this {
    this.module = module;
    return this;
  }

  setCategory(category: FindingCategory): this {
    this.category = category;
    return this;
  }

  setSeverity(severity: Severity): this {
    this.severity = severity;
    return this;
  }

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  setState(state: 'MATCHED' | 'UNKNOWN'): this {
    this.state = state;
    return this;
  }

  addObservation(key: string, observation: CanonicalObservation<any>): this {
    this.matchedObservations.push(key);
    if (observation.lineage?.evidenceId) {
      if (!this.evidenceIds.includes(observation.lineage.evidenceId)) {
        this.evidenceIds.push(observation.lineage.evidenceId);
      }
    }
    return this;
  }

  setConfidence(confidence: number): this {
    this.confidence = confidence;
    return this;
  }

  build(): IntelligenceFinding {
    if (!this.ruleId || !this.title) {
      throw new Error('Rule ID and Title are required to build an IntelligenceFinding');
    }

    const generatedAt = new Date();
    const hash = crypto
      .createHash('sha256')
      .update(`${this.ruleId}:${this.evidenceIds.join(',')}:${this.title}`)
      .digest('hex')
      .slice(0, 16);

    const findingId = `find-${this.ruleId}-${hash}`;

    return {
      findingId,
      ruleId: this.ruleId,
      ruleVersion: this.ruleVersion,
      module: this.module,
      category: this.category,
      severity: this.severity,
      title: this.title,
      description: this.description,
      lineage: {
        matchedObservations: this.matchedObservations,
        evidenceIds: this.evidenceIds,
        confidence: this.confidence,
      },
      generatedAt,
      state: this.state,
    };
  }
}
