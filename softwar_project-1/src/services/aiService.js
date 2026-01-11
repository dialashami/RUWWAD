import { aiAPI } from './api';

// Use the backend's Ollama AI integration
export const generateAIResponse = async (message, chatHistory = []) => {
  try {
    const response = await aiAPI.sendMessage(message);
    return response.data?.answer || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('AI API Error:', error);
    return "I'm sorry, I'm having trouble responding right now. Please try again later.";
  }
};