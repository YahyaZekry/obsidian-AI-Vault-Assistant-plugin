import { AIProvider } from './AIProvider';
import { PerplexityProvider } from './PerplexityProvider';

export function createProvider(providerId: string, apiKey: string): AIProvider {
    switch (providerId) {
        case 'perplexity':
            return new PerplexityProvider(apiKey);
        default:
            throw new Error(`Unknown AI provider: ${providerId}`);
    }
}
