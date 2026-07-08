import { FieldValue } from 'firebase-admin/firestore';
import { generateContent } from './gemini';
import { addFirestoreDocument } from './firestore-data';

export const INCIDENTS_COLLECTION = 'incidents';

export type IncidentCategory = 'lost_person' | 'medical' | 'security' | 'accessibility' | 'general';
export type IncidentPriority = 'low' | 'medium' | 'high';

export interface IncidentDraft {
  incidentId: string;
  location: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  suggestedAction: string;
  summary: string;
}

export interface IncidentSubmission {
  description: string;
  reporterRole?: string;
}

export interface IncidentGenerationResult {
  incident: IncidentDraft;
  fallback: boolean;
  model: string;
}

const INCIDENT_SYSTEM_INSTRUCTION = `You structure stadium incident reports for ArenaOne staff.
Return only compact JSON with these keys:
incidentId, location, category, priority, suggestedAction, summary.
Categories: lost_person, medical, security, accessibility, general.
Priorities: low, medium, high.`;

/**
 * Builds a deterministic incident id for submitted staff reports.
 *
 * @param timestamp - Timestamp used to make the id traceable in logs.
 * @returns Incident id safe for display and storage.
 */
export function createIncidentId(timestamp: Date = new Date()): string {
  return `INC-${timestamp.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
}

/**
 * Parses Gemini JSON for an incident, falling back to deterministic defaults.
 *
 * @param text - Gemini response text expected to contain JSON.
 * @param description - Original staff report text used as fallback summary.
 * @returns Structured incident draft.
 */
export function parseIncidentDraft(text: string, description: string): IncidentDraft {
  try {
    const parsed = JSON.parse(text) as Partial<IncidentDraft>;

    return {
      incidentId: parsed.incidentId || createIncidentId(),
      location: parsed.location || 'Unknown stadium zone',
      category: parsed.category || 'general',
      priority: parsed.priority || 'medium',
      suggestedAction: parsed.suggestedAction || 'Notify the nearest supervisor and monitor.',
      summary: parsed.summary || description,
    };
  } catch {
    return {
      incidentId: createIncidentId(),
      location: 'Unknown stadium zone',
      category: 'general',
      priority: 'medium',
      suggestedAction: 'Notify the nearest supervisor and monitor.',
      summary: description,
    };
  }
}

/**
 * Generates a structured incident using Gemini with a static fallback.
 *
 * @param submission - Staff-submitted incident description and optional reporter role.
 * @returns Structured incident data with model/fallback metadata.
 */
export async function generateIncidentDraft(
  submission: IncidentSubmission
): Promise<IncidentGenerationResult> {
  const result = await generateContent(
    `Reporter role: ${submission.reporterRole ?? 'staff'}\nIncident: ${submission.description}`,
    INCIDENT_SYSTEM_INSTRUCTION
  );

  return {
    incident: parseIncidentDraft(result.text, submission.description),
    fallback: result.fallback,
    model: result.model,
  };
}

/**
 * Stores a structured incident in the shared Firestore data layer.
 *
 * @param incident - Structured incident draft to persist.
 * @returns The created Firestore document id.
 */
export async function saveIncident(incident: IncidentDraft) {
  return addFirestoreDocument(INCIDENTS_COLLECTION, {
    ...incident,
    createdAt: FieldValue.serverTimestamp(),
  });
}
