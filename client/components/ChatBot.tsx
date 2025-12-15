'use client';

import { RiRobot3Line } from 'react-icons/ri';
import { X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
        {/* Animated Background Rings */}
        <motion.div
          className='absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-zinc-700 opacity-75'
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

        {/* Main Button */}
        <div className='relative w-10 h-10 bg-gradient-to-b from-blue-600 to-zinc-700 rounded-full shadow-2xl flex items-center justify-center'>
          <AnimatePresence mode='wait'>
            {!isOpen ? (
              <motion.div
                key='robot'
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <RiRobot3Line size={25} className='text-white' />
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

          {/* Notification Dot */}
          <motion.span
            className='absolute -top-1 -right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white'
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className='absolute right-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-normal whitespace-nowrap shadow-xl'
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
            className='fixed bottom-22 right-6 w-80 h-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-40'
          >
            {/* Header */}
            <div className='bg-blue-600 p-4 text-white'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-white/20 rounded-full flex items-center justify-center'>
                  <RiRobot3Line size={24} />
                </div>
                <div>
                  <h3 className='font-semibold text-sm'>E-vee Assistant</h3>
                  <p className='text-xs text-white/80'>Always here to help</p>
                </div>
              </div>
            </div>

            {/* Chat Content */}
            <div className='h-[calc(100%-140px)] p-3 overflow-y-auto bg-gray-50'>
              <div className='text-center text-gray-500 text-sm'>
                Chat interface coming soon...
              </div>
            </div>

            {/* Input Area */}
            <div className='absolute bottom-0 left-0 right-0 p-2 bg-white border-t'>
              <input
                type='text'
                placeholder='Type your message...'
                className='w-full px-2 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600'
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
