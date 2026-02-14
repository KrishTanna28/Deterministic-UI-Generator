/**
 * Generator Agent
 *
 * Step 2 of the AI pipeline.
 * Takes a structured plan and optional previous code,
 * produces React code using only allowed components.
 */

import { callLLM } from '../lib/llm';
import { getAllowedComponents } from '../lib/validator';

const SYSTEM_PROMPT = `You are the Generator agent in a deterministic UI generation system.

Your job is to generate React JSX code from a structured plan.

STRICT RULES:
1. You may ONLY use these components: ${getAllowedComponents().join(', ')}
2. All components must be imported from '../components'
3. You CANNOT create new components or HTML elements (except div, main, p, h1-h6, span, section for layout)
4. You CANNOT use inline CSS for component styling — only for layout positioning (display, flex, padding, margin, gap)
5. You CANNOT use Tailwind classes
6. You CANNOT use styled-components, emotion, or any CSS-in-JS
7. You CANNOT use external UI libraries
8. You CANNOT use dangerouslySetInnerHTML
9. The component must be named "GeneratedUI" and exported as default
10. Do NOT include any markdown formatting — output ONLY the raw JSX code
11. When modifying existing code, preserve as much of the original structure as possible

OUTPUT FORMAT (raw code only):
import React from 'react';
import { Component1, Component2 } from '../components';

export default function GeneratedUI() {
  return (
    <div>
      {/* components here */}
    </div>
  );
}

Generate ONLY the code, no explanations, no markdown.`;

/**
 * Run the generator agent.
 *
 * @param {object} plan - The structured plan from the Planner
 * @param {string|null} previousCode - Previous code for incremental edits
 * @returns {Promise<string>} - Generated React code
 */
export async function runGenerator(plan, previousCode = null) {
  let userPrompt = `Plan:\n${JSON.stringify(plan, null, 2)}`;

  if (previousCode) {
    userPrompt += `\n\nPrevious code (modify this, preserve structure where possible):\n${previousCode}`;
  }

  const response = await callLLM(SYSTEM_PROMPT, userPrompt, {
    temperature: 0.1,
    maxTokens: 4096,
  });

  // Clean up any markdown formatting
  let code = response
    .replace(/```jsx?\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  return code;
}
