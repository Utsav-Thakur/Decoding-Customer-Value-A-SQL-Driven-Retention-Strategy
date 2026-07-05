// ============================================================
// Gemini AI Proxy — JARVIS Advanced Intelligence Backend
// Calls Google Gemini API with customer context + conversation
// memory for truly intelligent, context-aware responses.
// ============================================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_STREAM_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse';

// ─── Build the JARVIS system instruction ──────────────────

function buildSystemInstruction(customerContext) {
  return `You are JARVIS — Just A Rather Very Intelligent System — a luxury brand customer intelligence strategist.

CORE RULE: Answer ONLY what the user asked. No extra context, no unsolicited advice, no filler. Be direct and concise. If a one-sentence answer suffices, give one sentence.

STYLE:
• Short, direct answers — never pad responses with unnecessary information
• Use **bold** only for key numbers or terms
• Use bullet points only when listing multiple items
• No greetings, no sign-offs, no "Great question!" or similar filler
• Never repeat the question back
• Never add "Let me know if you need anything else" or similar
• If the user asks a yes/no question, start with yes or no

CUSTOMER DATA (reference only when the question is about customers):
${customerContext}

FORMATTING:
• Use **bold** sparingly for key metrics
• Use bullet points (•) for lists
• Never use markdown headers (#)
• Keep it short`;
}

// ─── Build conversation history for Gemini ────────────────

function buildContents(messages, newQuestion) {
  const contents = [];

  // Add recent conversation history (last 10 messages)
  const recentMessages = messages.slice(-10);
  for (const msg of recentMessages) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    });
  }

  // Add the new user question
  contents.push({
    role: 'user',
    parts: [{ text: newQuestion }],
  });

  return contents;
}

// ─── Non-streaming Gemini call (fallback) ─────────────────

export async function askGemini(question, customerContext, conversationHistory = []) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      success: false,
      text: `I need a Gemini API key to answer general questions.\n\n**Setup (takes 30 seconds):**\n1. Go to **aistudio.google.com**\n2. Click "Get API Key" → Create a key\n3. Create a file called **.env** in your project root\n4. Add: VITE_GEMINI_API_KEY=your_key_here\n5. Restart the dev server\n\nI can still answer all **customer data questions** without an API key — try asking about tiers, churn, geography, or revenue!`,
    };
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: buildSystemInstruction(customerContext) }],
        },
        contents: buildContents(conversationHistory, question),
        generationConfig: {
          temperature: 0.75,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || response.statusText;
      console.error('[JARVIS Gemini] API error:', errMsg);
      return {
        success: false,
        text: `Gemini API returned an error: **${errMsg}**\n\nPlease check your API key in the .env file and try again. I can still answer customer data questions without the API.`,
      };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I received an empty response. Try rephrasing your question.';

    return { success: true, text };
  } catch (err) {
    console.error('[JARVIS Gemini] Network error:', err);
    return {
      success: false,
      text: `I couldn't reach the Gemini API. Check your internet connection and try again.\n\nError: ${err.message}`,
    };
  }
}

// ─── Streaming Gemini call ────────────────────────────────

export async function askGeminiStreaming(question, customerContext, conversationHistory = [], onChunk, onDone, onError) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const fallbackText = `I need a Gemini API key to answer general questions.\n\n**Setup (takes 30 seconds):**\n1. Go to **aistudio.google.com**\n2. Click "Get API Key" → Create a key\n3. Create a file called **.env** in your project root\n4. Add: VITE_GEMINI_API_KEY=your_key_here\n5. Restart the dev server\n\nI can still answer all **customer data questions** without an API key!`;
    onDone(fallbackText);
    return;
  }

  try {
    const response = await fetch(`${GEMINI_STREAM_URL}&key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: buildSystemInstruction(customerContext) }],
        },
        contents: buildContents(conversationHistory, question),
        generationConfig: {
          temperature: 0.75,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || response.statusText;
      onError(`Gemini API error: **${errMsg}**`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (chunk) {
              fullText += chunk;
              onChunk(chunk, fullText);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    }

    onDone(fullText);
  } catch (err) {
    console.error('[JARVIS Gemini] Streaming error:', err);
    onError(`Network error: ${err.message}`);
  }
}

// ─── Check if Gemini is configured ────────────────────────

export function isGeminiConfigured() {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return !!(key && key !== 'your_gemini_api_key_here');
}
