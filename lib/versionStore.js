/**
 * In-Memory Version Store
 *
 * Stores versions of generated UI including plan, code,
 * explanation, and metadata. Supports rollback to any version.
 */

// In-memory store: Map of sessionId -> version array
const store = new Map();

/**
 * Get or create a session.
 * @param {string} sessionId
 * @returns {Array} - Version array for this session
 */
function getSession(sessionId) {
  if (!store.has(sessionId)) {
    store.set(sessionId, []);
  }
  return store.get(sessionId);
}

/**
 * Save a new version.
 * @param {string} sessionId
 * @param {object} data - { plan, code, explanation, userMessage }
 * @returns {object} - The saved version with id and timestamp
 */
export function saveVersion(sessionId, data) {
  const session = getSession(sessionId);
  const version = {
    id: session.length + 1,
    timestamp: new Date().toISOString(),
    userMessage: data.userMessage || '',
    plan: data.plan,
    code: data.code,
    explanation: data.explanation,
  };
  session.push(version);
  return version;
}

/**
 * Get all versions for a session.
 * @param {string} sessionId
 * @returns {Array} - All versions
 */
export function getVersions(sessionId) {
  return getSession(sessionId);
}

/**
 * Get a specific version by ID.
 * @param {string} sessionId
 * @param {number} versionId
 * @returns {object|null} - The version or null
 */
export function getVersion(sessionId, versionId) {
  const session = getSession(sessionId);
  return session.find((v) => v.id === versionId) || null;
}

/**
 * Get the latest version for a session.
 * @param {string} sessionId
 * @returns {object|null} - The latest version or null
 */
export function getLatestVersion(sessionId) {
  const session = getSession(sessionId);
  return session.length > 0 ? session[session.length - 1] : null;
}

/**
 * Rollback to a specific version by creating a new version
 * that copies the target version's data.
 * @param {string} sessionId
 * @param {number} versionId
 * @returns {object|null} - The new version created from rollback, or null
 */
export function rollbackToVersion(sessionId, versionId) {
  const target = getVersion(sessionId, versionId);
  if (!target) return null;

  return saveVersion(sessionId, {
    userMessage: `Rollback to version ${versionId}`,
    plan: target.plan,
    code: target.code,
    explanation: `Rolled back to version ${versionId}. ${target.explanation}`,
  });
}

/**
 * Clear all versions for a session.
 * @param {string} sessionId
 */
export function clearSession(sessionId) {
  store.delete(sessionId);
}

/**
 * Get count of active sessions (for monitoring).
 * @returns {number}
 */
export function getSessionCount() {
  return store.size;
}
