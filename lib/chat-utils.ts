import { getStadiumZoneById, STADIUM_GRAPH, StadiumGraph } from './data/stadium-graph';


/**
 * Serialises the stadium graph into a compact plain-text block for use in
 * the Gemini system instruction. Includes nodes (with category, accessibility,
 * prices/details) and directed path edges with distances.
 *
 * @param stadiumGraph - The full stadium zone and edge graph.
 * @returns Multi-line string with NODES and PATHS sections.
 */
function formatStadiumGraph(stadiumGraph: StadiumGraph): string {
  const nodes = stadiumGraph.nodes
    .map((node) => {
      const category = node.category ? `, category: ${node.category}` : '';
      const details = node.details ? `, details: ${node.details}` : '';

      return `- ${node.name} (${node.id}): type: ${node.type}${category}, accessible: ${node.accessible}, location/notes: ${node.description}${details}`;
    })
    .join('\n');

  const edges = stadiumGraph.edges
    .map(
      (edge) =>
        `- ${edge.from} -> ${edge.to}: ${edge.description}, ~${edge.distanceMeters}m`
    )
    .join('\n');

  return `NODES:\n${nodes}\n\nPATHS:\n${edges}`;
}

export interface BuildChatPromptOptions {
  message: string;
  accessibilityMode: boolean;
  currentZoneId?: string;
  stadiumGraph?: StadiumGraph;
}

export interface ChatPrompt {
  systemInstruction: string;
  prompt: string;
}

/**
 * Builds the Gemini chat prompt and system instruction for a fan message.
 *
 * @param options - Fan message, accessibility flag, optional current zone, and graph override.
 * @returns A user prompt plus system instruction containing graph and behavior context.
 */
export function buildChatPrompt({
  message,
  accessibilityMode,
  currentZoneId,
  stadiumGraph = STADIUM_GRAPH,
}: BuildChatPromptOptions): ChatPrompt {
  const currentZone = currentZoneId ? getStadiumZoneById(currentZoneId) : undefined;
  const currentZoneContext = currentZone
    ? `\nCurrent fan self-reported zone: ${currentZone.name} (${currentZone.id}). If helpful, naturally reference this location, for example "since you're near ${currentZone.name}..." Do not imply GPS or live tracking.`
    : '';

  const systemInstruction = `You are ArenaOne, the official stadium assistant for FIFA World Cup 2026 fans.

Use this stadium graph as the only source of truth:
${formatStadiumGraph(stadiumGraph)}
${currentZoneContext}

Rules:
- Detect the user's language and respond in the same language.
- Use only gates, sections, paths, facilities, menu items, prices, transport exits, parking mappings, and accessibility data from the graph.
- Do not fabricate non-existent gates, stalls, sections, shortcuts, foods, prices, transport routes, parking exits, or facilities.
- Treat any current zone as a fan self-reported check-in, not GPS or live tracking.
- When giving directions, format paths like: Gate 4 -> Concourse C-D -> Section C -> Accessible Washroom B, ~170m.
- Include total estimated distance when a route is requested.
- For accessibility requests, recommend only facilities marked accessible: true.
${accessibilityMode
    ? '- Accessibility Mode is ON. Use simple words, short sentences, high clarity, and step-by-step layout.'
    : '- Accessibility Mode is OFF. Be concise, friendly, and practical.'}`;

  const prompt = `Fan message:\n${message}`;

  return { systemInstruction, prompt };
}
