import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, X, Send, Sparkles } from 'lucide-react';

export default function AIChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Welcome to **BrandIQ — Customer Intelligence**. I am your luxury brand strategist. How can I assist you with your customer analysis today?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch pre-computed AI insights via React Query
  const { data: aiInsights } = useQuery({
    queryKey: ['aiInsights'],
    queryFn: async () => {
      const res = await fetch('/data/ai_insights.json');
      if (!res.ok) throw new Error('Failed to load AI insights');
      return res.json();
    },
    staleTime: Infinity
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, typingText]);

  const handleSend = (textToSend) => {
    const queryText = textToSend || inputText;
    if (!queryText.trim()) return;

    // Add user message
    const newMsg = { sender: 'user', text: queryText };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    if (!aiInsights) {
      // Fallback if data is not loaded yet
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Connecting to BrandIQ insights engine...' }]);
      }, 500);
      return;
    }

    setIsTyping(true);
    setTypingText('');

    // Determine matched response
    const normalizedQuery = queryText.toLowerCase();
    let matchedKey = 'default';

    for (const key of Object.keys(aiInsights)) {
      if (key === 'default') continue;
      const keywords = aiInsights[key].keywords;
      if (keywords.some(kw => normalizedQuery.includes(kw))) {
        matchedKey = key;
        break;
      }
    }

    const responseTemplate = aiInsights[matchedKey].response;
    
    // Simulate luxury streaming text
    let index = 0;
    const intervalTime = Math.max(10, Math.min(25, 1000 / responseTemplate.length));
    
    const interval = setInterval(() => {
      setTypingText(prev => prev + responseTemplate.charAt(index));
      index++;
      if (index >= responseTemplate.length) {
        clearInterval(interval);
        setMessages(prev => [...prev, { sender: 'bot', text: responseTemplate }]);
        setTypingText('');
        setIsTyping(false);
      }
    }, intervalTime);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const suggestions = [
    { label: 'Pyramid Tiers', text: 'Show customer pyramid details' },
    { label: 'Promo Trap', text: 'Explain the promo trap segment' },
    { label: 'Ideal Customer', text: 'Show the Ideal Customer Profile' },
    { label: 'Retention Plays', text: 'What is the retention playbook?' }
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center cursor-pointer fade-up"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '96px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--burgundy), var(--burgundy-2))',
          boxShadow: '0 4px 20px rgba(107, 29, 42, 0.4)',
          border: '2px solid var(--gold)',
          zIndex: 1000,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(107, 29, 42, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(107, 29, 42, 0.4)';
        }}
      >
        {isOpen ? <X size={24} color="#faf7f2" /> : <Brain size={24} color="var(--gold)" />}
      </div>

      {/* Chat Window Panel */}
      {isOpen && (
        <div 
          className="premium-card flex flex-col fade-up"
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '96px',
            width: '380px',
            height: '520px',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4"
            style={{
              background: 'linear-gradient(135deg, var(--burgundy), var(--burgundy-2))',
              color: '#faf7f2'
            }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center justify-center"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1.5px solid var(--gold)'
                }}
              >
                <Sparkles size={16} color="var(--gold)" />
              </div>
              <div className="flex flex-col">
                <span className="heading-serif" style={{ fontSize: '15px', fontWeight: '600' }}>BrandIQ Strategist</span>
                <span style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '500' }}>Database Cognitive Engine</span>
              </div>
            </div>
            <div onClick={() => setIsOpen(false)} className="cursor-pointer p-1" style={{ opacity: 0.8 }}>
              <X size={18} />
            </div>
          </div>

          {/* Messages */}
          <div 
            className="flex-grow p-4 overflow-y-auto flex flex-col gap-3"
            style={{ background: 'var(--bg)' }}
          >
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={msg.sender === 'user' ? 'ai-message-user p-3 w-fit max-w-[80%] align-self-end ml-auto' : 'ai-message-bot p-3 w-fit max-w-[85%]'}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}
              >
                {/* Render simple markdown bold syntax */}
                <div 
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </div>
            ))}
            
            {/* Streaming typing message */}
            {isTyping && typingText && (
              <div 
                className="ai-message-bot p-3 w-fit max-w-[85%]"
                style={{
                  alignSelf: 'flex-start',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}
              >
                <span 
                  className="stream-cursor"
                  dangerouslySetInnerHTML={{
                    __html: typingText
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div 
            className="flex gap-2 p-2 overflow-x-auto" 
            style={{ 
              background: 'var(--bg-2)', 
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)' 
            }}
          >
            {suggestions.map((sug, sIdx) => (
              <div
                key={sIdx}
                onClick={() => handleSend(sug.text)}
                className="btn-ghost"
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {sug.label}
              </div>
            ))}
          </div>

          {/* Input Panel */}
          <div className="flex items-center gap-2 p-3" style={{ background: '#ffffff' }}>
            <input
              type="text"
              placeholder="Ask about tiers, maps, promos..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="form-input"
              style={{
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '13px'
              }}
              disabled={isTyping}
            />
            <div 
              onClick={() => handleSend()}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--burgundy)',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Send size={14} color="#faf7f2" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
