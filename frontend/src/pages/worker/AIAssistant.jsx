import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';

const WORKER_LINKS = [
  { path: '/worker/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/worker/profile', label: 'My Profile', icon: '👤' },
  { path: '/worker/skills', label: 'Skills', icon: '🎯' },
  { path: '/worker/welfare', label: 'Welfare Schemes', icon: '🏥' },
  { path: '/worker/wage', label: 'Wage Analysis', icon: '💰' },
  { path: '/worker/grievance', label: 'File Complaint', icon: '📋' },
  { path: '/worker/assistant', label: 'AI Assistant', icon: '🤖' },
];

const SUGGESTED_QUESTIONS = [
  'Which schemes am I eligible for?',
  'Is my wage fair?',
  'How to file a safety complaint?',
  'What are my worker rights?',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content:
        'Hello! I\'m your MigrantShield AI Assistant. I can help you with welfare schemes, wage queries, your rights as a worker, and how to file complaints. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setTyping(true);
    try {
      const res = await api.post('/ai/chat', { message: userMsg });
      const aiReply = res.data.reply || res.data.message || res.data.response || 'Sorry, I could not process that.';
      setMessages((prev) => [...prev, { role: 'ai', content: aiReply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar links={WORKER_LINKS} portalName="Worker Portal" />
      <div className="main-content">
        <div className="page-body" style={{ padding: '24px 24px 0' }}>
          <div className="page-header">
            <h1>🤖 AI Assistant</h1>
            <p>Ask questions about your rights, welfare schemes, and wages</p>
          </div>

          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            ℹ️ Answers are based on official government sources. For legal advice, consult a qualified professional.
          </div>

          {/* Suggested questions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                className="btn btn-secondary btn-sm"
                onClick={() => sendMessage(q)}
                disabled={typing}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ margin: '0 24px 24px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 320px)', minHeight: 360 }}>
          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {typing && (
              <div className="chat-bubble ai">
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="chat-input-bar">
            <input
              className="form-control"
              placeholder="Type your question here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={typing}
            />
            <button
              className="btn btn-primary"
              onClick={() => sendMessage()}
              disabled={typing || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
