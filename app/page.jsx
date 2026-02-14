'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, RefreshCw, Undo2, Code2, Eye, FileText, LayoutList, MessageSquare } from 'lucide-react';

/* ── Component imports for live preview ────────────────────────────── */
import ButtonComp from '../components/Button';
import CardComp from '../components/Card';
import InputComp from '../components/Input';
import TableComp from '../components/Table';
import ModalComp from '../components/Modal';
import SidebarComp from '../components/Sidebar';
import NavbarComp from '../components/Navbar';
import ChartComp from '../components/Chart';

/* ── Unique session id ──────────────────────────────────────────────── */
function makeSessionId() {
  return 'sess_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ── Quick action suggestions ──────────────────────────────────────── */
const QUICK_ACTIONS = [
  'Build a dashboard with charts and stats',
  'Create a login form',
  'Create an admin panel with sidebar',
  'Show a data table with users',
  'Build a landing page with navbar',
  'Add a modal dialog',
];

/* ── Safe React renderer from code string ──────────────────────────── */
function renderPreview(code) {
  if (!code) return null;

  try {
    // Extract JSX content from the return statement
    const returnMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\);\s*\}$/m);
    if (!returnMatch) {
      // Try simpler pattern
      const simpleReturn = code.match(/return\s*\(([\s\S]*)\)/);
      if (!simpleReturn) return null;
    }

    // Parse the code to extract component tree as data
    const componentTree = parseCodeToTree(code);
    if (!componentTree) return null;
    return renderTree(componentTree);
  } catch (e) {
    return React.createElement('div', {
      className: 'preview-error'
    }, `Preview error: ${e.message}`);
  }
}

/* ── Parse generated code into a renderable tree ───────────────────── */
function parseCodeToTree(code) {
  try {
    // Extract all JSX from the return statement  
    const returnMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\);\s*\}/m);
    const jsx = returnMatch ? returnMatch[1].trim() : null;
    if (!jsx) return null;
    return { type: 'raw', jsx, code };
  } catch (e) {
    return null;
  }
}

/* ── Render tree by interpreting known patterns ────────────────────── */
function renderTree(tree) {
  if (!tree || !tree.code) return null;

  const code = tree.code;

  // Parse components from the plan-based structure
  // Instead of eval, we'll render components directly based on analysis
  const elements = [];

  // Detect layout style
  let layoutStyle = { padding: '24px' };
  if (code.includes("display: 'flex', minHeight: '100vh'") || code.includes('display: "flex", minHeight: "100vh"')) {
    layoutStyle = { display: 'flex', minHeight: '100vh' };
  } else if (code.includes("justifyContent: 'center'") || code.includes('justifyContent: "center"')) {
    layoutStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' };
  }

  // Extract all component instances
  const componentPattern = /<(Button|Card|Input|Table|Modal|Sidebar|Navbar|Chart)\s*([\s\S]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
  let match;
  const components = [];

  while ((match = componentPattern.exec(code)) !== null) {
    const type = match[1];
    const propsStr = match[2];
    const children = match[3] || '';
    const props = parseProps(propsStr);
    components.push({ type, props, children: children.trim() });
  }

  // If sidebar layout, separate sidebar and main
  const hasSidebar = components.some(c => c.type === 'Sidebar');
  const hasNavbar = components.some(c => c.type === 'Navbar');

  if (hasSidebar) {
    const sidebarComps = components.filter(c => c.type === 'Sidebar');
    const mainComps = components.filter(c => c.type !== 'Sidebar');

    return React.createElement('div', { style: { display: 'flex', minHeight: '100vh' }, key: 'root' }, [
      ...sidebarComps.map((c, i) => renderComponent(c, `sidebar-${i}`)),
      React.createElement('main', { style: { flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }, key: 'main' },
        mainComps.map((c, i) => renderComponent(c, `main-${i}`))
      )
    ]);
  }

  if (hasNavbar) {
    const navComps = components.filter(c => c.type === 'Navbar');
    const mainComps = components.filter(c => c.type !== 'Navbar');

    return React.createElement('div', { style: { minHeight: '100vh' }, key: 'root' }, [
      ...navComps.map((c, i) => renderComponent(c, `nav-${i}`)),
      React.createElement('main', { style: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }, key: 'main' },
        mainComps.map((c, i) => renderComponent(c, `main-${i}`))
      )
    ]);
  }

  // Centered layout
  const isCentered = code.includes("justifyContent: 'center'") || code.includes('justifyContent: "center"');
  if (isCentered) {
    return React.createElement('div', {
      style: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' },
      key: 'root'
    },
      React.createElement('div', { style: { width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }, key: 'inner' },
        components.map((c, i) => renderComponent(c, `item-${i}`))
      )
    );
  }

  // Default single layout
  return React.createElement('div', {
    style: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
    key: 'root'
  },
    components.map((c, i) => renderComponent(c, `item-${i}`))
  );
}

