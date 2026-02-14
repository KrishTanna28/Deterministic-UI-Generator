/**
 * Planner Agent
 *
 * Step 1 of the AI pipeline.
 * Takes user intent and existing plan, produces a structured JSON plan
 * describing layout and components to use.
 */

import { callLLM } from '../lib/llm';
import { getAllowedComponents } from '../lib/validator';

const SYSTEM_PROMPT = `You are the Planner agent in a deterministic UI generation system.

Your job is to convert natural language UI descriptions into a structured JSON plan.

STRICT RULES:
1. You may ONLY use these components: ${getAllowedComponents().join(', ')}
2. You cannot create new components
3. You cannot suggest custom CSS or styling
4. Your output must be valid JSON only — no markdown, no explanation

OUTPUT FORMAT (JSON only):
{
  "layout": "single" | "sidebar-main" | "navbar-main" | "centered",
  "components": [
    {
      "type": "ComponentName",
      "props": { ... }
    }
  ]
}

COMPONENT PROPS REFERENCE:
- Button: { children (text), variant ("primary"|"secondary"|"danger"|"ghost"), size ("small"|"medium"|"large"), fullWidth (bool) }
- Card: { title (string), subtitle (string), padding ("small"|"medium"|"large") }
- Input: { label (string), placeholder (string), type ("text"|"email"|"password"|"number") }
- Table: { title (string), columns (string[]), rows (string[][]) }
- Modal: { title (string), open (bool), size ("small"|"medium"|"large"), children (text) }
- Sidebar: { title (string), items (string[]) }
- Navbar: { title (string), items (string[]) }
- Chart: { title (string), type ("bar"|"line"), data ({ label: string, value: number }[]) }

LAYOUT TYPES:
- "single": Components stacked vertically with padding
- "sidebar-main": Sidebar on left, main content on right
- "navbar-main": Top navbar, content below
- "centered": Content centered on page (good for forms/login)

Respond with ONLY the JSON object, nothing else.`;

/**
 * Run the planner agent.
 *
 * @param {string} userMessage - The user's natural language UI intent
 * @param {object|null} currentPlan - The existing plan if iterating
 * @returns {Promise<object>} - Structured plan object
 */
export async function runPlanner(userMessage, currentPlan = null) {
  let userPrompt = `User request: ${userMessage}`;

  if (currentPlan) {
    userPrompt += `\n\nCurrent plan (modify this, don't start from scratch unless asked):\n${JSON.stringify(currentPlan, null, 2)}`;
  }

  const response = await callLLM(SYSTEM_PROMPT, userPrompt, {
    temperature: 0.1,
  });

  // Parse the JSON response
  try {
    // Remove any markdown code block markers if present
    const cleaned = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Planner returned invalid JSON: ${e.message}\nResponse: ${response}`);
  }
}
