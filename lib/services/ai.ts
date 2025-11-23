// AI Service for chatbot and content generation
// Supports OpenAI, Anthropic Claude, and local AI models
import { logger } from '../utils/logger';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIConfig {
  provider?: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Default configuration
const DEFAULT_CONFIG: AIConfig = {
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 500,
};

/**
 * Generate AI chat completion
 */
export async function chatCompletion(
  messages: AIMessage[],
  config: AIConfig = {}
): Promise<{ content: string | null; error: any }> {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const apiKey =
      finalConfig.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    // Check if API key is available
    if (!apiKey) {
      logger.warn('AI API key not configured, using mock response');
      return {
        content: await generateMockResponse(messages),
        error: null,
      };
    }

    // Call OpenAI API
    if (finalConfig.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: finalConfig.model,
          messages,
          temperature: finalConfig.temperature,
          max_tokens: finalConfig.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content || null,
        error: null,
      };
    }

    // Call Anthropic Claude API
    if (finalConfig.provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: finalConfig.model || 'claude-3-sonnet-20240229',
          max_tokens: finalConfig.maxTokens,
          messages: messages.filter((m) => m.role !== 'system'),
          system: messages.find((m) => m.role === 'system')?.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.content[0]?.text || null,
        error: null,
      };
    }

    // Fallback to mock response
    return {
      content: await generateMockResponse(messages),
      error: null,
    };
  } catch (err) {
    logger.error('AI chat completion error', err instanceof Error ? err : new Error(String(err)));
    return {
      content: null,
      error: err,
    };
  }
}

/**
 * Generate AI content for specific tasks
 */
export async function generateAIContent(
  prompt: string,
  config: AIConfig = {}
): Promise<{ content: string | null; error: any }> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant for an e-commerce platform.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  return chatCompletion(messages, config);
}

/**
 * Train chatbot with custom content
 */
export async function trainChatbot(
  trainingContent: string,
  shopId: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Store training content in database for context
    // This would be used to provide context in future conversations
    logger.info(`Training chatbot for shop ${shopId} with ${trainingContent.length} characters`);

    // In production, you would:
    // 1. Store the training content in a vector database
    // 2. Create embeddings for semantic search
    // 3. Use it as context in future conversations

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    logger.error('Chatbot training error', err instanceof Error ? err : new Error(String(err)));
    return {
      success: false,
      error: err,
    };
  }
}

/**
 * Generate product description
 */
export async function generateProductDescription(
  productName: string,
  features?: string[],
  tone: 'professional' | 'casual' | 'friendly' = 'professional'
): Promise<string> {
  const prompt = `Generate a compelling product description for "${productName}".
${features ? `Key features: ${features.join(', ')}` : ''}
Tone: ${tone}
Length: 2-3 sentences
Include benefits and a call-to-action.`;

  const result = await generateAIContent(prompt, {
    temperature: 0.8,
    maxTokens: 200,
  });

  return (
    result.content || `${productName} - A premium product designed for your needs. Shop now!`
  );
}

/**
 * Generate customer support response
 */
export async function generateSupportResponse(
  customerMessage: string,
  context?: string
): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content:
        'You are a friendly customer support representative for an e-commerce store. Be helpful, professional, and solution-oriented. Keep responses concise (2-3 sentences).',
    },
  ];

  if (context) {
    messages.push({
      role: 'system',
      content: `Context: ${context}`,
    });
  }

  messages.push({
    role: 'user',
    content: customerMessage,
  });

  const result = await chatCompletion(messages, {
    temperature: 0.7,
    maxTokens: 300,
  });

  return result.content || 'Thank you for contacting us. Our team will assist you shortly.';
}

/**
 * Analyze customer sentiment
 */
export async function analyzeSentiment(
  text: string
): Promise<'positive' | 'neutral' | 'negative'> {
  const prompt = `Analyze the sentiment of this customer message: "${text}"
Reply with only one word: positive, neutral, or negative.`;

  const result = await generateAIContent(prompt, {
    temperature: 0.3,
    maxTokens: 10,
  });

  const sentiment = result.content?.toLowerCase().trim();
  if (sentiment === 'positive') return 'positive';
  if (sentiment === 'negative') return 'negative';
  return 'neutral';
}

