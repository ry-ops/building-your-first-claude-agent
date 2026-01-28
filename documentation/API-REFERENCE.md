# API Reference

Complete API documentation for the Claude Agent framework.

## Table of Contents

- [ClaudeAgent](#claudeagent)
- [Interfaces](#interfaces)
- [Tools](#tools)
- [Workflows](#workflows)
- [Type Definitions](#type-definitions)

## ClaudeAgent

The main agent class that orchestrates interactions with Claude.

### Constructor

```typescript
new ClaudeAgent(config: AgentConfig)
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| config | `AgentConfig` | Yes | Agent configuration object |

**Example:**

```typescript
const agent = new ClaudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4096,
  temperature: 0.7,
  maxRetries: 3,
  retryDelayMs: 1000,
});
```

### Methods

#### `registerTool()`

Register a single tool with the agent.

```typescript
registerTool(tool: AgentTool): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| tool | `AgentTool` | Yes | The tool to register |

**Example:**

```typescript
agent.registerTool(calculatorTool);
```

---

#### `registerTools()`

Register multiple tools at once.

```typescript
registerTools(tools: AgentTool[]): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| tools | `AgentTool[]` | Yes | Array of tools to register |

**Example:**

```typescript
agent.registerTools([
  calculatorTool,
  webSearchTool,
  readFileTool,
]);
```

---

#### `execute()`

Execute a message with the agent.

```typescript
execute(
  userMessage: string,
  systemPrompt?: string
): Promise<AgentResponse>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| userMessage | `string` | Yes | The user's message/instruction |
| systemPrompt | `string` | No | Optional system prompt to guide behavior |

**Returns:** `Promise<AgentResponse>`

**Example:**

```typescript
const response = await agent.execute(
  'Calculate 15 * 23',
  'You are a helpful math tutor.'
);

console.log(response.content);
console.log(response.toolsUsed);
console.log(response.usage);
```

---

#### `clearHistory()`

Clear the conversation history.

```typescript
clearHistory(): void
```

**Example:**

```typescript
agent.clearHistory();
```

---

#### `getHistory()`

Get the current conversation history.

```typescript
getHistory(): MessageParam[]
```

**Returns:** `MessageParam[]`

**Example:**

```typescript
const history = agent.getHistory();
console.log(`Conversation has ${history.length} messages`);
```

## Interfaces

### AgentConfig

Configuration options for creating an agent.

```typescript
interface AgentConfig {
  apiKey: string;         // Anthropic API key (required)
  model?: string;         // Model name (default: claude-sonnet-4-5-20250929)
  maxTokens?: number;     // Max tokens per request (default: 4096)
  temperature?: number;   // Response randomness 0-1 (default: 0.7)
  maxRetries?: number;    // Max retry attempts (default: 3)
  retryDelayMs?: number;  // Base retry delay in ms (default: 1000)
}
```

**Defaults:**

```typescript
{
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4096,
  temperature: 0.7,
  maxRetries: 3,
  retryDelayMs: 1000,
}
```

---

### AgentTool

Interface for defining tools that agents can use.

```typescript
interface AgentTool extends Tool {
  name: string;
  description: string;
  input_schema: object;
  execute: (input: any) => Promise<any>;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| name | `string` | Unique identifier for the tool |
| description | `string` | Description of what the tool does |
| input_schema | `object` | JSON Schema defining input parameters |
| execute | `function` | Async function that executes the tool |

**Example:**

```typescript
const myTool: AgentTool = {
  name: 'my_tool',
  description: 'Does something useful',
  input_schema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'First parameter' },
      param2: { type: 'number', description: 'Second parameter' },
    },
    required: ['param1'],
  },
  execute: async (input) => {
    // Implementation
    return { result: 'success' };
  },
};
```

---

### AgentMessage

Represents a message in the conversation.

```typescript
interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| role | `'user' \| 'assistant'` | Who sent the message |
| content | `string` | Message content |

---

### AgentResponse

Response object returned from `agent.execute()`.

```typescript
interface AgentResponse {
  content: string;
  toolsUsed: string[];
  conversationHistory: AgentMessage[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| content | `string` | The agent's text response |
| toolsUsed | `string[]` | Names of tools that were called |
| conversationHistory | `AgentMessage[]` | Full conversation history |
| usage | `object` | Token usage statistics (optional) |

**Example:**

```typescript
const response = await agent.execute('Calculate 10 + 5');

console.log(response.content);
// "The sum of 10 and 5 is 15."

console.log(response.toolsUsed);
// ["calculator"]

console.log(response.usage);
// { inputTokens: 123, outputTokens: 45 }
```

## Tools

### Calculator Tool

Performs basic mathematical operations.

```typescript
import { calculatorTool } from './src/tools';

agent.registerTool(calculatorTool);
```

**Operations:**
- `add`: Addition
- `subtract`: Subtraction
- `multiply`: Multiplication
- `divide`: Division

**Input Schema:**

```typescript
{
  operation: 'add' | 'subtract' | 'multiply' | 'divide',
  a: number,
  b: number,
}
```

**Example Usage:**

```typescript
const response = await agent.execute('What is 25 multiplied by 4?');
```

---

### Web Search Tool

Simulated web search functionality.

```typescript
import { webSearchTool } from './src/tools';

agent.registerTool(webSearchTool);
```

**Input Schema:**

```typescript
{
  query: string,
  max_results?: number,  // default: 5
}
```

**Example Usage:**

```typescript
const response = await agent.execute(
  'Search for TypeScript best practices'
);
```

**Note:** This is a simulated tool. In production, integrate with real search APIs like Google Custom Search or SerpAPI.

---

### File Operations Tools

Tools for reading, writing, and listing files.

```typescript
import {
  readFileTool,
  writeFileTool,
  listDirectoryTool,
} from './src/tools';

