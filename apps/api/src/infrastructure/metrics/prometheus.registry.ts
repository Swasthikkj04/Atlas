export interface LabelMap {
  [key: string]: string;
}

export class PrometheusRegistry {
  private readonly counters = new Map<
    string,
    { help: string; values: Map<string, number> }
  >();

  private readonly gauges = new Map<
    string,
    { help: string; values: Map<string, number> }
  >();

  private readonly histograms = new Map<
    string,
    {
      help: string;
      buckets: number[];
      values: Map<
        string,
        { count: number; sum: number; bucketCounts: Map<number, number> }
      >;
    }
  >();

  private serializeLabels(labels: LabelMap): string {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    const formatted = entries
      .map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`)
      .join(',');
    return `{${formatted}}`;
  }

  incCounter(
    name: string,
    help: string,
    labels: LabelMap = {},
    value = 1,
  ): void {
    if (!this.counters.has(name)) {
      this.counters.set(name, { help, values: new Map() });
    }
    const metric = this.counters.get(name);
    const labelKey = this.serializeLabels(labels);
    const current = metric.values.get(labelKey) || 0;
    metric.values.set(labelKey, current + value);
  }

  setGauge(
    name: string,
    help: string,
    labels: LabelMap = {},
    value: number,
  ): void {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, { help, values: new Map() });
    }
    const metric = this.gauges.get(name);
    const labelKey = this.serializeLabels(labels);
    metric.values.set(labelKey, value);
  }

  observeHistogram(
    name: string,
    help: string,
    labels: LabelMap = {},
    valSec: number,
    buckets: number[] = [
      0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
    ],
  ): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, { help, buckets, values: new Map() });
    }
    const metric = this.histograms.get(name);
    const labelKey = this.serializeLabels(labels);

    if (!metric.values.has(labelKey)) {
      metric.values.set(labelKey, {
        count: 0,
        sum: 0,
        bucketCounts: new Map(buckets.map((b) => [b, 0])),
      });
    }

    const data = metric.values.get(labelKey);
    data.count += 1;
    data.sum += valSec;

    for (const b of buckets) {
      if (valSec <= b) {
        data.bucketCounts.set(b, (data.bucketCounts.get(b) || 0) + 1);
      }
    }
  }

  toPrometheusFormat(): string {
    const lines: string[] = [];

    // 1. Counters
    for (const [name, metric] of this.counters.entries()) {
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} counter`);
      for (const [labelStr, val] of metric.values.entries()) {
        lines.push(`${name}${labelStr} ${val}`);
      }
      lines.push('');
    }

    // 2. Gauges
    for (const [name, metric] of this.gauges.entries()) {
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} gauge`);
      for (const [labelStr, val] of metric.values.entries()) {
        lines.push(`${name}${labelStr} ${val}`);
      }
      lines.push('');
    }

    // 3. Histograms
    for (const [name, metric] of this.histograms.entries()) {
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} histogram`);
      for (const [labelStr, data] of metric.values.entries()) {
        const baseLabels = labelStr ? labelStr.slice(1, -1) : '';
        let cumulative = 0;

        for (const bucket of metric.buckets) {
          cumulative += data.bucketCounts.get(bucket) || 0;
          const leLabel = baseLabels
            ? `{${baseLabels},le="${bucket}"}`
            : `{le="${bucket}"}`;
          lines.push(`${name}_bucket${leLabel} ${cumulative}`);
        }

        const infLabel = baseLabels
          ? `{${baseLabels},le="+Inf"}`
          : `{le="+Inf"}`;
        lines.push(`${name}_bucket${infLabel} ${data.count}`);
        lines.push(`${name}_sum${labelStr} ${data.sum.toFixed(6)}`);
        lines.push(`${name}_count${labelStr} ${data.count}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
