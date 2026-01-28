import Anthropic from '@anthropic-ai/sdk';
import { MessageParam, Tool } from '@anthropic-ai/sdk/resources';

export interface AgentConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface AgentTool extends Tool {
  execute: (input: any) => Promise<any>;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  content: string;
  toolsUsed: string[];
  conversationHistory: AgentMessage[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class ClaudeAgent {
  private client: Anthropic;
  private config: Required<AgentConfig>;
  private tools: Map<string, AgentTool>;
  private conversationHistory: MessageParam[];

  constructor(config: AgentConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'claude-sonnet-4-5-20250929',
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 1000,
    };
    this.tools = new Map();
    this.conversationHistory = [];
  }

  /**
   * Register a tool that the agent can use
   */
  registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools at once
   */
  registerTools(tools: AgentTool[]): void {
    tools.forEach((tool) => this.registerTool(tool));
  }

  /**
   * Execute a single message with the agent
   */
  async execute(userMessage: string, systemPrompt?: string): Promise<AgentResponse> {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const toolsUsed: string[] = [];
    let currentMessages = [...this.conversationHistory];
    let continueLoop = true;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    while (continueLoop) {
      const response = await this.makeApiCallWithRetry({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: currentMessages,
        tools: this.tools.size > 0 ? this.getToolDefinitions() : undefined,
      });

      if (response.usage) {
        totalInputTokens += response.usage.input_tokens;
        totalOutputTokens += response.usage.output_tokens;
      }

      // Check if the model wants to use tools
      const toolUseBlock = response.content.find(
        (block) => block.type === 'tool_use'
      );

      if (toolUseBlock && toolUseBlock.type === 'tool_use') {
        // Execute the tool
        const tool = this.tools.get(toolUseBlock.name);
        if (!tool) {
          throw new Error(`Tool ${toolUseBlock.name} not found`);
        }

        toolsUsed.push(toolUseBlock.name);

        try {
          const toolResult = await tool.execute(toolUseBlock.input);

          // Add assistant message with tool use
          currentMessages.push({
            role: 'assistant',
            content: response.content,
          });

          // Add tool result
          currentMessages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify(toolResult),
              },
            ],
          });
        } catch (error) {
          // Handle tool execution error
          currentMessages.push({
            role: 'assistant',
            content: response.content,
          });

          currentMessages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify({
                  error: error instanceof Error ? error.message : 'Unknown error',
                }),
                is_error: true,
              },
            ],
          });
        }
      } else {
        // No more tools to use, extract final response
        continueLoop = false;

        const textBlock = response.content.find((block) => block.type === 'text');
        const finalResponse = textBlock && textBlock.type === 'text' ? textBlock.text : '';

        // Add final assistant message to history
        this.conversationHistory.push({
          role: 'assistant',
          content: finalResponse,
        });

        return {
          content: finalResponse,
          toolsUsed,
          conversationHistory: this.getFormattedHistory(),
          usage: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
          },
        };
      }
    }

    // Fallback return (should not reach here)
    return {
      content: '',
      toolsUsed,
      conversationHistory: this.getFormattedHistory(),
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      },
    };
  }

  /**
   * Make API call with exponential backoff retry logic
   */
  private async makeApiCallWithRetry(
    params: Anthropic.MessageCreateParams
  ): Promise<Anthropic.Message> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await this.client.messages.create(params);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Check if error is retryable
        if (this.isRetryableError(error)) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt);
          console.warn(
            `API call failed (attempt ${attempt + 1}/${this.config.maxRetries}). Retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        } else {
          // Non-retryable error, throw immediately
          throw error;
        }
      }
    }

    throw new Error(
      `API call failed after ${this.config.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on rate limits, timeouts, and server errors
    if (error?.status) {
      return error.status === 429 || error.status >= 500;
    }
    return false;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get tool definitions in the format expected by the API
   */
  private getToolDefinitions(): Tool[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));
  }

  /**
   * Get formatted conversation history
   */
  private getFormattedHistory(): AgentMessage[] {
    return this.conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }));
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get current conversation history
   */
  getHistory(): MessageParam[] {
    return [...this.conversationHistory];
  }
}