agent.registerTools([
  readFileTool,
  writeFileTool,
  listDirectoryTool,
]);
```

#### Read File Tool

Reads content from a file.

**Input Schema:**

```typescript
{
  file_path: string,
}
```

**Example:**

```typescript
const response = await agent.execute(
  'Read the file at ./data/config.json'
);
```

#### Write File Tool

Writes content to a file.

**Input Schema:**

```typescript
{
  file_path: string,
  content: string,
}
```

**Example:**

```typescript
const response = await agent.execute(
  'Write "Hello World" to ./output.txt'
);
```

#### List Directory Tool

Lists contents of a directory.

**Input Schema:**

```typescript
{
  directory_path: string,
}
```

**Example:**

```typescript
const response = await agent.execute(
  'List all files in ./src directory'
);
```

## Workflows

### DataAnalysisWorkflow

Orchestrates data analysis tasks.

```typescript
import { DataAnalysisWorkflow } from './src/workflows';

const workflow = new DataAnalysisWorkflow({
  apiKey: process.env.ANTHROPIC_API_KEY,
  inputFilePath: './data/input.json',
  outputFilePath: './data/report.md',
});

const result = await workflow.execute();
```

**Configuration:**

```typescript
interface DataAnalysisConfig {
  apiKey: string;
  inputFilePath: string;
  outputFilePath: string;
}
```

**Methods:**

#### `execute()`

Execute the standard data analysis workflow.

```typescript
execute(): Promise<{
  analysis: string;
  outputPath: string;
  tokensUsed: { input: number; output: number };
}>
```

#### `executeCustom()`

Execute with custom analysis instructions.

```typescript
executeCustom(customInstructions: string): Promise<string>
```

**Example:**

```typescript
const result = await workflow.executeCustom(
  'Focus on sales trends and identify seasonal patterns.'
);
```

---

### CodeReviewWorkflow

Automates code review processes.

```typescript
import { CodeReviewWorkflow } from './src/workflows';

const workflow = new CodeReviewWorkflow({
  apiKey: process.env.ANTHROPIC_API_KEY,
  targetPath: './src',
  outputPath: './review-report.md',
  reviewCriteria: [
    'Code quality',
    'Security',
    'Performance',
  ],
});

const result = await workflow.execute();
```

**Configuration:**

```typescript
interface CodeReviewConfig {
  apiKey: string;
  targetPath: string;
  outputPath?: string;
  reviewCriteria?: string[];
}
```

**Return Type:**

```typescript
interface CodeReviewResult {
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
  tokensUsed: { input: number; output: number };
}

interface ReviewIssue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  location?: string;
}
```

**Methods:**

#### `execute()`

Execute the full code review workflow.

```typescript
execute(): Promise<CodeReviewResult>
```

#### `reviewFile()`

Review a specific file with custom focus areas.

```typescript
reviewFile(
  filePath: string,
  focusAreas: string[]
): Promise<string>
```

**Example:**

```typescript
const review = await workflow.reviewFile(
  './src/agent.ts',
  ['Error handling', 'TypeScript best practices']
);
```

## Type Definitions

### Common Types

```typescript
// Message parameter type from Anthropic SDK
type MessageParam = {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
};

// Content block types
type ContentBlock =
  | TextBlock
  | ToolUseBlock
  | ToolResultBlock;

interface TextBlock {
  type: 'text';
  text: string;
}

interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: any;
}

interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}
```

### Error Types

```typescript
// API errors are thrown as Error objects
// Check error.status for HTTP status codes

try {
  await agent.execute(message);
} catch (error) {
  if (error.status === 401) {
    console.error('Invalid API key');
  } else if (error.status === 429) {
    console.error('Rate limit exceeded');
  } else if (error.status >= 500) {
    console.error('Server error');
  }
}
```

## Usage Examples

### Basic Agent Usage

```typescript
import { ClaudeAgent } from './src/agent';
import { calculatorTool } from './src/tools';

const agent = new ClaudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

agent.registerTool(calculatorTool);

const response = await agent.execute(
  'Calculate 123 * 456 and explain the result'
);

console.log(response.content);
```

### Multi-Tool Workflow

```typescript
import { ClaudeAgent } from './src/agent';
import {
  readFileTool,
  writeFileTool,
  calculatorTool,
} from './src/tools';

const agent = new ClaudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxTokens: 8192,
});

agent.registerTools([
  readFileTool,
  writeFileTool,
  calculatorTool,
]);

const response = await agent.execute(`
  Read sales data from ./data/sales.json,
  calculate the total revenue,
  and write a summary to ./data/summary.txt
`);
```

### Custom Tool Creation

```typescript
import { AgentTool } from './src/agent';

const customTool: AgentTool = {
  name: 'timestamp',
  description: 'Returns the current timestamp in ISO format',
  input_schema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    return {
      timestamp: new Date().toISOString(),
    };
  },
};

agent.registerTool(customTool);

const response = await agent.execute('What is the current timestamp?');
```

### Error Handling

```typescript
import { ClaudeAgent } from './src/agent';

const agent = new ClaudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 5,
  retryDelayMs: 2000,
});

try {
  const response = await agent.execute('Your prompt here');
  console.log(response.content);
} catch (error) {
  if (error.status === 429) {
    console.error('Rate limited. Try again later.');
  } else if (error.status === 401) {
    console.error('Invalid API key.');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Environment Variables

Required environment variables:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

Optional environment variables:

```bash
MODEL_NAME=claude-sonnet-4-5-20250929
MAX_TOKENS=4096
TEMPERATURE=0.7
MAX_RETRIES=3
RETRY_DELAY_MS=1000
```

## Resources

- [Anthropic API Documentation](https://docs.anthropic.com)
- [TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)
- [Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)
