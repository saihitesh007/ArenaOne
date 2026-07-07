import { STADIUM_GRAPH, StadiumGraph } from './data/stadium-graph';

/**
 * Pure logic function that formats the stadium zone graph and builds the complete system instruction
 * to send to the Gemini model.
 *
 * Implements Feature 1 (Fan AI Assistant), Feature 2 (Multilingual auto-detection),
 * and Feature 3 (Accessibility Simple Mode prompt adjustment).
 *
 * @param stadiumGraph - The static stadium layout graph
 * @param accessibilityMode - If true, requests simplified, short sentences
 * @returns System instruction string for Gemini
 */
export function buildSystemInstruction(
  stadiumGraph: StadiumGraph,
  accessibilityMode: boolean
): string {
  // Serialize nodes and edges into a concise, structured textual format for the LLM context
  const nodesSerialized = stadiumGraph.nodes
    .map((node) => {
      const typeStr = node.category ? `${node.type} (${node.category})` : node.type;
      const accStr = node.accessible ? 'Accessible' : 'NOT Accessible';
      const detailsStr = node.details ? ` Details: ${node.details}` : '';
      return `- ID: "${node.id}", Name: "${node.name}", Type: ${typeStr}, Status: ${accStr}, Description: ${node.description}${detailsStr}`;
    })
    .join('\n');

  const edgesSerialized = stadiumGraph.edges
    .map(
      (edge) =>
        `- Link: "${edge.from}" to "${edge.to}", Distance: ${edge.distanceMeters}m, Via: "${edge.description}"`
    )
    .join('\n');

  // Base behavior context guidelines
  let instruction = `You are ArenaOne, the official AI assistant for the FIFA World Cup 2026 stadium operations.
You help fans find facilities, gates, seating sections, medical points, and food stalls.

STADIUM ZONE GRAPH DATA:
---
NODES (FACILITIES AND SECTIONS):
${nodesSerialized}

EDGES (CONNECTIONS AND PATHS):
${edgesSerialized}
---

CRITICAL GUIDELINES:
1. MULTILINGUAL AUTO-DETECTION: Detect the language of the user's message automatically (e.g. Spanish, German, French, Portuguese, Arabic). Respond in that EXACT same language. Do not explain that you are translating.
2. SOURCE TRUTHFULNESS: Only use the STADIUM ZONE GRAPH DATA provided above. If the user asks for a facility, section, gate, or food item not described in the graph, state politely in their language that it is not available or you don't have information on it. DO NOT hallucinate or make up gates or amenities.
3. ROUTING & DIRECTIONS: When asked for directions, always build a clear text-based route using the connections provided (e.g. "Gate 4 -> Concourse South -> Section D -> Accessible Washroom B, ~75m"). Show the total estimated distance.
4. FOOD CHECKS: If asked about vegetarian food or price-specific requests, match details on food nodes (like "Green Bite" or "Arena Eats"). Note item prices.
5. ACCESSIBILITY AWARENESS: If a user asks for accessible facilities (washrooms, ramps, paths), ensure you direct them ONLY to nodes marked "Accessible". Check their entire path and prioritize safety.
`;

  // Apply Accessibility Mode prompt instruction adjustments
  if (accessibilityMode) {
    instruction += `
6. ACCESSIBILITY SIMPLE MODE ACTIVE:
   - You MUST respond in very short, simple, easy-to-understand sentences.
   - Use clear, plain language. Avoid jargon or long paragraphs.
   - Present routes or step-by-step directions as a clear bulleted list, with one step per line.
   - Keep the tone highly encouraging and clear.
`;
  } else {
    instruction += `
6. DEFAULT MODE ACTIVE:
   - Provide friendly, concise, natural responses.
   - Keep answers under 4-5 sentences unless detail is explicitly requested.
`;
  }

  return instruction;
}

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
  stadiumGraph?: StadiumGraph;
}

export interface ChatPrompt {
  systemInstruction: string;
  prompt: string;
}

export function buildChatPrompt({
  message,
  accessibilityMode,
  stadiumGraph = STADIUM_GRAPH,
}: BuildChatPromptOptions): ChatPrompt {
  const systemInstruction = `You are ArenaOne, the official stadium assistant for FIFA World Cup 2026 fans.

Use this stadium graph as the only source of truth:
${formatStadiumGraph(stadiumGraph)}

Rules:
- Detect the user's language and respond in the same language.
- Use only gates, sections, paths, facilities, menu items, prices, and accessibility data from the graph.
- Do not fabricate non-existent gates, stalls, sections, shortcuts, foods, prices, or facilities.
- When giving directions, format paths like: Gate 4 -> Concourse C-D -> Section C -> Accessible Washroom B, ~170m.
- Include total estimated distance when a route is requested.
- For accessibility requests, recommend only facilities marked accessible: true.
${accessibilityMode
    ? '- Accessibility Mode is ON. Use simple words, short sentences, high clarity, and step-by-step layout.'
    : '- Accessibility Mode is OFF. Be concise, friendly, and practical.'}`;

  const prompt = `Fan message:\n${message}`;

  return { systemInstruction, prompt };
}
