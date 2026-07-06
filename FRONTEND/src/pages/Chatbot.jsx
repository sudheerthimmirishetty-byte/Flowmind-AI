import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Paperclip,
  Mic,
  Bot,
  Trash2,
  Moon,
  Sun,
  Circle,
  User,
} from 'lucide-react'
import { cn } from '../utils/helpers'
import { aiAPI } from '../services/api'

// ── Mock AI response logic ────────────────────────────────────────────────────
const getAIResponse = (text) => {
  const lower = text.toLowerCase()
  if (/document|upload|file|aadhar|pan|passport|certificate|letter/.test(lower))
    return 'You need to upload: Aadhar Card, PAN Card, Passport, Degree Certificate, Experience Certificate, and Offer Letter. All files should be PDF or JPG under 10 MB. Head to the Document Center to get started!'
  if (/long|duration|days|weeks|timeline|complete|finish|how.*time/.test(lower))
    return 'The typical onboarding process takes 7–10 business days from document submission to orientation. Your progress is tracked in real-time on the dashboard. 📅'
  if (/manager|hr|contact|sarah|who.*help|report/.test(lower))
    return 'Your onboarding manager is Sarah Johnson (HR). You can reach her at hr@company.com or call +91-9800000001 during business hours (Mon–Fri, 9 AM–6 PM IST). 👩‍💼'
  if (/it|laptop|computer|email|setup|software|system|access/.test(lower))
    return 'IT setup includes: laptop configuration, corporate email setup, system access provisioning, and software installation (VS Code, Slack, Zoom, etc.). This happens after manager approval — usually on your joining day. 💻'
  if (/orientation|session|training|schedule|when|date|july/.test(lower))
    return 'Your orientation is scheduled for July 15, 2026 at 10:00 AM IST in Conference Room A (3rd Floor, Block B). You will receive a calendar invite 48 hours before. 🎉'
  if (/salary|pay|payroll|ctc|package|compensation/.test(lower))
    return 'Salary details and CTC breakdown are shared by HR during your offer discussion. For payroll-related queries, contact payroll@company.com. Your first salary will be processed after completing the probation formalities. 💰'
  if (/leave|holiday|vacation|pto|time.?off/.test(lower))
    return 'You are entitled to 18 casual/sick leaves and 12 earned leaves per year (pro-rated for joining month). National and company holidays are listed in the HR portal. Leave requests go through your reporting manager. 🌴'
  if (/policy|code of conduct|rules|guidelines/.test(lower))
    return 'Our company policies are available in the Employee Handbook (shared in your onboarding email). Key highlights: flexible work hours, remote-friendly culture, zero-tolerance harassment policy. 📋'
  return 'I understand your question. Let me connect you with our HR team for a detailed answer. Alternatively, you can email hr@company.com or call +91-9800000001 during business hours. Is there anything else I can help you with? 😊'
}

// ── Suggested questions ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  'What documents do I need to upload?',
  'How long does onboarding take?',
  'Who is my onboarding manager?',
  'What is the IT setup process?',
  'When is my orientation session?',
]

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    text: 'Hi! 👋 I am your AI Onboarding Assistant. I can help you with document requirements, workflow status, company policies, and any onboarding questions. How can I help you today?',
    time: new Date(),
  },
]

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-slate-400 inline-block"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ── Format time ───────────────────────────────────────────────────────────────
const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

