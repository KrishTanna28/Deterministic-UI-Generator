/**
 * Agent Orchestrator
 *
 * Coordinates the three-step agent pipeline:
 * 1. Planner  — converts intent to structured plan
 * 2. Generator — converts plan to React code
 * 3. Explainer — explains decisions in plain English
 *
 * Includes validation at each step and version management.
 */

import { runPlanner } from './planner';
import { runGenerator } from './generator';
import { runExplainer } from './explainer';
import { validatePlan, validateCode, sanitizeInput } from '../lib/validator';
import {
  saveVersion,
  getLatestVersion,
  getVersions,
  rollbackToVersion,
} from '../lib/versionStore';

/**
 * Run the full agent pipeline.
 *
 * @param {string} sessionId - Session identifier
 * @param {string} userMessage - User's natural language intent
 * @returns {Promise<object>} - { plan, code, explanation, version, warnings }
 */
export async function runAgent(sessionId, userMessage) {
  const warnings = [];

  // --- Step 0: Input validation ---
  const { safe, sanitized, warnings: inputWarnings } = sanitizeInput(userMessage);
  if (!safe) {
    warnings.push(...inputWarnings);
    // We still proceed but include warnings
  }

  const latestVersion = getLatestVersion(sessionId);
  const currentPlan = latestVersion ? latestVersion.plan : null;
  const previousCode = latestVersion ? latestVersion.code : null;

  // --- Step 1: Planner ---
  let plan;
  try {
    plan = await runPlanner(sanitized, currentPlan);
  } catch (e) {
    throw new Error(`Planner failed: ${e.message}`);
  }

  // Validate plan
  const planValidation = validatePlan(plan);
  if (!planValidation.valid) {
    throw new Error(
      `Plan validation failed:\n${planValidation.errors.join('\n')}`
    );
  }

  // --- Step 2: Generator ---
  let code;
  try {
    code = await runGenerator(plan, previousCode);
  } catch (e) {
    throw new Error(`Generator failed: ${e.message}`);
  }

  // Validate code
  const codeValidation = validateCode(code);
  if (!codeValidation.valid) {
    // Try once more without previous code context
    try {
      code = await runGenerator(plan, null);
      const retryValidation = validateCode(code);
      if (!retryValidation.valid) {
        throw new Error(
          `Code validation failed:\n${retryValidation.errors.join('\n')}`
        );
      }
    } catch (e2) {
      throw new Error(`Generator retry failed: ${e2.message}`);
    }
  }

  // --- Step 3: Explainer ---
  let explanation;
  try {
    explanation = await runExplainer(plan, code, currentPlan);
  } catch (e) {
    // Explainer failure is non-fatal
    explanation = 'Explanation could not be generated.';
    warnings.push(`Explainer error: ${e.message}`);
  }

  // --- Step 4: Save version ---
  const version = saveVersion(sessionId, {
    userMessage: sanitized,
    plan,
    code,
    explanation,
  });

  return {
    plan,
    code,
    explanation,
    version: {
      id: version.id,
      timestamp: version.timestamp,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Rollback to a previous version.
 *
 * @param {string} sessionId
 * @param {number} versionId
 * @returns {object|null} - The rolled back version
 */
export async function rollback(sessionId, versionId) {
  const result = rollbackToVersion(sessionId, versionId);
  if (!result) {
    throw new Error(`Version ${versionId} not found`);
  }
  return {
    plan: result.plan,
    code: result.code,
    explanation: result.explanation,
    version: {
      id: result.id,
      timestamp: result.timestamp,
    },
  };
}

/**
 * Get version history for a session.
 *
 * @param {string} sessionId
 * @returns {Array}
 */
export function getHistory(sessionId) {
  return getVersions(sessionId).map((v) => ({
    id: v.id,
    timestamp: v.timestamp,
    userMessage: v.userMessage,
  }));
}
