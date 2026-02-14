/**
 * LLM Abstraction Layer
 *
 * Uses the Google Generative AI SDK (@google/genai) with Gemini.
 * Set GEMINI_API_KEY in your environment variables.
 *
 * Falls back to a deterministic mock when no API key is configured,
 * so the app is fully functional for demos without a key.
 */

import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let ai = null;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/**
 * Call the LLM with a system prompt and user prompt.
 * Returns the assistant's text response.
 *
 * @param {string} systemPrompt - Instructions for the LLM
 * @param {string} userPrompt   - The user's input
 * @param {object} options      - Optional overrides (reserved for future use)
 * @returns {Promise<string>}   - The LLM response text
 */
export async function callLLM(systemPrompt, userPrompt, options = {}) {
  if (!ai) {
    // Fallback: generate a deterministic mock response for demo/testing
    return generateMockResponse(systemPrompt, userPrompt);
  }

  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  return response.text;
}

/**
 * Mock response generator for when no API key is configured.
 * Provides deterministic responses based on prompts.
 */
function generateMockResponse(systemPrompt, userPrompt) {
  // Detect which agent step is calling
  if (systemPrompt.includes('Planner')) {
    return generateMockPlan(userPrompt);
  }
  if (systemPrompt.includes('Generator')) {
    return generateMockCode(userPrompt);
  }
  if (systemPrompt.includes('Explainer')) {
    return generateMockExplanation(userPrompt);
  }
  return '{"error": "Unknown agent step"}';
}

function generateMockPlan(userPrompt) {
  const lower = userPrompt.toLowerCase();

  // Detect intent keywords and build appropriate plan
  const components = [];
  let layout = 'single';

  if (lower.includes('dashboard') || lower.includes('analytics')) {
    layout = 'navbar-main';
    components.push(
      { type: 'Navbar', props: { title: 'Dashboard', items: ['Overview', 'Analytics', 'Settings'] } },
      { type: 'Card', props: { title: 'Total Users', subtitle: '1,234' } },
      { type: 'Card', props: { title: 'Revenue', subtitle: '$12,345' } },
      { type: 'Chart', props: { title: 'Monthly Data', type: 'bar', data: [{ label: 'Jan', value: 30 }, { label: 'Feb', value: 45 }, { label: 'Mar', value: 60 }, { label: 'Apr', value: 35 }] } },
      { type: 'Table', props: { title: 'Recent Activity', columns: ['User', 'Action', 'Date'], rows: [['Alice', 'Signed up', '2026-02-14'], ['Bob', 'Purchased', '2026-02-13'], ['Carol', 'Updated profile', '2026-02-12']] } }
    );
  } else if (lower.includes('sidebar') || lower.includes('navigation') || lower.includes('admin')) {
    layout = 'sidebar-main';
    components.push(
      { type: 'Sidebar', props: { title: 'Admin', items: ['Dashboard', 'Users', 'Settings', 'Reports'] } },
      { type: 'Card', props: { title: 'Welcome', subtitle: 'Select a section from the sidebar' } },
      { type: 'Table', props: { title: 'Users', columns: ['Name', 'Email', 'Role'], rows: [['Alice', 'alice@example.com', 'Admin'], ['Bob', 'bob@example.com', 'User']] } }
    );
  } else if (lower.includes('form') || lower.includes('login') || lower.includes('signup') || lower.includes('register')) {
    layout = 'centered';
    components.push(
      { type: 'Card', props: { title: 'Sign In' } },
      { type: 'Input', props: { label: 'Email', placeholder: 'Enter your email', type: 'email' } },
      { type: 'Input', props: { label: 'Password', placeholder: 'Enter your password', type: 'password' } },
      { type: 'Button', props: { children: 'Sign In', variant: 'primary', fullWidth: true } }
    );
  } else if (lower.includes('table') || lower.includes('list') || lower.includes('data')) {
    layout = 'navbar-main';
    components.push(
      { type: 'Navbar', props: { title: 'Data View', items: ['All', 'Active', 'Archived'] } },
      { type: 'Table', props: { title: 'Records', columns: ['ID', 'Name', 'Status', 'Date'], rows: [['1', 'Item A', 'Active', '2026-02-14'], ['2', 'Item B', 'Pending', '2026-02-13'], ['3', 'Item C', 'Active', '2026-02-12']] } },
      { type: 'Button', props: { children: 'Add New', variant: 'primary' } }
    );
  } else if (lower.includes('modal') || lower.includes('dialog') || lower.includes('popup')) {
    layout = 'single';
    components.push(
      { type: 'Card', props: { title: 'Main Content' } },
      { type: 'Button', props: { children: 'Open Dialog', variant: 'primary' } },
      { type: 'Modal', props: { title: 'Confirmation', open: true, children: 'Are you sure you want to proceed?' } },
      { type: 'Button', props: { children: 'Confirm', variant: 'primary' } },
      { type: 'Button', props: { children: 'Cancel', variant: 'secondary' } }
    );
  } else if (lower.includes('chart') || lower.includes('graph') || lower.includes('visualization')) {
    layout = 'single';
    components.push(
      { type: 'Card', props: { title: 'Data Visualization' } },
      { type: 'Chart', props: { title: 'Sales Overview', type: 'bar', data: [{ label: 'Q1', value: 120 }, { label: 'Q2', value: 200 }, { label: 'Q3', value: 150 }, { label: 'Q4', value: 280 }] } },
      { type: 'Chart', props: { title: 'Trends', type: 'line', data: [{ label: 'Mon', value: 10 }, { label: 'Tue', value: 25 }, { label: 'Wed', value: 18 }, { label: 'Thu', value: 32 }, { label: 'Fri', value: 28 }] } }
    );
  } else {
    // Generic UI
    layout = 'navbar-main';
    components.push(
      { type: 'Navbar', props: { title: 'My App', items: ['Home', 'About', 'Contact'] } },
      { type: 'Card', props: { title: 'Welcome', subtitle: 'This is your generated UI' } },
      { type: 'Button', props: { children: 'Get Started', variant: 'primary' } },
      { type: 'Button', props: { children: 'Learn More', variant: 'secondary' } }
    );
  }

  return JSON.stringify({ layout, components }, null, 2);
}

