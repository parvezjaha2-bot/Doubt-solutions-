import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Send, 
  Trash2, 
  Bot, 
  User, 
  Loader2, 
  BookOpen, 
  ChevronRight,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_DOUBTS = [
  "Explain photosynthesis simple",
  "How to solve quadratic equations?",
  "Who discovered Gravity?",
  "What is the capital of Bangladesh?"
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your **Doubt Solution** tutor. 📚 \n\nAsk me any question about your studies or general knowledge, and I'll explain it clearly for you. What are you stuck on today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text }] }
        ],
        config: {
          systemInstruction: "You are 'Doubt Solution', a helpful and expert academic tutor. Provide clear, step-by-step explanations. Use Markdown for formatting (bold, lists, code blocks). If the user asks in Bengali or English, respond in that same language or a mix as appropriate. Be encouraging and concise. Answer as quickly and accurately as possible.",
        },
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullContent += chunkText;
          setMessages(prev => prev.map(m => 
            m.id === assistantMsgId ? { ...m, content: fullContent } : m
          ));
        }
      }
    } catch (error) {
      console.error('Error fetching solution:', error);
      setMessages(prev => prev.map(m => 
        m.id === assistantMsgId ? { ...m, content: "Oops! Something went wrong. Please try again." } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Chat cleared! I'm ready for new doubts. What can I help you with? 📖",
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-indigo-200 shadow-lg">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900">Doubt Solution</h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              AI Tutor Active
            </p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
          title="Clear everything"
        >
          <Trash2 size={20} />
        </button>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-indigo-600 border border-indigo-100'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                
                <div className={`max-w-[85%] px-5 py-3 rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  <div className="prose prose-slate max-w-none prose-sm sm:prose-base dark:prose-invert">
                    <ReactMarkdown 
                      components={{
                        p: ({children}) => <p className="mb-0 leading-relaxed">{children}</p>,
                        code: ({children}) => (
                          <code className="bg-slate-800 text-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({children}) => (
                          <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto my-2 text-xs text-slate-100">
                            {children}
                          </pre>
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <div className={`text-[10px] mt-2 opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                </div>
                <span className="text-xs text-slate-400 font-medium">Solving doubt...</span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Section */}
      <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Quick Questions */}
          {messages.length < 3 && !isLoading && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {QUICK_DOUBTS.map((doubt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(doubt)}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 border border-indigo-100 transition-all flex items-center gap-1.5"
                >
                  <Sparkles size={12} />
                  {doubt}
                </button>
              ))}
            </div>
          )}

          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your doubt here..."
              className="w-full pl-6 pr-14 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 placeholder:text-slate-400 shadow-inner"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md group-hover:scale-105 active:scale-95"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 font-medium">
            Powered by Gemini AI • Quality Doubt Explanations
          </p>
        </div>
      </div>
    </div>
  );
}

