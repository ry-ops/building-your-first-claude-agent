# Building Your First Claude Agent

A comprehensive, production-ready guide to building AI agents with Claude and the Anthropic SDK in TypeScript.

## Overview

This repository provides a complete framework for building autonomous AI agents powered by Claude. It includes:

- Production-ready agent implementation with error handling and retries
- Example tools for common operations (calculator, file I/O, web search)
- Multi-step workflow examples (data analysis, code review)
- Comprehensive documentation and API reference
- TypeScript throughout for type safety

## Quick Start

### Prerequisites

- Node.js 18 or higher
- An Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/ry-ops/building-your-first-claude-agent.git
cd building-your-first-claude-agent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Your First Agent

Create a simple agent in just a few lines:

```typescript
import { ClaudeAgent } from './src/agent';
import { calculatorTool } from './src/tools';

const agent = new ClaudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

agent.registerTool(calculatorTool);

const response = await agent.execute(
  'What is 157 multiplied by 23?'
);

console.log(response.content);
// "The product of 157 and 23 is 3,611."
```

### Run Examples

```bash
# Simple agent with tools
npm run example:simple

# Multi-step workflow
npm run example:workflow
```

## Core Concepts

### What is an AI Agent?

An AI agent is an autonomous system that can:

1. **Understand** complex instructions
2. **Plan** sequences of actions
3. **Execute** actions using tools
4. **Adapt** based on results
5. **Respond** with meaningful output

Unlike chatbots that just respond to messages, agents can use external tools, make decisions, and accomplish complex tasks autonomously.

### Agent Architecture

```
┌─────────────────────────────────────────┐
│           User Instruction              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│          Claude Agent                   │
│  - Conversation History                 │
│  - Tool Registry                        │
│  - Retry Logic                          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Anthropic API                   │
│  (Claude Model + Tool Use)              │
└──────────────┬──────────────────────────┘
               │
               ▼
        ┌──────┴──────┐
        │             │
        ▼             ▼
  ┌──────────┐  ┌──────────┐
  │  Tools   │  │ Response │
  └──────────┘  └──────────┘
        │
        └─────────────┐
                      │
                      ▼
              ┌──────────────┐
              │ Tool Results │
              └──────────────┘
                      │
                      └─────► (back to Claude)
```

### The Agent Loop

1. User sends a message
2. Agent forwards to Claude with available tools
3. Claude responds with either:
   - A tool use request → Execute tool → Return to step 2
   - A text response → Return to user

This loop continues until Claude has the information needed to respond.

### Tools

Tools are functions that agents can call:

- **File operations**: Read, write, list files
- **Calculations**: Math operations
- **Web interactions**: Search, API calls
- **Code execution**: Run scripts, commands
- **Data processing**: Transform, analyze data

Each tool has:
- **Name**: Unique identifier
- **Description**: When and how to use it
- **Input Schema**: Expected parameters
- **Execute Function**: Implementation

## Project Structure

```
building-your-first-claude-agent/
├── src/
│   ├── agent.ts              # Core agent implementation
│   ├── tools/                # Tool implementations
│   │   ├── calculator.ts     # Math operations
│   │   ├── file-operations.ts # File I/O
│   │   ├── web-search.ts     # Web search (simulated)
│   │   └── index.ts
│   └── workflows/            # Example workflows
│       ├── data-analysis.ts  # Data analysis workflow
│       ├── code-review.ts    # Code review workflow
│       └── index.ts
├── examples/
│   ├── simple-agent.ts       # Basic agent usage
│   └── multi-step-workflow.ts # Complex workflow
├── documentation/
│   ├── AGENT-CONCEPTS.md     # Core concepts
│   ├── WORKFLOW-DESIGN.md    # Workflow patterns
│   └── API-REFERENCE.md      # Complete API docs
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

## Features

### Production-Ready Agent

- **Automatic retries** with exponential backoff
- **Error handling** for API failures and tool errors
- **Conversation history** management
- **Token usage** tracking
- **Type safety** with TypeScript

### Example Tools

1. **Calculator**: Basic math operations
2. **File Operations**: Read, write, list files
3. **Web Search**: Simulated search (integrate real APIs)

### Example Workflows

1. **Data Analysis**: Read data, analyze, generate reports
2. **Code Review**: Review code, identify issues, suggest improvements

### Comprehensive Documentation

- **Agent Concepts**: Understanding agent architecture
- **Workflow Design**: Building multi-step workflows
- **API Reference**: Complete API documentation

## Usage Examples

### Simple Calculator

```typescript
import { ClaudeAgent } from './src/agent';
import { calculatorTool } from './src/tools';

const agent = new ClaudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

agent.registerTool(calculatorTool);

const response = await agent.execute(
  'Calculate the sum of 456 and 789, then multiply by 2'
);
```

### File Operations

```typescript
import { ClaudeAgent } from './src/agent';
import { readFileTool, writeFileTool } from './src/tools';

const agent = new ClaudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

