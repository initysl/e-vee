'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Send, X } from 'lucide-react';
import { GiTakeMyMoney } from 'react-icons/gi';
import { MdAddShoppingCart } from 'react-icons/md';
import { RiRobot3Line, RiShoppingBag2Line } from 'react-icons/ri';

import { Button } from '@/components/ui/button';
import { useChatbot } from '@/hooks/useChatbot';
import { ChatMessage } from '@/types/chatbot';
import { Product } from '@/types/product';

export default function Chatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const { messages, loading, sendMessage, clearChat } = useChatbot();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handlePrompt = async (prompt: string) => {
    if (!prompt || loading) return;
    await sendMessage(prompt);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    if (confirm('Clear chat history?')) {
      await clearChat();
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

  const getMessageProducts = (message: ChatMessage): Product[] => {
    const metadata = message.metadata;
    if (!metadata) return [];

    if (metadata.products?.length) return metadata.products;
    if (metadata.product) return [metadata.product];
    return [];
  };

  const renderProductCards = (products: Product[]) => {
    if (products.length === 0) return null;

    return (
      <div className='space-y-2 pt-1'>
        {products.map((product) => (
          <div
            key={product.id}
            className='rounded-2xl border border-zinc-200 bg-white px-3 py-3 shadow-sm'
          >
            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='text-sm font-semibold text-zinc-900 line-clamp-2'>
                  {product.title}
                </p>
                <p className='text-xs text-zinc-500'>{product.category}</p>
              </div>
              <span className='text-sm font-semibold text-zinc-900'>
                ${product.price.toFixed(2)}
              </span>
            </div>

            <p className='mt-2 text-xs leading-relaxed text-zinc-600 line-clamp-3'>
              {product.description}
            </p>

            <div className='mt-3 flex flex-wrap gap-2'>
              <InlineChip
                label='Details'
                onClick={() => void handlePrompt(`Tell me about product ${product.id}`)}
              />
              <InlineChip
                label='Add to Cart'
                onClick={() => void handlePrompt(`Add product ${product.id} to cart`)}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSuggestions = (message: ChatMessage) => {
    const suggestions = message.metadata?.suggestions ?? [];
    if (!suggestions.length) return null;

    return (
      <div className='flex flex-wrap gap-2 pt-1'>
        {suggestions.map((suggestion) => (
          <InlineChip
            key={`${suggestion.label}-${suggestion.prompt}`}
            label={suggestion.label}
            onClick={() => void handlePrompt(suggestion.prompt)}
          />
        ))}
      </div>
    );
  };

  const renderActionChips = (message: ChatMessage) => {
    if (message.role === 'user' || !message.action) return null;

    return (
      <div className='flex flex-wrap gap-2 pt-1'>
        {message.action === 'redirect_to_checkout' && (
          <ActionChip
            label='Checkout'
            icon={<GiTakeMyMoney size={14} />}
            onClick={() => handleAction(message.action)}
          />
        )}

        {message.action === 'show_cart_button' && (
          <ActionChip
            label='View Cart'
            icon={<MdAddShoppingCart size={14} />}
            onClick={() => handleAction(message.action)}
          />
        )}

        {message.action === 'browse_products' && (
          <ActionChip
            label='Browse Market'
            icon={<RiShoppingBag2Line size={14} />}
            onClick={() => handleAction(message.action)}
          />
        )}
      </div>
    );
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const products = getMessageProducts(message);

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div className='max-w-[84%] space-y-2'>
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-zinc-700 text-white rounded-br-md shadow-sm'
                : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-md shadow-sm'
            }`}
          >
            <p className='whitespace-pre-wrap'>{message.content}</p>

            <div className='mt-1 text-[10px] text-zinc-400'>
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {!isUser && renderProductCards(products)}
          {!isUser && renderActionChips(message)}
          {!isUser && renderSuggestions(message)}
        </div>
      </motion.div>
    );
  };

  return (
    <>
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

        <div className='relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-b from-blue-600 to-zinc-700 opacity-60'>
          <AnimatePresence mode='wait'>
            {!isOpen ? (
              <motion.div
                key='robot'
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <RiRobot3Line size={28} className='text-white' />
              </motion.div>
            ) : (
              <motion.div
                key='close'
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <X size={28} className='text-white' />
              </motion.div>
            )}
          </AnimatePresence>

          {!isOpen && (
            <motion.span
              className='absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-red-500'
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
              className='absolute right-16 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-zinc-700 px-3 py-2 text-sm text-white md:block'
            >
              Chat with E-vee
              <div className='absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2 rotate-45 bg-zinc-800' />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className='fixed bottom-24 right-6 z-50 flex h-110 w-82 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:w-96'
          >
            <div className='shrink-0 bg-linear-to-r from-blue-600 to-blue-700 p-4 text-white'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-white/20'>
                  <RiRobot3Line size={24} />
                </div>
                <div className='flex-1'>
                  <h3 className='text-base font-semibold'>E-vee</h3>
                  <p className='text-xs text-white/80'>Session-aware shopping help</p>
                </div>
                <button
                  onClick={() => void handleClearChat()}
                  className='text-xs text-white/80 hover:text-white'
                >
                  Clear
                </button>
              </div>
            </div>

            <div className='flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4'>
              {messages.length === 0 && (
                <div className='flex justify-start'>
                  <div className='rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-sm'>
                    <p className='text-sm text-gray-800'>
                      Hi. Ask me for products, comparisons, cart help, or checkout guidance.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message, index) => renderMessage(message, index))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='flex justify-start'
                >
                  <div className='rounded-2xl border border-zinc-200 bg-white px-4 py-2 shadow-sm'>
                    <div className='flex items-center gap-2 text-xs text-zinc-400'>
                      <span className='h-2 w-2 animate-pulse rounded-full bg-zinc-400' />
                      <span>E-vee is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className='shrink-0 border-t bg-white p-3'>
              <div className='flex gap-2'>
                <input
                  ref={inputRef}
                  type='text'
                  value={inputMessage}
                  onChange={(event) => setInputMessage(event.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder='Ask for products, comparisons, or cart help...'
                  disabled={loading}
                  maxLength={240}
                  className='flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100'
                />
                <Button
                  onClick={() => void handleSendMessage()}
                  disabled={!inputMessage.trim() || loading}
                  size='icon'
                  className='shrink-0 rounded-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
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

type ActionChipProps = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
};

function ActionChip({ label, icon, onClick }: ActionChipProps) {
  return (
    <button
      onClick={onClick}
      className='flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100'
    >
      {icon}
      {label}
    </button>
  );
}

type InlineChipProps = {
  label: string;
  onClick: () => void;
};

function InlineChip({ label, onClick }: InlineChipProps) {
  return (
    <button
      onClick={onClick}
      className='rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 transition hover:border-zinc-300 hover:bg-white'
    >
      {label}
    </button>
  );
}
