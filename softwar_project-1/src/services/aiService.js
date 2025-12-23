import axios from 'axios';

const AI_API_KEY = process.env.REACT_APP_AI_API_KEY;
const AI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const generateAIResponse = async (message, chatHistory = []) => {
  try {
    const response = await axios.post(AI_API_URL, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an AI Teaching Assistant. Help teachers with:
          - Teaching strategies
          - Lesson planning
          - Question generation
          - Student performance analysis
          - Educational advice
          Be professional, helpful, and specific.`
        },
        ...chatHistory.slice(-10),
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('AI API Error:', error);
    return "I'm sorry, I'm having trouble responding right now. Please try again later.";
  }
};