agent.registerTools([readFileTool, writeFileTool]);

await agent.execute(`
  Read the data from ./input.json,
  process it, and write the results to ./output.json
`);
```

### Data Analysis Workflow

```typescript
import { DataAnalysisWorkflow } from './src/workflows';

const workflow = new DataAnalysisWorkflow({
  apiKey: process.env.ANTHROPIC_API_KEY,
  inputFilePath: './data/sales.json',
  outputFilePath: './data/report.md',
});

const result = await workflow.execute();
console.log(result.analysis);
```

### Code Review Workflow

```typescript
import { CodeReviewWorkflow } from './src/workflows';

const workflow = new CodeReviewWorkflow({
  apiKey: process.env.ANTHROPIC_API_KEY,
  targetPath: './src',
  outputPath: './review.md',
  reviewCriteria: [
    'Code quality and readability',
    'Security vulnerabilities',
    'Performance issues',
  ],
});

const result = await workflow.execute();
console.log(`Found ${result.issues.length} issues`);
```

### Custom Tools

Create your own tools easily:

```typescript
import { AgentTool } from './src/agent';

const timestampTool: AgentTool = {
  name: 'get_timestamp',
  description: 'Returns the current timestamp',
  input_schema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['iso', 'unix'],
        description: 'Timestamp format',
      },
    },
    required: ['format'],
  },
  execute: async (input) => {
    if (input.format === 'iso') {
      return { timestamp: new Date().toISOString() };
    } else {
      return { timestamp: Date.now() };
    }
  },
};

agent.registerTool(timestampTool);
```

## Advanced Features

### System Prompts

Guide agent behavior with system prompts:

```typescript
const response = await agent.execute(
  'Review this code for security issues',
  `You are a security expert specializing in web application security.
   Focus on common vulnerabilities like SQL injection, XSS, and CSRF.
   Provide specific, actionable recommendations.`
);
```

### Conversation History

Maintain context across multiple turns:

```typescript
// First turn
await agent.execute('Calculate 50 + 25');

// Second turn - references previous calculation
const response = await agent.execute(
  'Now multiply that result by 3'
);

// Clear history when starting new task
agent.clearHistory();
```

### Error Handling

Robust error handling with retries:

```typescript
const agent = new ClaudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 5,           // Retry up to 5 times
  retryDelayMs: 2000,      // Start with 2s delay
});

try {
  const response = await agent.execute('Your task');
} catch (error) {
  if (error.status === 429) {
    console.error('Rate limited');
  } else {
    console.error('Failed:', error.message);
  }
}
```

## Documentation

- **[Agent Concepts](./documentation/AGENT-CONCEPTS.md)**: Learn the fundamentals of agent architecture
- **[Workflow Design](./documentation/WORKFLOW-DESIGN.md)**: Design complex multi-step workflows
- **[API Reference](./documentation/API-REFERENCE.md)**: Complete API documentation

## Best Practices

### 1. Clear Tool Descriptions

```typescript
// Good: Clear and specific
description: 'Reads the contents of a file. Use when you need to access file data.'

// Bad: Vague
description: 'File stuff'
```

### 2. Validate Tool Inputs

```typescript
execute: async (input) => {
  if (!input.file_path) {
    throw new Error('file_path is required');
  }
  if (!fs.existsSync(input.file_path)) {
    throw new Error('File not found');
  }
  // ... proceed with execution
}
```

### 3. Use System Prompts

```typescript
const systemPrompt = `
You are a professional data analyst.
Always use tools when available.
Format reports with clear sections.
`;

await agent.execute(userMessage, systemPrompt);
```

### 4. Monitor Token Usage

```typescript
const response = await agent.execute(message);
console.log(`Tokens: ${response.usage?.inputTokens} in, ${response.usage?.outputTokens} out`);
```

### 5. Handle Errors Gracefully

```typescript
try {
  await workflow.execute();
} catch (error) {
  console.error('Workflow failed:', error);
  // Implement recovery logic
}
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
ANTHROPIC_API_KEY=your_api_key_here

# Optional
MODEL_NAME=claude-sonnet-4-5-20250929
MAX_TOKENS=4096
TEMPERATURE=0.7
MAX_RETRIES=3
RETRY_DELAY_MS=1000
```

## Building and Running

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run examples
npm run example:simple
npm run example:workflow

# Development mode
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see [LICENSE](./LICENSE) for details.

Copyright (c) 2026 ry-ops

## Resources

- [Anthropic API Documentation](https://docs.anthropic.com)
- [Claude Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)
- [TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)

## Support

For issues and questions:

- Open an issue on GitHub
- Check the [documentation](./documentation/)
- Review the [examples](./examples/)

## Roadmap

Future enhancements:

- [ ] More example tools (database, email, etc.)
- [ ] Streaming responses
- [ ] Multi-agent systems
- [ ] Advanced workflow patterns
- [ ] Testing framework
- [ ] Performance benchmarks

---

Built with Claude Sonnet 4.5 by ry-ops
