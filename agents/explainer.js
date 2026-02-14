/**
 * Explainer Agent
 *
 * Step 3 of the AI pipeline.
 * Takes the plan, generated code, and previous plan,
 * produces a human-readable explanation of what was done.
 */

import { callLLM } from '../lib/llm';

const SYSTEM_PROMPT = `You are the Explainer agent in a deterministic UI generation system.

Your job is to explain in plain English what the generated UI contains and why certain decisions were made.

You must cover:
1. Layout decisions — why this layout was chosen
2. Component choices — which components were used and why
3. What changed from the previous version (if applicable)

Keep explanations concise but informative. Use markdown formatting.
Talk about the UI from a user's perspective.`;

/**
 * Run the explainer agent.
 *
 * @param {object} plan - The structured plan
 * @param {string} code - The generated code
 * @param {object|null} previousPlan - The previous plan for diff explanation
 * @returns {Promise<string>} - Plain English explanation
 */
export async function runExplainer(plan, code, previousPlan = null) {
  let userPrompt = `Current plan:\n${JSON.stringify(plan, null, 2)}`;
  userPrompt += `\n\nGenerated code:\n${code}`;

  if (previousPlan) {
    userPrompt += `\n\nPrevious plan:\n${JSON.stringify(previousPlan, null, 2)}`;
    userPrompt += `\n\nPlease explain what changed from the previous version.`;
  } else {
    userPrompt += `\n\nThis is a new UI generation (no previous version).`;
  }

  const response = await callLLM(SYSTEM_PROMPT, userPrompt, {
    temperature: 0.3,
  });

  return response.trim();
}
