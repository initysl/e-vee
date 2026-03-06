import { apiClient } from './client';
import { ChatRequest, ChatResponse } from '@/types/chatbot';

export const chatbotApi = {
  // Send message to chatbot and get response
  chat: async (message: string): Promise<ChatResponse> => {
    try {
      const request: ChatRequest = { message };
      const response = await apiClient.post<ChatResponse>(
        '/chatbot/chat',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  },

  // Send multiple messages in sequence (for conversation context)
  chatBatch: async (messages: string[]): Promise<ChatResponse[]> => {
    try {
      const responses: ChatResponse[] = [];

      for (const message of messages) {
        const response = await chatbotApi.chat(message);
        responses.push(response);
      }

      return responses;
    } catch (error) {
      console.error('Error in batch chat:', error);
      throw error;
    }
  },

  clearHistory: async (): Promise<void> => {
    try {
      await apiClient.delete('/chatbot/history');
    } catch (error) {
      console.error('Error clearing chatbot history:', error);
      throw error;
    }
  },
};
