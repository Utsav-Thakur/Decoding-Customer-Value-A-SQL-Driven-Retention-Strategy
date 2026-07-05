import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { askJarvis, JARVIS_SUGGESTED_PROMPTS, buildCustomerContext } from '../../utils/jarvisIntelligence';
import { askGeminiStreaming, isGeminiConfigured } from '../../utils/geminiProxy';
import { getSmartFallback } from '../../utils/jarvisKnowledge';

// ─── Inline styles (Warm Premium, no Tailwind dependency) ─

const BURGUNDY = '#6b1d2a';
const BURGUNDY_DARK = '#4a1220';
const BURGUNDY_LIGHT = '#8b2635';
const GOLD = '#c9973a';
const GOLD_LIGHT = '#f0d080';
const CREAM = '#faf7f2';
const CARD_BG = '#ffffff';
const BORDER = '#e8ddd5';
const TEXT_PRIMARY = '#1a0a0e';
const TEXT_SECONDARY = '#6b5b5e';
const TEXT_MUTED = '#a89a9d';

// ─── Timestamp helper ─────────────────────────────────────

const getTimestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ─── JARVIS component ─────────────────────────────────────

export default function Jarvis() {
  const { customers } = useData();
  const customerCount = customers?.length || 0;

  // ── Core state (all useState — zero localStorage) ──
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'jarvis',
      text: '',  // will be set after mount via customerCount
      timestamp: getTimestamp(),
      streaming: false,
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const streamIntervalRef = useRef(null);

  // ── Initialize welcome message with live customer count ──
  useEffect(() => {
    if (!hasInitialized && customerCount > 0) {
      setMessages([{
        id: 'welcome',
        role: 'jarvis',
        text: `Hello. I'm JARVIS — Just A Rather Very Intelligent System.\n\nI have full access to your ${customerCount.toLocaleString()} customers across 50 US states. I can answer questions about loyalty segments, promo dependency, geographic opportunities, value tiers, and retention strategy.\n\n${isGeminiConfigured() ? '✨ **Gemini AI is active** — I can also answer general questions, write emails, explain concepts, and create strategy memos.' : '💡 Add a Gemini API key to unlock general question answering.'}\n\nWhat would you like to know?`,
        timestamp: getTimestamp(),
        streaming: false,
      }]);
      setHasInitialized(true);
    }
  }, [customerCount, hasInitialized]);

  // ── Auto-scroll on new message ──
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isThinking]);

  // ── Focus input on open ──
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);


  // ── Cleanup streaming on unmount ──
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  // ── Stream a response character by character ──
  const streamResponse = useCallback((responseText) => {
    const msgId = `jarvis-${Date.now()}`;
    const newMsg = {
      id: msgId,
      role: 'jarvis',
      text: '',
      timestamp: getTimestamp(),
      streaming: true,
    };

    setMessages(prev => [...prev, newMsg]);
    setIsThinking(false);

    let i = 0;
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

    streamIntervalRef.current = setInterval(() => {
      i++;
      setMessages(prev =>
        prev.map(m =>
          m.id === msgId
            ? { ...m, text: responseText.slice(0, i), streaming: i < responseText.length }
            : m
        )
      );
      if (i >= responseText.length) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
    }, 11);
  }, []);

  // ── Send a message ──
  const sendMessage = useCallback((textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || isThinking) return;

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: getTimestamp(),
      streaming: false,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setShowSuggestions(false);
    setIsThinking(true);

    // Try local intelligence first
    const result = askJarvis(text, customers || []);

    if (result.type === 'local') {
      // Fast local response — stream with character animation
      setTimeout(() => {
        streamResponse(result.text);
      }, 420);
    } else {
      // Check if Gemini is configured
      if (isGeminiConfigured()) {
        // Route to Gemini AI for general questions
        const customerContext = buildCustomerContext(customers || []);

        // Build conversation history for Gemini context
        setMessages(prev => {
          const conversationHistory = prev
            .filter(m => m.id !== 'welcome' && m.text)
            .slice(-10)
            .map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));

          // Start Gemini streaming
          const geminiMsgId = `jarvis-${Date.now()}`;
          const geminiMsg = {
            id: geminiMsgId,
            role: 'jarvis',
            text: '',
            timestamp: getTimestamp(),
            streaming: true,
            isGemini: true,
          };

          // Use setTimeout to avoid state update in render
          setTimeout(() => {
            setMessages(p => [...p, geminiMsg]);
            setIsThinking(false);

            askGeminiStreaming(
              text,
              customerContext,
              conversationHistory,
              // onChunk
              (chunk, fullText) => {
                setMessages(p =>
                  p.map(m =>
                    m.id === geminiMsgId
                      ? { ...m, text: fullText, streaming: true }
                      : m
                  )
                );
              },
              // onDone
              (fullText) => {
                setMessages(p =>
                  p.map(m =>
                    m.id === geminiMsgId
                      ? { ...m, text: fullText, streaming: false }
                      : m
                  )
                );
              },
              // onError
              (errorMsg) => {
                setMessages(p =>
                  p.map(m =>
                    m.id === geminiMsgId
                      ? { ...m, text: `I encountered an issue: ${errorMsg}\n\nTry asking a customer data question instead — those work offline!`, streaming: false }
                      : m
                  )
                );
              }
            );
          }, 100);

          return prev;
        });
      } else {
        // No API key — use local smart fallback
        setTimeout(() => {
          const fallbackResponse = getSmartFallback(text);
          streamResponse(fallbackResponse);
        }, 420);
      }
    }
  }, [input, isThinking, customers, streamResponse]);

  // ── Listen to global open-jarvis events ──
  useEffect(() => {
    const handleOpenJarvis = (e) => {
      setIsOpen(true);
      setIsMinimized(false);
      if (e.detail?.question) {
        // Use a short timeout to let state update first
        setTimeout(() => {
          sendMessage(e.detail.question);
        }, 50);
      }
    };
    window.addEventListener('open-jarvis', handleOpenJarvis);
    return () => window.removeEventListener('open-jarvis', handleOpenJarvis);
  }, [sendMessage]);

  // ── Handle Enter key ──
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // ── Toggle open/close ──
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
    setIsMinimized(false);
  }, []);

  // ─── Render ───────────────────────────────────────────────

  return (
    <>
      {/* ── Expanded Chat Panel ── */}
      {isOpen && !isMinimized && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '384px',
            height: '580px',
            zIndex: 9999,
            borderRadius: '20px',
            background: CARD_BG,
            border: `1px solid ${BORDER}`,
            boxShadow: `0 20px 60px rgba(107,29,42,0.18), 0 4px 16px rgba(107,29,42,0.10)`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'jarvisOpen 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${BURGUNDY}, ${BURGUNDY_LIGHT})`,
              padding: '16px 18px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Left: Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Avatar */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${BURGUNDY_DARK}, ${BURGUNDY})`,
                    border: `2px solid ${GOLD}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '18px',
                    fontWeight: '700',
                    color: GOLD,
                    flexShrink: 0,
                  }}
                >
                  J
                </div>
                {/* Name block */}
                <div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#ffffff',
                      letterSpacing: '0.02em',
                      lineHeight: 1.2,
                    }}
                  >
                    JARVIS
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: GOLD,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: '500',
                    }}
                  >
                    Customer Intelligence
                  </div>
                  {/* Status bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#4ade80',
                        animation: 'jarvisPulse 2s infinite',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter, sans-serif' }}>
                      Online · Analysing {customerCount.toLocaleString()} customers
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Controls */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setIsMinimized(true)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  −
                </button>
                <button
                  onClick={toggleOpen}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              background: CREAM,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Typing indicator */}
            {isThinking && <TypingIndicator />}

            {/* Suggested prompts */}
            {showSuggestions && !isThinking && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  marginTop: '4px',
                }}
              >
                {JARVIS_SUGGESTED_PROMPTS.map((prompt, i) => (
                  <div
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      padding: '8px 10px',
                      border: `1px solid ${BORDER}`,
                      borderRadius: '20px',
                      fontSize: '11px',
                      color: TEXT_SECONDARY,
                      cursor: 'pointer',
                      background: CARD_BG,
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                      lineHeight: 1.3,
                      fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = BURGUNDY;
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = BURGUNDY;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = CARD_BG;
                      e.currentTarget.style.color = TEXT_SECONDARY;
                      e.currentTarget.style.borderColor = BORDER;
                    }}
                  >
                    {prompt}
                  </div>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              borderTop: `1px solid ${BORDER}`,
              background: CARD_BG,
              padding: '12px 14px 10px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask JARVIS anything about your customers…"
                disabled={isThinking}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '24px',
                  fontSize: '12px',
                  fontFamily: 'Inter, sans-serif',
                  color: TEXT_PRIMARY,
                  background: isThinking ? '#f8f5f0' : CREAM,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = GOLD}
                onBlur={e => e.currentTarget.style.borderColor = BORDER}
              />
              {/* Send button */}
              <div
                onClick={() => sendMessage()}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: input.trim() && !isThinking
                    ? `linear-gradient(135deg, ${BURGUNDY}, ${BURGUNDY_LIGHT})`
                    : '#e8ddd5',
                  cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: input.trim() && !isThinking ? `0 2px 8px rgba(107,29,42,0.3)` : 'none',
                  transform: 'translateY(0)',
                }}
                onMouseEnter={e => {
                  if (input.trim() && !isThinking) {
                    e.currentTarget.style.transform = 'scale(1.06)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                textAlign: 'center',
                fontSize: '9.5px',
                color: TEXT_MUTED,
                letterSpacing: '0.04em',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {isGeminiConfigured()
                ? 'Powered by BrandIQ Intelligence + Gemini AI'
                : 'BrandIQ Local Intelligence · Add API key for Gemini AI'
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Minimized banner ── */}
      {isOpen && isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            zIndex: 9999,
            background: `linear-gradient(135deg, ${BURGUNDY}, ${BURGUNDY_LIGHT})`,
            borderRadius: '40px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: `0 4px 20px rgba(107,29,42,0.35)`,
            border: `1px solid ${GOLD}`,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: `1.5px solid ${GOLD}`,
              background: BURGUNDY_DARK,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '13px',
              fontWeight: '700',
              color: GOLD,
            }}
          >
            J
          </div>
          <span style={{ color: '#ffffff', fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: '500' }}>
            JARVIS
          </span>
          <span style={{ color: GOLD, fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
            — tap to expand
          </span>
          <button
            onClick={e => { e.stopPropagation(); toggleOpen(); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
              padding: '0 0 0 4px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Floating launcher button ── */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {/* Main button */}
        <div
          onClick={toggleOpen}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: isOpen
              ? `linear-gradient(135deg, ${BURGUNDY_DARK}, ${BURGUNDY})`
              : `linear-gradient(135deg, ${BURGUNDY}, ${BURGUNDY_LIGHT})`,
            border: `2px solid ${GOLD}`,
            boxShadow: `0 4px 20px rgba(107,29,42,0.40), 0 0 0 ${isOpen ? '0px' : '4px'} rgba(201,151,58,0.15)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            position: 'relative',
            userSelect: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = `0 8px 28px rgba(107,29,42,0.50), 0 0 0 6px rgba(201,151,58,0.18)`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `0 4px 20px rgba(107,29,42,0.40), 0 0 0 4px rgba(201,151,58,0.15)`;
          }}
        >
          {/* "J" monogram or close X */}
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '22px',
                fontWeight: '700',
                color: GOLD,
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              J
            </span>
          )}

          {/* Pulsing status dot */}
          {!isOpen && (
            <div
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#4ade80',
                border: '2px solid #ffffff',
                animation: 'jarvisPulse 2s infinite',
              }}
            />
          )}
        </div>

        {/* "JARVIS" label below button */}
        {!isOpen && (
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              color: GOLD,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              userSelect: 'none',
            }}
          >
            JARVIS
          </span>
        )}
      </div>

      {/* ── CSS animations (injected once) ── */}
      <style>{`
        @keyframes jarvisOpen {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes jarvisPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.55; transform: scale(1.3); }
        }
        @keyframes jarvisThinkDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes jarvisCursor {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </>
  );
}

// ─── MessageBubble sub-component ──────────────────────────

function MessageBubble({ msg }) {
  const isBot = msg.role === 'jarvis';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isBot ? 'row' : 'row-reverse',
        alignItems: 'flex-start',
        gap: '8px',
        maxWidth: '100%',
      }}
    >
      {/* Bot avatar */}
      {isBot && (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, #4a1220, #6b1d2a)`,
            border: `1.5px solid #c9973a`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '12px',
            fontWeight: '700',
            color: '#c9973a',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          J
        </div>
      )}

      {/* Bubble */}
      <div style={{ maxWidth: '82%' }}>
        <div
          style={{
            padding: '10px 13px',
            borderRadius: isBot ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
            background: isBot ? '#ffffff' : `linear-gradient(135deg, #6b1d2a, #8b2635)`,
            border: isBot ? `1px solid #e8ddd5` : 'none',
            boxShadow: isBot ? '0 1px 4px rgba(107,29,42,0.06)' : '0 2px 8px rgba(107,29,42,0.25)',
            fontSize: '12.5px',
            lineHeight: '1.65',
            color: isBot ? '#1a0a0e' : '#ffffff',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <MessageText text={msg.text} isBot={isBot} streaming={msg.streaming} />
        </div>
        <div
          style={{
            fontSize: '10px',
            color: '#a89a9d',
            marginTop: '3px',
            textAlign: isBot ? 'left' : 'right',
            paddingLeft: isBot ? '4px' : 0,
            paddingRight: isBot ? 0 : '4px',
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: isBot ? 'flex-start' : 'flex-end',
          }}
        >
          {msg.timestamp}
          {msg.isGemini && isBot && (
            <span
              style={{
                fontSize: '9px',
                color: '#c9973a',
                fontWeight: '600',
                letterSpacing: '0.03em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              ✨ Gemini
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MessageText — handles markdown-like bold formatting ──

function MessageText({ text, isBot, streaming }) {
  // Render **bold** as <strong>
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} style={{ fontWeight: '700', color: isBot ? '#6b1d2a' : '#f0d080' }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
      {streaming && (
        <span
          style={{
            display: 'inline-block',
            width: '2px',
            height: '13px',
            background: isBot ? '#6b1d2a' : '#f0d080',
            marginLeft: '1px',
            verticalAlign: 'text-bottom',
            animation: 'jarvisCursor 0.7s infinite',
            borderRadius: '1px',
          }}
        />
      )}
    </span>
  );
}

// ─── Typing indicator ─────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      {/* Avatar */}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, #4a1220, #6b1d2a)`,
          border: `1.5px solid #c9973a`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '12px',
          fontWeight: '700',
          color: '#c9973a',
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        J
      </div>

      {/* Dots */}
      <div
        style={{
          padding: '12px 16px',
          background: '#ffffff',
          border: '1px solid #e8ddd5',
          borderRadius: '12px 12px 12px 4px',
          display: 'flex',
          gap: '5px',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(107,29,42,0.06)',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#6b1d2a',
              animation: `jarvisThinkDot 1.4s ${i * 0.2}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