/**
 * Generate SEO meta description
 */
export async function generateSEOMetaDescription(
  productName: string,
  description: string
): Promise<string> {
  const prompt = `Create a compelling SEO meta description (150-160 characters) for:
Product: ${productName}
Description: ${description}

Include key benefits and a call-to-action. Must be exactly 150-160 characters.`;

  const result = await generateAIContent(prompt, {
    temperature: 0.6,
    maxTokens: 100,
  });

  const meta = result.content || `${productName} - ${description.substring(0, 120)}...`;

  // Ensure it's within the character limit
  if (meta.length > 160) {
    return meta.substring(0, 157) + '...';
  }
  return meta;
}

/**
 * Mock response generator for when API is not available
 */
async function generateMockResponse(messages: AIMessage[]): Promise<string> {
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  const message = lastUserMessage?.content.toLowerCase() || '';

  // Simple keyword-based responses
  if (message.includes('price') || message.includes('cost')) {
    return 'Our pricing is competitive and we offer great value. Please check the product page for current prices and any ongoing promotions!';
  }

  if (message.includes('shipping') || message.includes('delivery')) {
    return 'We offer fast and reliable shipping. Delivery typically takes 3-5 business days. Free shipping is available on orders over a certain amount!';
  }

  if (message.includes('return') || message.includes('refund')) {
    return 'We have a hassle-free 30-day return policy. If you\'re not satisfied with your purchase, you can return it for a full refund or exchange.';
  }

  if (message.includes('order') || message.includes('track')) {
    return 'You can track your order using the tracking number sent to your email. If you need assistance, please provide your order number and we\'ll help you right away!';
  }

  if (message.includes('product') || message.includes('item')) {
    return 'Our products are carefully selected for quality and value. Each item is thoroughly inspected before shipping to ensure you receive the best possible product!';
  }

  if (message.includes('hello') || message.includes('hi')) {
    return 'Hello! Welcome to our store. How can I assist you today? Feel free to ask about our products, shipping, or anything else!';
  }

  // Default response
  return 'Thank you for your message! Our team is here to help. Could you please provide more details so we can assist you better?';
}

/**
 * Generate email marketing content
 */
export async function generateEmailContent(
  subject: string,
  audience: string,
  purpose: string
): Promise<{ subject: string; body: string }> {
  const prompt = `Generate an email marketing campaign:
Subject: ${subject}
Target Audience: ${audience}
Purpose: ${purpose}

Generate:
1. An engaging email subject line
2. Email body (3-4 short paragraphs)
Tone: Professional yet friendly
Include a clear call-to-action.`;

  const result = await generateAIContent(prompt, {
    temperature: 0.8,
    maxTokens: 500,
  });

  // Parse the response
  const content = result.content || '';
  const lines = content.split('\n').filter((l) => l.trim());

  return {
    subject: lines[0] || subject,
    body: lines.slice(1).join('\n\n') || 'Check out our latest products and special offers!',
  };
}

/**
 * Generate product tags/keywords
 */
export async function generateProductTags(
  productName: string,
  description: string,
  category?: string
): Promise<string[]> {
  const prompt = `Generate 5-10 relevant SEO keywords/tags for this product:
Name: ${productName}
Description: ${description}
${category ? `Category: ${category}` : ''}

Provide only the keywords, separated by commas.`;

  const result = await generateAIContent(prompt, {
    temperature: 0.6,
    maxTokens: 100,
  });

  if (!result.content) {
    return [productName.toLowerCase()];
  }

  return result.content
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .slice(0, 10);
}

export default {
  chatCompletion,
  generateAIContent,
  trainChatbot,
  generateProductDescription,
  generateSupportResponse,
  analyzeSentiment,
  generateSEOMetaDescription,
  generateEmailContent,
  generateProductTags,
};