// ── Component ─────────────────────────────────────────────────────────────────
export default function Chatbot() {
  const [messages, setMessages]   = useState(initialMessages)
  const [input, setInput]         = useState('')
  const [isTyping, setIsTyping]   = useState(false)
  const [isDark, setIsDark]       = useState(false)
  const bottomRef                 = useRef(null)
  const inputRef                  = useRef(null)

  const hasUserMessages = messages.some((m) => m.role === 'user')

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg = { id: Date.now(), role: 'user', text: trimmed, time: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await aiAPI.chat(trimmed, {})
      const aiText = res.data?.data?.response || res.data?.data?.message || 'I could not process your request. Please try again.'
      const aiMsg = { id: Date.now() + 1, role: 'assistant', text: aiText, time: new Date() }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      // Fallback to local response if backend unavailable
      const aiText = getAIResponse(trimmed)
      const aiMsg = { id: Date.now() + 1, role: 'assistant', text: aiText, time: new Date() }
      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = () => {
    setMessages(initialMessages)
    setIsTyping(false)
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 h-[calc(100vh-5rem)] flex flex-col">
      <div
        className={cn(
          'flex flex-col flex-1 max-w-4xl mx-auto w-full rounded-2xl overflow-hidden border shadow-xl transition-colors duration-300',
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'
        )}
      >

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center justify-between px-5 py-4 border-b transition-colors duration-300',
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
              <Bot size={20} className="text-white" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h2
                className={cn('text-base font-bold', isDark ? 'text-white' : 'text-slate-900')}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                AI Assistant
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Circle size={6} className="fill-emerald-400 text-emerald-400" />
                <span className="text-xs text-emerald-600 font-medium">Online</span>
                <span className={cn('text-xs ml-1', isDark ? 'text-slate-400' : 'text-slate-400')}>
                  · Powered by AI
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark((d) => !d)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark
                  ? 'bg-slate-700 text-amber-300 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
              title="Toggle dark mode"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={clearChat}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
              title="Clear chat"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* ── Chat area ───────────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex-1 overflow-y-auto px-5 py-6 space-y-5 scroll-smooth transition-colors duration-300',
            isDark ? 'bg-slate-900' : 'bg-slate-50/60'
          )}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {/* Assistant avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 mt-1 shadow">
                    <Bot size={14} className="text-white" />
                  </div>
                )}

                <div className={cn('max-w-[75%] flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
                  {/* Bubble */}
                  <div
                    className={cn(
                      'px-4 py-3 text-sm leading-relaxed shadow-sm',
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                        : isDark
                        ? 'bg-slate-800 text-slate-100 border border-slate-700 rounded-2xl rounded-bl-sm'
                        : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-bl-sm'
                    )}
                  >
                    {msg.text}
                  </div>
                  {/* Timestamp */}
                  <span
                    className={cn(
                      'text-[10px] mt-1 px-1',
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    )}
                  >
                    {formatTime(msg.time)}
                  </span>
                </div>

                {/* User avatar */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                    <User size={14} className="text-slate-500" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 mt-1 shadow">
                  <Bot size={14} className="text-white" />
                </div>
                <div
                  className={cn(
                    'px-4 py-3 rounded-2xl rounded-bl-sm border shadow-sm',
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                  )}
                >
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggested questions (shown when no user messages yet) */}
          {!hasUserMessages && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="pt-2"
            >
              <p className={cn('text-xs font-medium mb-3 px-1', isDark ? 'text-slate-400' : 'text-slate-400')}>
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium',
                      isDark
                        ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-blue-900/40 hover:border-blue-500 hover:text-blue-300'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ───────────────────────────────────────────────────── */}
        <div
          className={cn(
            'px-4 py-4 border-t transition-colors duration-300',
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
          )}
        >
          <div
            className={cn(
              'flex items-end gap-2 rounded-xl border px-3 py-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400',
              isDark
                ? 'bg-slate-700 border-slate-600'
                : 'bg-slate-50 border-slate-200'
            )}
          >
            {/* Attachment */}
            <button
              className={cn(
                'p-1.5 rounded-lg transition-colors flex-shrink-0',
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
              )}
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything about onboarding…"
              rows={1}
              className={cn(
                'flex-1 resize-none bg-transparent text-sm outline-none placeholder-slate-400 leading-relaxed py-1 max-h-32 overflow-y-auto',
                isDark ? 'text-slate-100' : 'text-slate-900'
              )}
              style={{ minHeight: '32px' }}
            />

            {/* Voice */}
            <button
              className={cn(
                'p-1.5 rounded-lg transition-colors flex-shrink-0',
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
              )}
              title="Voice input"
            >
              <Mic size={18} />
            </button>

            {/* Send */}
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className={cn(
                'p-2 rounded-lg transition-all duration-200 flex-shrink-0',
                input.trim() && !isTyping
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                  : isDark
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
              title="Send message"
            >
              <Send size={16} />
            </button>
          </div>
          <p className={cn('text-[10px] text-center mt-2', isDark ? 'text-slate-500' : 'text-slate-400')}>
            AI responses are for informational purposes. Always verify with HR for official decisions.
          </p>
        </div>

      </div>
    </div>
  )
}
