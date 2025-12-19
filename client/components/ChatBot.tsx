'use client';

import { RiRobot3Line } from 'react-icons/ri';
import { X, Send, Loader2, ExternalLink } from 'lucide-react';
import { MdAddShoppingCart } from 'react-icons/md';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatbot } from '@/hooks/useChatbot';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/types/chatbot';

export default function Chatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const { messages, loading, sendMessage, clearChat } = useChatbot();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const message = inputMessage;
    setInputMessage('');

    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear chat history?')) {
      clearChat();
    }
  };

  const handleAction = (action?: string) => {
    if (!action) return;

    switch (action) {
      case 'redirect_to_checkout':
      case 'show_checkout_button':
        router.push('/checkout');
        break;
      case 'show_cart_button':
        router.push('/cart');
        break;
      case 'browse_products':
        router.push('/market');
        break;
      default:
        break;
    }
  };

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.role === 'user';

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex flex-col gap-2 ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
            isUser
              ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white'
              : 'bg-white text-gray-800 shadow-sm border border-gray-200'
          }`}
        >
          <p className='text-sm whitespace-pre-wrap'>{msg.content}</p>
          <p
            className={`text-xs mt-1 ${
              isUser ? 'text-blue-100' : 'text-gray-400'
            }`}
          >
            {msg.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Action Buttons */}
        {!isUser && msg.action && (
          <div className='flex gap-2 mt-1'>
            {msg.action === 'redirect_to_checkout' && (
              <Button
                size='sm'
                onClick={() => handleAction(msg.action)}
                className='text-xs bg-blue-600 hover:bg-blue-700'
              >
                <MdAddShoppingCart className='w-3 h-3 mr-1' />
                Checkout
              </Button>
            )}
            {msg.action === 'show_cart_button' && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleAction(msg.action)}
                className='text-xs'
              >
                <MdAddShoppingCart className='w-3 h-3 mr-1' />
                Cart
              </Button>
            )}
            {msg.action === 'browse_products' && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleAction(msg.action)}
                className='text-xs'
              >
                <ExternalLink className='w-3 h-3 mr-1' />
                Market
              </Button>
            )}
            {msg.action === 'show_checkout_button' && (
              <Button
                size='sm'
                onClick={() => handleAction(msg.action)}
                className='text-xs bg-green-600 hover:bg-green-700'
              >
                Proceed to Checkout
              </Button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className='fixed bottom-6 right-6 z-50 group'
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          className='absolute inset-0 rounded-full bg-linear-to-r from-blue-600 to-zinc-700 opacity-75'
          animate={{
            scale: isHovered ? [1, 1.2, 1] : 1,
            opacity: isHovered ? [0.75, 0.5, 0.75] : 0.75,
          }}
          transition={{
            duration: 1.5,
            repeat: isHovered ? Infinity : 0,
            ease: 'easeInOut',
          }}
        />

        <div className='relative w-14 h-14 bg-linear-to-b from-blue-600 to-zinc-700 rounded-full shadow-2xl flex items-center justify-center'>
          <AnimatePresence mode='wait'>
            {!isOpen ? (
              <motion.div
                key='robot'
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <RiRobot3Line size={28} className='text-white' />
              </motion.div>
            ) : (
              <motion.div
                key='close'
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <X size={28} className='text-white' />
              </motion.div>
            )}
          </AnimatePresence>

          {!isOpen && (
            <motion.span
              className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white'
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className='absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl'
            >
              Chat with E-vee
              <div className='absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900' />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chatbot Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className='fixed bottom-24 right-6 w-96 h-110 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-40 flex flex-col'
          >
            {/* Header */}
            <div className='bg-linear-to-r from-blue-600 to-blue-700 p-4 text-white shrink-0'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-white/20 rounded-full flex items-center justify-center'>
                  <RiRobot3Line size={24} />
                </div>
                <div className='flex-1'>
                  <h3 className='font-semibold text-base'>E-vee Assistant</h3>
                  <p className='text-xs text-white/80'>Always here to help</p>
                </div>
                <button
                  onClick={handleClearChat}
                  className='text-xs text-white/80 hover:text-white'
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50'>
              {messages.length === 0 && (
                <div className='flex justify-start'>
                  <div className='bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-200'>
                    <p className='text-sm text-gray-800'>
                      Hi! I'm E-vee, your shopping assistant. How can I help you
                      today?
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, index) => renderMessage(msg, index))}

              {/* Typing Indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='flex justify-start'
                >
                  <div className='bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200'>
                    <div className='flex gap-1'>
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <motion.div
                          key={i}
                          className='w-2 h-2 bg-gray-400 rounded-full'
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className='p-3 bg-white border-t shrink-0'>
              <div className='flex gap-2'>
                <input
                  ref={inputRef}
                  type='text'
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder='Type your message...'
                  disabled={loading}
                  className='flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 text-sm'
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || loading}
                  size='icon'
                  className='rounded-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shrink-0'
                >
                  {loading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Send className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
