export interface ChatCompletionMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatCompletionOptions {
    model: string;
    messages: ChatCompletionMessage[];
    maxTokens?: number;
    temperature?: number;
}

export interface ChatCompletionResult {
    content: string;
}

export interface AIProvider {
    readonly id: string;
    readonly name: string;
    chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
}
