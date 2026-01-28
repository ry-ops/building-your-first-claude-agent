import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ClaudeAgent } from '../src/agent';
import { readFileTool, writeFileTool, calculatorTool } from '../src/tools';

// Load environment variables
dotenv.config();

/**
 * Multi-Step Workflow Example
 *
 * This example demonstrates a complex, multi-step workflow:
 * 1. Create sample data
 * 2. Read and process the data
 * 3. Perform calculations
 * 4. Generate a report
 * 5. Save results
 *
 * This showcases how an agent can orchestrate multiple tools
 * to accomplish a complex task autonomously.
 */

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  console.log('=== Multi-Step Workflow Example ===\n');

  // Setup: Create a temporary directory for our workflow
  const workDir = path.join(process.cwd(), 'temp-workflow');
  await fs.mkdir(workDir, { recursive: true });
  console.log(`Working directory: ${workDir}\n`);

  // Step 1: Create sample data
  console.log('Step 1: Creating sample sales data...');
  const sampleData = {
    sales: [
      { month: 'January', revenue: 45000, expenses: 32000 },
      { month: 'February', revenue: 52000, expenses: 35000 },
      { month: 'March', revenue: 48000, expenses: 33000 },
      { month: 'April', revenue: 61000, expenses: 38000 },
      { month: 'May', revenue: 58000, expenses: 36000 },
      { month: 'June', revenue: 67000, expenses: 40000 },
    ],
    company: 'Example Corp',
    year: 2024,
  };

  const dataPath = path.join(workDir, 'sales-data.json');
  await fs.writeFile(dataPath, JSON.stringify(sampleData, null, 2));
  console.log(`Sample data created at: ${dataPath}\n`);

  // Step 2: Initialize agent with tools
  console.log('Step 2: Initializing agent with tools...');
  const agent = new ClaudeAgent({
    apiKey,
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4096,
  });

  agent.registerTools([readFileTool, writeFileTool, calculatorTool]);
  console.log('Tools registered: read_file, write_file, calculator\n');

  // Step 3: Execute multi-step workflow
  console.log('Step 3: Executing multi-step analysis workflow...\n');

  const reportPath = path.join(workDir, 'sales-report.md');

  const workflowPrompt = `
You are a financial analyst. Please perform a comprehensive analysis of sales data:

1. Read the sales data from: ${dataPath}
2. For each month, calculate the profit (revenue - expenses)
3. Calculate the total revenue, total expenses, and total profit for the year
4. Calculate the average monthly revenue and profit
5. Identify the best and worst performing months
6. Calculate the profit margin for each month (profit / revenue * 100)
7. Generate a detailed report with:
   - Executive summary
   - Monthly breakdown table
   - Key metrics and statistics
   - Trends and insights
   - Recommendations for improvement
8. Write the report in Markdown format to: ${reportPath}

Use the calculator tool for all calculations to ensure accuracy.
Format all monetary values with dollar signs and commas.
  `.trim();

  const systemPrompt = `
You are a professional financial analyst with expertise in data analysis and reporting.
You always use tools when they are available for calculations and file operations.
Your reports are clear, well-structured, and actionable.
  `.trim();

  console.log('Agent is working...\n');
  const response = await agent.execute(workflowPrompt, systemPrompt);

  // Step 4: Display results
  console.log('=== Workflow Complete ===\n');
  console.log('Agent Response:');
  console.log(response.content);
  console.log('\n--- Workflow Statistics ---');
  console.log(`Tools Used: ${response.toolsUsed.join(', ')}`);
  console.log(`Total Tool Calls: ${response.toolsUsed.length}`);
  console.log(`Tokens Used: ${response.usage?.inputTokens} input, ${response.usage?.outputTokens} output`);
  console.log(`\nReport saved to: ${reportPath}`);

  // Step 5: Read and display the generated report
  console.log('\n--- Generated Report Preview ---');
  try {
    const report = await fs.readFile(reportPath, 'utf-8');
    const preview = report.split('\n').slice(0, 30).join('\n');
    console.log(preview);
    if (report.split('\n').length > 30) {
      console.log('\n... (report truncated for display)');
    }
  } catch (error) {
    console.log('Report file not found. The agent may not have created it yet.');
  }

  // Step 6: Show conversation history
  console.log('\n--- Conversation History ---');
  console.log(`Total messages: ${response.conversationHistory.length}`);
  response.conversationHistory.forEach((msg, i) => {
    console.log(`\n${i + 1}. ${msg.role.toUpperCase()}:`);
    const preview = msg.content.substring(0, 150);
    console.log(preview + (msg.content.length > 150 ? '...' : ''));
  });

  console.log('\n=== Example Complete ===');
  console.log(`\nWorkflow files are in: ${workDir}`);
  console.log('You can review the generated report and data files there.');
}

// Run the example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
