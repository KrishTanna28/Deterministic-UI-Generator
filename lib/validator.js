/**
 * Validator Module
 *
 * Enforces the component whitelist and validates AI outputs
 * before they are rendered or stored.
 */

const ALLOWED_COMPONENTS = [
  'Button',
  'Card',
  'Input',
  'Table',
  'Modal',
  'Sidebar',
  'Navbar',
  'Chart',
];

const FORBIDDEN_PATTERNS = [
  // Inline style objects generated as CSS (we allow style={{ }} for layout wrappers only)
  /styled-components/i,
  /emotion/i,
  /@emotion/i,
  // External UI libraries
  /from\s+['"]@mui/i,
  /from\s+['"]@chakra/i,
  /from\s+['"]antd/i,
  /from\s+['"]@radix/i,
  /from\s+['"]@headlessui/i,
  /from\s+['"]react-bootstrap/i,
  // Dangerous patterns
  /dangerouslySetInnerHTML/i,
  /<script/i,
  /eval\s*\(/i,
  /Function\s*\(/i,
  /document\.write/i,
  /window\.location/i,
  /onclick\s*=/i,
  /onerror\s*=/i,
];

// Prompt injection patterns to detect and reject
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+(instructions|prompts)/i,
  /disregard\s+(previous|all|above)/i,
  /you\s+are\s+now/i,
  /new\s+instructions?:/i,
  /system\s*:\s*/i,
  /pretend\s+you/i,
  /act\s+as\s+if/i,
  /bypass\s+(the\s+)?(safety|filter|validation)/i,
  /override\s+(the\s+)?(rules|restrictions)/i,
];

/**
 * Validate a plan object from the Planner agent.
 * Returns { valid, errors }
 */
export function validatePlan(plan) {
  const errors = [];

  if (!plan || typeof plan !== 'object') {
    return { valid: false, errors: ['Plan must be a valid object'] };
  }

  if (!plan.layout || typeof plan.layout !== 'string') {
    errors.push('Plan must have a "layout" string field');
  }

  if (!Array.isArray(plan.components)) {
    errors.push('Plan must have a "components" array');
    return { valid: false, errors };
  }

  if (plan.components.length === 0) {
    errors.push('Plan must contain at least one component');
  }

  for (let i = 0; i < plan.components.length; i++) {
    const comp = plan.components[i];
    if (!comp.type) {
      errors.push(`Component at index ${i} is missing "type" field`);
      continue;
    }
    if (!ALLOWED_COMPONENTS.includes(comp.type)) {
      errors.push(
        `Component "${comp.type}" is not in the allowed list. Allowed: ${ALLOWED_COMPONENTS.join(', ')}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate generated React code from the Generator agent.
 * Returns { valid, errors }
 */
export function validateCode(code) {
  const errors = [];

  if (!code || typeof code !== 'string') {
    return { valid: false, errors: ['Code must be a non-empty string'] };
  }

  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(`Code contains forbidden pattern: ${pattern.source}`);
    }
  }

  // Extract all JSX component usages (capitalized tags)
  const componentUsages = code.match(/<([A-Z][a-zA-Z]*)/g);
  if (componentUsages) {
    const usedComponents = [...new Set(componentUsages.map((m) => m.slice(1)))];
    for (const comp of usedComponents) {
      if (!ALLOWED_COMPONENTS.includes(comp)) {
        errors.push(
          `Code uses non-allowed component "<${comp}>". Allowed: ${ALLOWED_COMPONENTS.join(', ')}`
        );
      }
    }
  }

  // Check that the code exports a component
  if (
    !code.includes('export default') &&
    !code.includes('module.exports')
  ) {
    errors.push('Code must export a default component');
  }

  // Check for className with Tailwind-like dynamic generation (ai-generated classes)
  // We only flag if there seems to be template literal class names with complex logic
  const dynamicClassPattern = /className=\{`[^`]*\$\{[^}]*\}[^`]*`\}/g;
  const dynamicMatches = code.match(dynamicClassPattern);
  if (dynamicMatches && dynamicMatches.length > 3) {
    errors.push('Code appears to use dynamically generated CSS classes');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check user input for prompt injection attempts.
 * Returns { safe, warnings }
 */
export function sanitizeInput(userMessage) {
  const warnings = [];

  if (!userMessage || typeof userMessage !== 'string') {
    return { safe: false, sanitized: '', warnings: ['Empty or invalid input'] };
  }

  // Trim and limit length
  let sanitized = userMessage.trim().slice(0, 2000);

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      warnings.push(`Potential prompt injection detected: ${pattern.source}`);
    }
  }

  return {
    safe: warnings.length === 0,
    sanitized,
    warnings,
  };
}

/**
 * Get the list of allowed components.
 */
export function getAllowedComponents() {
  return [...ALLOWED_COMPONENTS];
}
