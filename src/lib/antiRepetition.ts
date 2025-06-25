/**
 * Anti-repetition utilities for the Echo AI companion
 * Prevents Echo from repeating the same responses
 */
import { unifiedAIService } from './unifiedAIService';

// Cache of recent responses to avoid repetition
const recentResponses: string[] = [];
const CACHE_SIZE = 10;

/**
 * Checks if a new response is too similar to recent ones
 * @param response The response to check
 * @returns True if the response is a repetition
 */
export function isRepetitive(response: string): boolean {
  // Short responses are likely generic greetings, don't consider them repetitive
  if (response.length < 15) return false;

  // Check for high similarity with recent responses
  return recentResponses.some(cached => {
    // Exact match
    if (cached === response) return true;

    // Significant overlap (contains a large chunk of previous response)
    if (cached.length > 20 && response.length > 20) {
      // Check if response contains more than 70% of a previous response
      const chunk = cached.substring(0, Math.floor(cached.length * 0.7));
      if (response.includes(chunk)) return true;
    }

    return false;
  });
}

/**
 * Adds a response to the recent responses cache
 * @param response Response to cache
 */
export function cacheResponse(response: string): void {
  // Add to the beginning
  recentResponses.unshift(response);

  // Keep cache size managed
  if (recentResponses.length > CACHE_SIZE) {
    recentResponses.pop();
  }
}

/**
 * Generates a non-repetitive alternative response
 * @param originalText Original repetitive response
 * @returns Fresh alternative response
 */
export async function generateAlternativeResponse(
  originalText: string
): Promise<string> {
  try {
    // Get a fresh response from the unified AI service
    const alternativeText = await unifiedAIService.processTextWithGemini(
      "Please provide a different response than before. Here's what you said previously that I want to avoid repeating: " +
        originalText.substring(0, 100) +
        '... Make your new response feel fresh and different.',
      true
    );

    if (!alternativeText || isRepetitive(alternativeText)) {
      // If still repetitive, use a simple alternative
      return "I think I've mentioned this before. Let me look at this differently...";
    }

    return alternativeText;
  } catch (error) {
    console.error('Error generating alternative response:', error);
    return 'Let me consider this from a different perspective...';
  }
}