/* ── Parse JSX-like props string to object ─────────────────────────── */
function parseProps(propsStr) {
  const props = {};
  if (!propsStr) return props;

  // Match key="value" and key={"value"} and key={value} patterns
  const patterns = [
    // key="string"
    /(\w+)="([^"]*)"/g,
    // key={'string'}  
    /(\w+)=\{'([^']*)'\}/g,
    // key={JSON} - arrays, objects, booleans, numbers
    /(\w+)=\{(\[[\s\S]*?\]|\{[\s\S]*?\}|true|false|\d+(?:\.\d+)?)\}/g,
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(propsStr)) !== null) {
      const key = m[1];
      let val = m[2];
      try {
        val = JSON.parse(val);
      } catch (e) {
        // keep as string
      }
      props[key] = val;
    }
  }

  return props;
}

/* ── Render a single component ─────────────────────────────────────── */
function renderComponent(comp, key) {
  const { type, props, children } = comp;
  const compMap = {
    Button: ButtonComp,
    Card: CardComp,
    Input: InputComp,
    Table: TableComp,
    Modal: ModalComp,
    Sidebar: SidebarComp,
    Navbar: NavbarComp,
    Chart: ChartComp,
  };

  const Component = compMap[type];
  if (!Component) return null;

  // Extract text children from nested HTML  
  let childContent = children;
  if (children) {
    // Strip HTML tags to get text content for simple cases
    const textContent = children.replace(/<[^>]*>/g, '').trim();
    if (textContent) childContent = textContent;
  }

  // Build props object
  const componentProps = { ...props, key };

  // Handle children prop for components that need it
  if (type === 'Button') {
    return React.createElement(Component, componentProps, props.children || childContent || 'Click me');
  }
  if (type === 'Card') {
    return React.createElement(Component, componentProps, childContent ? React.createElement('p', null, childContent) : null);
  }
  if (type === 'Modal') {
    return React.createElement(Component, componentProps, childContent ? React.createElement('p', null, childContent) : null);
  }

  return React.createElement(Component, componentProps);
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [sessionId] = useState(() => makeSessionId());
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [code, setCode] = useState('');
  const [editableCode, setEditableCode] = useState('');
  const [plan, setPlan] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [versions, setVersions] = useState([]);
  const [currentVersionId, setCurrentVersionId] = useState(null);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync editable code with generated code
  useEffect(() => {
    setEditableCode(code);
  }, [code]);

  /* ── API call ──────────────────────────────────────────────────────── */
  const callAPI = useCallback(async (action, payload) => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action, ...payload }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }, [sessionId]);

  /* ── Send message handler ──────────────────────────────────────────── */
  const handleSend = useCallback(async (messageOverride) => {
    const msg = (messageOverride || inputValue).trim();
    if (!msg || loading) return;

    setInputValue('');
    setLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    // Add loading message
    setMessages(prev => [...prev, { role: 'loading', content: '' }]);

    try {
      const data = await callAPI('generate', { message: msg });

      // Remove loading message, add assistant response
      setMessages(prev => {
        const without = prev.filter(m => m.role !== 'loading');
        return [...without, {
          role: 'assistant',
          content: data.explanation || 'UI generated successfully.',
        }];
      });

      // Update state
      setCode(data.code);
      setPlan(data.plan);
      setExplanation(data.explanation);
      setCurrentVersionId(data.version.id);
      setVersions(prev => [...prev, {
        id: data.version.id,
        timestamp: data.version.timestamp,
        userMessage: msg,
      }]);
      setActiveTab('preview');

      // Add warnings if any
      if (data.warnings && data.warnings.length > 0) {
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Warning: ${data.warnings.join('; ')}`,
        }]);
      }
    } catch (err) {
      setMessages(prev => {
        const without = prev.filter(m => m.role !== 'loading');
        return [...without, {
          role: 'error',
          content: `Error: ${err.message}`,
        }];
      });
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading, callAPI]);

  /* ── Rollback handler ──────────────────────────────────────────────── */
  const handleRollback = useCallback(async (versionId) => {
    if (loading) return;
    setLoading(true);

    setMessages(prev => [...prev, {
      role: 'system',
      content: `Rolling back to version ${versionId}...`,
    }]);

    try {
      const data = await callAPI('rollback', { versionId });

      setCode(data.code);
      setPlan(data.plan);
      setExplanation(data.explanation);
      setCurrentVersionId(data.version.id);
      setVersions(prev => [...prev, {
        id: data.version.id,
        timestamp: data.version.timestamp,
        userMessage: `Rollback to v${versionId}`,
      }]);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Rolled back to version ${versionId}. ${data.explanation}`,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Rollback failed: ${err.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, callAPI]);

  /* ── Regenerate (re-send last user message) ────────────────────────── */
  const handleRegenerate = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  }, [messages, handleSend]);

  /* ── Key handler for Enter to send ─────────────────────────────────── */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  /* ── Live preview memo ─────────────────────────────────────────────── */
  const preview = useMemo(() => renderPreview(editableCode), [editableCode]);

  return (
    <div className="app-container">
      {/* ── Left Panel: Chat ─────────────────────────────────────────── */}
      <div className="left-panel">
        <div className="left-panel-header">
          <h1>
            <span className="logo"><MessageSquare size={16} /></span>
            UI Generator
          </h1>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p className="chat-empty-title">Describe the UI you want</p>
              <p className="chat-empty-sub">Components will be selected from a fixed library</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              {msg.role === 'user' && <span className="message-label">You</span>}
              {msg.role === 'assistant' && <span className="message-label">AI Agent</span>}
              {msg.role === 'loading' ? (
                <div className="message-bubble">
                  <div className="loading-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              ) : (
                <div className="message-bubble">{msg.content}</div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="quick-actions">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                className="quick-action-btn"
                onClick={() => handleSend(action)}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Version History */}
        {versions.length > 0 && (
          <div className="version-history">
            <h3>Version History</h3>
            {versions.map((v) => (
              <div key={v.id} className={`version-item ${v.id === currentVersionId ? 'active' : ''}`}>
                <span className="version-label">v{v.id}</span>
                <span className="version-msg">{v.userMessage}</span>
                {v.id !== currentVersionId && (
                  <button
                    className="version-btn"
                    onClick={() => handleRollback(v.id)}
                    disabled={loading}
                  >
                    <Undo2 size={10} />
                    Restore
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-area">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the UI you want to build..."
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={() => handleSend()}
            disabled={loading || !inputValue.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* ── Right Panel: Code / Preview / Explanation ────────────────── */}
      <div className="right-panel">
        {/* Tab Bar */}
        <div className="tab-bar">
          <button
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <span className="tab-icon"><Eye size={14} /></span>
            Preview
          </button>
          <button
            className={`tab ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            <span className="tab-icon"><Code2 size={14} /></span>
            Code
          </button>
          <button
            className={`tab ${activeTab === 'explanation' ? 'active' : ''}`}
            onClick={() => setActiveTab('explanation')}
          >
            <span className="tab-icon"><FileText size={14} /></span>
            Explanation
          </button>
          <button
            className={`tab ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            <span className="tab-icon"><LayoutList size={14} /></span>
            Plan
          </button>

          {code && (
            <div className="tab-actions">
              <button className="tab-action-btn" onClick={handleRegenerate} disabled={loading}>
                <RefreshCw size={12} />
                Regenerate
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="live-preview">
              {preview ? (
                <div className="preview-frame">{preview}</div>
              ) : (
                <div className="preview-empty">
                  Generate a UI to see a live preview here
                </div>
              )}
            </div>
          )}

          {/* Code Tab */}
          {activeTab === 'code' && (
            <div className="code-editor-wrapper">
              <textarea
                className="code-editor"
                value={editableCode}
                onChange={(e) => setEditableCode(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}

          {/* Explanation Tab */}
          {activeTab === 'explanation' && (
            <div className="explanation-panel">
              {explanation ? (
                <div className="explanation-content">{explanation}</div>
              ) : (
                <div className="preview-empty">
                  Generate a UI to see an explanation here
                </div>
              )}
            </div>
          )}

          {/* Plan Tab */}
          {activeTab === 'plan' && (
            <div className="code-editor-wrapper">
              <textarea
                className="code-editor"
                value={plan ? JSON.stringify(plan, null, 2) : '// Generate a UI to see the plan here'}
                readOnly
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
