import * as dotenv from 'dotenv';
import { ClaudeAgent } from '../src/agent';
import { calculatorTool, webSearchTool } from '../src/tools';

// Load environment variables
dotenv.config();

/**
 * Simple Agent Example
 *
 * This example demonstrates the basics of creating and using a Claude agent:
 * - Initialize the agent with API key
 * - Register tools
 * - Execute a simple task
 * - Handle the response
 */

async function main() {
  // Get API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  console.log('=== Simple Agent Example ===\n');

  // Create the agent
  const agent = new ClaudeAgent({
    apiKey,
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 2048,
    temperature: 0.7,
  });

  console.log('Agent initialized successfully!\n');

  // Register tools
  agent.registerTools([calculatorTool, webSearchTool]);
  console.log('Tools registered: calculator, web_search\n');

  // Example 1: Using the calculator tool
  console.log('--- Example 1: Calculator Tool ---');
  const calculatorResponse = await agent.execute(
    'What is 157 multiplied by 23? Please use the calculator tool.'
  );

  console.log('Agent Response:', calculatorResponse.content);
  console.log('Tools Used:', calculatorResponse.toolsUsed);
  console.log('Tokens Used:', calculatorResponse.usage);
  console.log('');

  // Clear history between examples
  agent.clearHistory();

  // Example 2: Using the web search tool
  console.log('--- Example 2: Web Search Tool ---');
  const searchResponse = await agent.execute(
    'Search for information about TypeScript best practices and summarize the top 3 results.'
  );

  console.log('Agent Response:', searchResponse.content);
  console.log('Tools Used:', searchResponse.toolsUsed);
  console.log('Tokens Used:', searchResponse.usage);
  console.log('');

  // Clear history
  agent.clearHistory();

  // Example 3: Multi-tool usage
  console.log('--- Example 3: Multi-Tool Usage ---');
  const multiToolResponse = await agent.execute(
    'Calculate the sum of 45 and 67, then search for information about that number.'
  );

  console.log('Agent Response:', multiToolResponse.content);
  console.log('Tools Used:', multiToolResponse.toolsUsed);
  console.log('Tokens Used:', multiToolResponse.usage);
  console.log('');

  // Clear history
  agent.clearHistory();

  // Example 4: Using system prompt for specialized behavior
  console.log('--- Example 4: System Prompt ---');
  const systemPromptResponse = await agent.execute(
    'Calculate 100 divided by 4 and explain it.',
    'You are a math tutor. Always explain your calculations step by step in a way that a student can understand.'
  );

  console.log('Agent Response:', systemPromptResponse.content);
  console.log('Tools Used:', systemPromptResponse.toolsUsed);
  console.log('');

  // Example 5: Conversation history
  console.log('--- Example 5: Conversation History ---');
  await agent.execute('Calculate 50 + 25');
  const historyResponse = await agent.execute(
    'Now multiply that result by 2'
  );

  console.log('Agent Response:', historyResponse.content);
  console.log('Conversation History:');
  historyResponse.conversationHistory.forEach((msg, i) => {
    console.log(`${i + 1}. ${msg.role}: ${msg.content.substring(0, 100)}...`);
  });

  console.log('\n=== Example Complete ===');
}

// Run the example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
