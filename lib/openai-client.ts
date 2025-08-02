import OpenAI from 'openai';

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
const hasValidApiKey = apiKey && apiKey !== 'dummy-key-for-development' && apiKey.startsWith('sk-');

const openai = hasValidApiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true
}) : null;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIClient {
  private messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a friendly AI assistant designed for children. Keep responses simple, positive, and age-appropriate. Use encouraging language and be helpful with learning and play.'
    }
  ];

  async getChatCompletion(userMessage: string): Promise<string> {
    try {
      // Check if OpenAI is available
      if (!openai || !hasValidApiKey) {
        return "I'm sorry, but I need a valid OpenAI API key to respond. Please add your API key to the environment variables to enable AI responses.";
      }

      const startTime = performance.now();
      
      this.messages.push({ role: 'user', content: userMessage });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: this.messages,
        max_tokens: 150,
        temperature: 0.7,
      });

      const assistantMessage = completion.choices[0]?.message?.content || 'Sorry, I didn\'t understand that.';
      
      this.messages.push({ role: 'assistant', content: assistantMessage });

      // Keep conversation history manageable
      if (this.messages.length > 20) {
        this.messages = [this.messages[0], ...this.messages.slice(-19)];
      }

      const processingTime = performance.now() - startTime;
      console.log(`OpenAI API response time: ${processingTime.toFixed(2)}ms`);

      return assistantMessage;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  clearHistory(): void {
    this.messages = [this.messages[0]]; // Keep system message
  }

  getHistory(): ChatMessage[] {
    return [...this.messages];
  }
}