'use client';

import { useState, useCallback } from 'react';
import { ChatMessage, ChatResponse } from '@/types/chatbot';
import { chatbotApi } from '@/lib/api';

export const useChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
        };

        setMessages((prev) => [...prev, assistantMessage]);
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
    []
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
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