function generateMockCode(userPrompt) {
  // Extract the plan from the user prompt
  let plan;
  try {
    const planMatch = userPrompt.match(/Plan:\s*([\s\S]*?)(?:\n\nPrevious code:|$)/);
    if (planMatch) {
      plan = JSON.parse(planMatch[1].trim());
    }
  } catch (e) {
    // fallback
  }

  if (!plan) {
    return `import React from 'react';
import { Card, Button } from '../components';

export default function GeneratedUI() {
  return (
    <div style={{ padding: '24px' }}>
      <Card title="Generated UI">
        <Button variant="primary">Hello World</Button>
      </Card>
    </div>
  );
}`;
  }

  // Build code from plan
  const imports = new Set();
  plan.components.forEach((c) => imports.add(c.type));

  const importLine = `import { ${[...imports].join(', ')} } from '../components';`;

  let bodyComponents = '';
  plan.components.forEach((c, i) => {
    bodyComponents += renderComponentToCode(c, i, '      ');
  });

  let wrapperStyle = "{ padding: '24px' }";
  if (plan.layout === 'sidebar-main') {
    wrapperStyle = "{ display: 'flex', minHeight: '100vh' }";
  } else if (plan.layout === 'centered') {
    wrapperStyle = "{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' }";
  }

  let innerWrapper = bodyComponents;
  if (plan.layout === 'sidebar-main') {
    const sidebarComp = plan.components.find((c) => c.type === 'Sidebar');
    const others = plan.components.filter((c) => c.type !== 'Sidebar');
    let sidebarCode = sidebarComp ? renderComponentToCode(sidebarComp, 0, '        ') : '';
    let mainCode = others.map((c, i) => renderComponentToCode(c, i, '          ')).join('');
    innerWrapper = `${sidebarCode}
        <main style={{ flex: 1, padding: '24px' }}>
${mainCode}        </main>`;
  } else if (plan.layout === 'centered') {
    innerWrapper = `      <div style={{ width: '100%', maxWidth: '400px' }}>
${bodyComponents}      </div>`;
  }

  const code = `import React from 'react';
${importLine}

export default function GeneratedUI() {
  return (
    <div style={${wrapperStyle}}>
${innerWrapper}
    </div>
  );
}`;

  return code;
}

function renderComponentToCode(comp, index, indent) {
  const { type, props = {} } = comp;
  const propEntries = Object.entries(props);

  if (type === 'Button') {
    const childText = props.children || 'Click me';
    const otherProps = propEntries
      .filter(([k]) => k !== 'children')
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ');
    return `${indent}<Button ${otherProps}>${childText}</Button>\n`;
  }

  if (type === 'Card') {
    const cardProps = propEntries
      .filter(([k]) => k !== 'children')
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ');
    const childText = props.children || '';
    return `${indent}<Card ${cardProps}>${childText ? `\n${indent}  <p>${childText}</p>\n${indent}` : ''}</Card>\n`;
  }

  if (type === 'Input') {
    const inputProps = propEntries
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ');
    return `${indent}<Input ${inputProps} />\n`;
  }

  if (type === 'Table') {
    const columns = JSON.stringify(props.columns || []);
    const rows = JSON.stringify(props.rows || []);
    const title = props.title ? ` title=${JSON.stringify(props.title)}` : '';
    return `${indent}<Table${title} columns={${columns}} rows={${rows}} />\n`;
  }

  if (type === 'Modal') {
    const modalProps = propEntries
      .filter(([k]) => k !== 'children')
      .map(([k, v]) => `${k}={${JSON.stringify(v)}}`)
      .join(' ');
    const childText = props.children || '';
    return `${indent}<Modal ${modalProps}>\n${indent}  <p>${childText}</p>\n${indent}</Modal>\n`;
  }

  if (type === 'Sidebar') {
    const sidebarProps = propEntries
      .map(([k, v]) => `${k}={${JSON.stringify(v)}}`)
      .join(' ');
    return `${indent}<Sidebar ${sidebarProps} />\n`;
  }

  if (type === 'Navbar') {
    const navProps = propEntries
      .map(([k, v]) => `${k}={${JSON.stringify(v)}}`)
      .join(' ');
    return `${indent}<Navbar ${navProps} />\n`;
  }

  if (type === 'Chart') {
    const chartProps = propEntries
      .map(([k, v]) => `${k}={${JSON.stringify(v)}}`)
      .join(' ');
    return `${indent}<Chart ${chartProps} />\n`;
  }

  return '';
}

function generateMockExplanation(userPrompt) {
  return `## UI Generation Summary

### Layout Decision
The layout was chosen based on the user's intent to best organize the requested components in a clear, usable arrangement.

### Component Choices
Each component was selected from the approved component library (Button, Card, Input, Table, Modal, Sidebar, Navbar, Chart) based on the UI requirements described.

### Changes
This version was generated based on the user's latest request. Components were arranged to provide an intuitive and functional interface.`;
}
