import { z } from 'zod';

/**
 * Zod schemas for API route input validation.
 * Centralized here so schemas can be reused across routes and tests.
 */

/**
 * Schema for the /api/health endpoint.
 * Accepts a prompt string for testing the Gemini connection.
 */
export const healthCheckSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt cannot be empty')
    .max(500, 'Prompt must be 500 characters or fewer'),
});

export type HealthCheckInput = z.infer<typeof healthCheckSchema>;

/**
 * Generic error response schema (for documentation/testing).
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Schema for the /api/chat endpoint.
 * Accepts the user message and the accessibility toggle status.
 */
export const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be 1000 characters or fewer'),
  accessibilityMode: z.boolean(),
  currentZoneId: z.string().min(1).max(50).optional(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

export const zoneCheckInSchema = z.object({
  zoneId: z.string().min(1, 'Zone is required').max(50),
  anonymousSessionId: z
    .string()
    .min(8, 'Anonymous session id is required')
    .max(80, 'Anonymous session id is too long'),
});

export type ZoneCheckInInput = z.infer<typeof zoneCheckInSchema>;

export const incidentSubmissionSchema = z.object({
  description: z
    .string()
    .min(5, 'Incident description must be at least 5 characters')
    .max(1000, 'Incident description must be 1000 characters or fewer'),
  reporterRole: z.string().min(2).max(80).optional(),
});

export type IncidentSubmissionInput = z.infer<typeof incidentSubmissionSchema>;

export const crowdDensityReportSchema = z.object({
  zoneId: z.string().min(1, 'Zone is required').max(50),
  category: z.enum(['crowd', 'sustainability', 'transport']).default('crowd'),
  note: z
    .string()
    .min(3, 'Report note must be at least 3 characters')
    .max(500, 'Report note must be 500 characters or fewer'),
});

export type CrowdDensityReportInput = z.infer<typeof crowdDensityReportSchema>;
