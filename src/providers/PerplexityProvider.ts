import { requestUrl } from 'obsidian';
import { AIProvider, ChatCompletionOptions, ChatCompletionResult } from './AIProvider';

export class PerplexityProvider implements AIProvider {
    readonly id = 'perplexity';
    readonly name = 'Perplexity AI';

    constructor(private apiKey: string) {}

    async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
        const response = await requestUrl({
            url: 'https://api.perplexity.ai/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: options.model,
                messages: options.messages,
                max_tokens: options.maxTokens ?? 4000,
                temperature: options.temperature ?? 0.1
            })
        });

        if (response.status !== 200) {
            throw new Error(`Perplexity API error (${response.status}): ${response.text}`);
        }

        return { content: response.json.choices[0].message.content };
    }
}
