'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, ChatResponse } from '@/types/chatbot';
import { chatbotApi } from '@/lib/api';
import { useCart } from '@/context/CartContext';

const CHAT_STORAGE_KEY = 'shophub_chat_history';

export const useChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshCart } = useCart();

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const restored = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(restored);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (userMessage: string): Promise<ChatResponse | null> => {
      if (!userMessage.trim()) return null;

      // Add user message to chat
      const userChatMessage: ChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userChatMessage]);
      setLoading(true);
      setError(null);

      try {
        const response = await chatbotApi.chat(userMessage);

        // Add assistant response to chat
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          intent: response.intent,
          action: response.action,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Refresh cart if action involves cart operations
        if (
          response.action &&
          [
            'show_cart_button',
            'redirect_to_checkout',
            'show_checkout_button',
          ].includes(response.action)
        ) {
          await refreshCart();
        }

        return response;
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.detail || 'Failed to get response from chatbot';
        setError(errorMessage);

        // Add error message to chat
        const errorChatMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorChatMessage]);
        console.error('Error sending message to chatbot:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [refreshCart]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
    resetError,
  };
};
