import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGuestUnderstandingDto {
  @ApiProperty({
    description: 'Target public domain name to analyze',
    example: 'stripe.com',
  })
  @IsNotEmpty({ message: 'Domain is required' })
  @IsString({ message: 'Domain must be a string' })
  @Matches(
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    { message: 'Domain must be a valid public domain format' },
  )
  domain!: string;
}

export class GuestUnderstandingResponseDto {
  @ApiProperty({
    description: 'Unique understanding job identifier',
    example: 'gst_job_1723456789_abc123',
  })
  jobId!: string;

  @ApiProperty({
    description: 'Guest session token identifier',
    example: 'ses_1723456789_xyz789',
  })
  sessionId!: string;

  @ApiProperty({
    description: 'Initial job queue status',
    example: 'QUEUED',
  })
  status!: string;
}

export class GuestJobStatusResponseDto {
  @ApiProperty({
    description: 'Unique understanding job identifier',
    example: 'gst_job_1723456789_abc123',
  })
  jobId!: string;

  @ApiProperty({
    description: 'Guest session token identifier',
    example: 'ses_1723456789_xyz789',
  })
  sessionId!: string;

  @ApiProperty({
    description: 'Current job status: QUEUED, RUNNING, COMPLETED, FAILED',
    example: 'RUNNING',
  })
  status!: string;

  @ApiProperty({
    description: 'Error message if job failed',
    example: null,
    nullable: true,
  })
  error?: string | null;
}

export class GuestUnderstandingResultDto {
  @ApiProperty({ description: 'Unique job ID' })
  jobId!: string;

  @ApiProperty({ description: 'Guest session ID' })
  sessionId!: string;

  @ApiProperty({ description: 'Target domain' })
  domain!: string;

  @ApiProperty({ description: 'Executive brief narrative and statistics' })
  brief!: {
    paragraphs: string[];
    stats: {
      techCount: number;
      observationCount: number;
      evidenceCount: number;
      timelineCount: number;
      criticalCount: number;
    };
  };

  @ApiProperty({ description: 'Discovered technologies' })
  technologies!: Array<{
    name: string;
    role: string;
    confidence: 'high' | 'medium' | 'low';
    category?: string;
    version?: string;
    evidenceCount?: number;
  }>;

  @ApiProperty({ description: 'Infrastructure findings and observations' })
  observations!: Array<{
    label: string;
    body: string;
    whyItMatters?: string;
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'informational';
    confidence?: 'high' | 'medium' | 'low';
    evidenceCount?: number;
    category?: string;
    firstObserved?: string;
  }>;

  @ApiProperty({ description: 'Infrastructure timeline entries' })
  timeline!: Array<{
    date: string;
    headline: string;
    narrative: string;
    observationBasis?: string;
    category?: string;
  }>;

  @ApiProperty({ description: 'Technical evidence payloads' })
  evidence!: Array<{
    id: string;
    category: string;
    title: string;
    summary: string;
    source?: string;
    collectedAt: string;
    payload: string;
    hash?: string;
    collector?: string;
    relatedTechnologies?: string[];
    relatedObservations?: string[];
  }>;
}

export * from './claim-guest-session.dto';
