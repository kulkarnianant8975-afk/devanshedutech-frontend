import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Minus, Maximize2, Bot, User, Loader2, Sparkles } from 'lucide-react';
import api from '../services/api';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: "Hello! I'm Devansh, your AI learning assistant. How can I help you today? You can ask me about our courses, fees, or career guidance." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    const currentHistory = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post('/chat', {
        message: userMessage,
        history: currentHistory
      });

      setMessages(prev => [...prev, { role: 'bot', text: response.data.text }]);
    } catch (error: any) {
      console.error("Chatbot Error:", error);
      const errorMessage = error.response?.data?.error || "I'm sorry, I'm having some trouble connecting right now. Please try again later or contact us directly on WhatsApp!";
      setMessages(prev => [...prev, { role: 'bot', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[60]">
      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="bg-secondary text-white p-4 rounded-full shadow-2xl flex items-center justify-center relative group"
        >
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full" />
          <Bot size={28} />
          <span className="absolute left-full ml-4 bg-white text-secondary px-4 py-2 rounded-xl shadow-xl font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-100">
            Ask Devansh AI
          </span>
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.8 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 1,
              height: isMinimized ? '64px' : '500px'
            }}
            exit={{ y: 100, opacity: 0, scale: 0.8 }}
            className="bg-white rounded-3xl shadow-2xl w-[350px] md:w-[400px] overflow-hidden border border-gray-100 flex flex-col"
          >
            {/* Header */}
            <div className="bg-secondary p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Devansh AI Assistant</h3>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/70">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                  {messages.map((msg, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary ml-2' : 'bg-secondary mr-2'}`}>
                          {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm ${
                          msg.role === 'user' 
                            ? 'bg-primary text-white rounded-br-none shadow-md shadow-orange-100' 
                            : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                        <Loader2 size={16} className="animate-spin text-secondary" />
                        <span className="text-xs text-gray-500 italic">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type your message..."
                      className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-secondary/20 transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 p-2 bg-secondary text-white rounded-xl hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-center space-x-1 opacity-40">
                    <Sparkles size={10} />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Powered by Gemini AI</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChatbot;
