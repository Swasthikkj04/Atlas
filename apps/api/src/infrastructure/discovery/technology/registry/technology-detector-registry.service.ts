import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import {
  TechnologyDetector,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
} from '../contracts';
import * as AllDetectors from '../detectors';

@Injectable()
export class TechnologyDetectorRegistryService implements OnModuleInit {
  private readonly logger = new Logger(TechnologyDetectorRegistryService.name);
  private readonly detectors = new Map<string, TechnologyDetector>();

  constructor(@Optional() defaultDetectors?: TechnologyDetector[]) {
    if (Array.isArray(defaultDetectors)) {
      for (const detector of defaultDetectors) {
        this.register(detector);
      }
    }
  }

  onModuleInit(): void {
    if (this.detectors.size === 0) {
      this.registerDefaults();
    }
  }

  registerDefaults(): void {
    for (const DetectorClass of Object.values(AllDetectors)) {
      if (typeof DetectorClass === 'function') {
        try {
          const instance = new (DetectorClass as any)();
          if (
            instance &&
            instance.id &&
            instance.name &&
            typeof instance.detect === 'function' &&
            !this.detectors.has(instance.id)
          ) {
            this.register(instance);
          }
        } catch {
          // ignore non-constructable exports
        }
      }
    }
  }

  register(detector: TechnologyDetector): void {
    if (!detector || typeof detector !== 'object') {
      throw new Error('Technology detector must be a valid object');
    }

    if (
      !detector.id ||
      typeof detector.id !== 'string' ||
      detector.id.trim() === ''
    ) {
      throw new Error('Technology detector must have a valid non-empty id');
    }

    if (
      !detector.name ||
      typeof detector.name !== 'string' ||
      detector.name.trim() === ''
    ) {
      throw new Error(`Technology detector '${detector.id}' missing name`);
    }

    if (!detector.category) {
      throw new Error(`Technology detector '${detector.id}' missing category`);
    }

    if (typeof detector.detect !== 'function') {
      throw new Error(
        `Technology detector '${detector.id}' missing detect method`,
      );
    }

    if (this.detectors.has(detector.id)) {
      throw new Error(
        `Technology detector with ID '${detector.id}' is already registered`,
      );
    }

    this.detectors.set(detector.id, detector);
    this.logger.debug(
      `Registered technology detector: ${detector.name} [${detector.id}] (${detector.category})`,
    );
  }

  unregister(detectorId: string): boolean {
    const exists = this.detectors.has(detectorId);
    if (exists) {
      this.detectors.delete(detectorId);
      this.logger.debug(`Unregistered technology detector: ${detectorId}`);
      return true;
    }
    return false;
  }

  get(detectorId: string): TechnologyDetector | undefined {
    return this.detectors.get(detectorId);
  }

  has(detectorId: string): boolean {
    return this.detectors.has(detectorId);
  }

  list(): TechnologyDetector[] {
    return Array.from(this.detectors.values());
  }

  getDetectors(): TechnologyDetector[] {
    return this.list();
  }

  clear(): void {
    this.detectors.clear();
  }

  async execute(
    context: TechnologyDetectionContext,
  ): Promise<TechnologyDetectionResult[]> {
    const results: TechnologyDetectionResult[] = [];
    const allDetectors = this.list();

    for (const detector of allDetectors) {
      try {
        const res = await detector.detect(context);
        if (res && res.status === 'DETECTED') {
          results.push(res);
        }
      } catch (error) {
        this.logger.error(
          `Technology detector '${detector.id}' failed during evaluation:`,
          error instanceof Error ? error.stack : String(error),
        );
        continue;
      }
    }

    return results;
  }
}
