# Agent Concepts

This guide introduces the core concepts behind building agents with Claude and the Anthropic SDK.

## Table of Contents

- [What is an AI Agent?](#what-is-an-ai-agent)
- [Core Components](#core-components)
- [Agent Loop](#agent-loop)
- [Tools and Tool Use](#tools-and-tool-use)
- [Conversation History](#conversation-history)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## What is an AI Agent?

An AI agent is an autonomous system that can:

1. **Understand** complex instructions and goals
2. **Plan** a sequence of actions to achieve those goals
3. **Execute** actions using available tools
4. **Adapt** based on the results of previous actions
5. **Respond** with meaningful results

Unlike simple chatbots that just respond to messages, agents can:

- Use external tools and APIs
- Make decisions about which tools to use
- Chain multiple actions together
- Handle errors and retry operations
- Maintain context across multiple interactions

## Core Components

### 1. The Agent Class

The `ClaudeAgent` class is the heart of the system. It manages:

- **API Communication**: Handles requests to the Anthropic API
- **Tool Registry**: Keeps track of available tools
- **Conversation State**: Maintains message history
- **Retry Logic**: Implements exponential backoff for failures

```typescript
const agent = new ClaudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4096,
  temperature: 0.7,
});
```

### 2. Tools

Tools are functions that the agent can call to perform specific actions:

```typescript
export interface AgentTool {
  name: string;                    // Unique identifier
  description: string;             // What the tool does
  input_schema: object;            // JSON Schema for inputs
  execute: (input: any) => Promise<any>;  // Implementation
}
```

Tools enable agents to:

- Read and write files
- Make API calls
- Perform calculations
- Search the web
- Interact with databases
- Execute code
- And much more...

### 3. Messages

Messages represent the conversation between the user and the agent:

```typescript
interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

The agent maintains a history of all messages, which provides context for future interactions.

## Agent Loop

The agent operates in a loop, often called the "agent loop" or "ReAct loop":

```
1. Receive user message
2. Send message to Claude with available tools
3. Claude responds with either:
   a. A tool use request → Execute tool → Return to step 2
   b. A text response → Return to user
4. Continue conversation or end
```

### Example Flow

```
User: "Calculate 15 * 23 and search for that number's significance"

Agent → Claude: [message + tools: calculator, web_search]
Claude → Agent: [tool_use: calculator(15, 23)]
Agent → Tool: calculator.execute({operation: 'multiply', a: 15, b: 23})
Tool → Agent: {result: 345}
Agent → Claude: [tool_result: 345]
Claude → Agent: [tool_use: web_search('345 significance')]
Agent → Tool: web_search.execute({query: '345 significance'})
Tool → Agent: {results: [...]}
Agent → Claude: [tool_result: results]
Claude → Agent: [text: "The product is 345. Here's what I found..."]
Agent → User: "The product is 345. Here's what I found..."
```

## Tools and Tool Use

### Tool Definition

Every tool needs:

1. **Name**: A unique, descriptive identifier
2. **Description**: Tells Claude when and how to use the tool
3. **Input Schema**: JSON Schema defining expected parameters
4. **Execute Function**: The actual implementation

### Example Tool

```typescript
export const calculatorTool: AgentTool = {
  name: 'calculator',
  description: 'Performs basic mathematical calculations. Supports add, subtract, multiply, divide.',
  input_schema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: 'The mathematical operation to perform',
      },
      a: { type: 'number', description: 'The first number' },
      b: { type: 'number', description: 'The second number' },
    },
    required: ['operation', 'a', 'b'],
  },
  execute: async (input) => {
    const { operation, a, b } = input;
    switch (operation) {
      case 'add': return { result: a + b };
      case 'subtract': return { result: a - b };
      case 'multiply': return { result: a * b };
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        return { result: a / b };
    }
  },
};
```

### Tool Best Practices

1. **Clear Descriptions**: Help Claude understand when to use each tool
2. **Detailed Schemas**: Specify all parameters with descriptions
3. **Error Handling**: Always validate inputs and handle errors gracefully
4. **Atomicity**: Each tool should do one thing well
5. **Idempotency**: When possible, tools should be safe to retry

## Conversation History

The agent maintains a conversation history that:

- Provides context for multi-turn conversations
- Enables the agent to reference previous information
- Can be cleared when starting new tasks
- Can be inspected for debugging

```typescript
// Get history
const history = agent.getHistory();

// Clear history
agent.clearHistory();
```

### When to Clear History

- Starting a new, unrelated task
- When context is no longer relevant
- To save tokens on long conversations
- When you want a fresh start

## Error Handling

The agent implements several error handling strategies:

### 1. Retry with Exponential Backoff

```typescript
private async makeApiCallWithRetry(params: any): Promise<any> {
  for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
    try {
      return await this.client.messages.create(params);
    } catch (error) {
      if (this.isRetryableError(error)) {
        const delay = this.config.retryDelayMs * Math.pow(2, attempt);
        await this.sleep(delay);
      } else {
        throw error;
      }
    }
  }
}
```

### 2. Tool Error Handling

When a tool fails, the error is sent back to Claude:

```typescript
try {
  const result = await tool.execute(input);
  // Send success result
} catch (error) {
  // Send error result with is_error: true
  // Claude can then decide how to handle or retry
}
```

### 3. Retryable vs Non-Retryable Errors

**Retryable** (should retry):
- Rate limits (429)
- Server errors (500+)
- Timeouts
- Network issues

**Non-Retryable** (fail immediately):
- Invalid API key (401)
- Invalid request (400)
- Insufficient quota (403)

## Best Practices

### 1. System Prompts

Use system prompts to define the agent's role and behavior:

```typescript
const systemPrompt = `
You are a data analysis assistant.
Always use tools when they are available.
Provide clear, actionable insights.
Structure your reports with headings and bullet points.
`;

await agent.execute(userMessage, systemPrompt);
```

### 2. Tool Selection

Give Claude clear, descriptive tool definitions:

```typescript
// Good: Clear, specific description
description: 'Reads the contents of a file from the filesystem. Use this when you need to access file data.'

// Bad: Vague description
description: 'File operations'
```

### 3. Context Management

- Keep context relevant to the current task
- Clear history between unrelated tasks
- Use system prompts to reinforce behavior

### 4. Token Management

- Monitor token usage with `response.usage`
- Set appropriate `maxTokens` for your use case
- Consider clearing history for long conversations

### 5. Security

- Validate tool inputs
- Implement appropriate access controls
- Never expose sensitive data in tool descriptions
- Use environment variables for API keys

### 6. Testing

- Test tools independently before integrating
- Test with various input types and edge cases
- Monitor for unexpected tool usage patterns
- Log tool calls for debugging

## Next Steps

- Read [Workflow Design](./WORKFLOW-DESIGN.md) to learn about building complex workflows
- Check the [API Reference](./API-REFERENCE.md) for detailed API documentation
- Explore the examples in `/examples` directory
- Build your own tools and workflows

## Resources

- [Anthropic API Documentation](https://docs.anthropic.com)
- [Claude Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
