# Workflow Design

This guide covers designing and implementing complex multi-step workflows with Claude agents.

## Table of Contents

- [What is a Workflow?](#what-is-a-workflow)
- [Workflow Patterns](#workflow-patterns)
- [Designing Workflows](#designing-workflows)
- [Implementation Strategies](#implementation-strategies)
- [Example Workflows](#example-workflows)
- [Best Practices](#best-practices)
- [Common Pitfalls](#common-pitfalls)

## What is a Workflow?

A workflow is a structured sequence of steps that an agent executes to accomplish a complex goal. Unlike simple single-turn interactions, workflows:

- **Orchestrate multiple tools** to achieve a goal
- **Maintain state** across multiple steps
- **Handle dependencies** between steps
- **Provide structure** for complex tasks
- **Enable reusability** through encapsulation

### Simple Task vs Workflow

**Simple Task:**
```typescript
// Single-step: Calculate a number
const result = await agent.execute('What is 15 * 23?');
```

**Workflow:**
```typescript
// Multi-step: Analyze data, generate insights, create report
const workflow = new DataAnalysisWorkflow({...});
const result = await workflow.execute();
```

## Workflow Patterns

### 1. Linear Workflow

Steps execute in a fixed sequence:

```
Step 1 → Step 2 → Step 3 → Step 4 → Complete
```

**Example:** Data Analysis
1. Read data file
2. Analyze data
3. Generate insights
4. Write report

**Best for:**
- Predictable processes
- ETL (Extract, Transform, Load) operations
- Report generation

### 2. Branching Workflow

Steps take different paths based on conditions:

```
        ┌→ Path A → Result A
Step 1 ─┤
        └→ Path B → Result B
```

**Example:** Code Review
1. Check if path is file or directory
2. If directory: List files, then review each
3. If file: Review directly

**Best for:**
- Conditional logic
- Error handling with fallbacks
- Adaptive processes

### 3. Iterative Workflow

Steps repeat until a condition is met:

```
Step 1 → Step 2 → Check → ┐
          ↑              │
          └──────────────┘
```

**Example:** Research Assistant
1. Search for information
2. Analyze results
3. If insufficient: Refine query and repeat
4. If sufficient: Synthesize and report

**Best for:**
- Research and discovery
- Optimization problems
- Progressive refinement

### 4. Parallel Workflow

Steps execute concurrently:

```
        ┌→ Task A ─┐
Step 1 ─┼→ Task B ─┼→ Combine → Complete
        └→ Task C ─┘
```

**Example:** Multi-Source Analysis
1. Simultaneously query multiple data sources
2. Combine results
3. Generate unified report

**Best for:**
- Independent operations
- Performance optimization
- Multi-source aggregation

## Designing Workflows

### Step 1: Define the Goal

Start with a clear objective:

```typescript
/**
 * Goal: Perform comprehensive code review
 *
 * Inputs: Code directory path, review criteria
 * Outputs: Detailed review report with issues and recommendations
 *
 * Success criteria:
 * - All files reviewed
 * - Issues categorized by severity
 * - Actionable recommendations provided
 */
```

### Step 2: Break Down into Steps

Decompose the goal into discrete steps:

```typescript
/**
 * Steps:
 * 1. Discovery: List all code files in directory
 * 2. Analysis: Read and review each file
 * 3. Categorization: Group issues by severity
 * 4. Synthesis: Generate comprehensive report
 * 5. Output: Write report to file
 */
```

### Step 3: Identify Required Tools

Map steps to tools:

```typescript
/**
 * Tools needed:
 * - list_directory: For file discovery
 * - read_file: For reading code
 * - write_file: For saving report
 */
```

### Step 4: Design Data Flow

Plan how data moves between steps:

```typescript
interface WorkflowState {
  inputPath: string;
  discoveredFiles: string[];
  reviewResults: ReviewResult[];
  finalReport: string;
}
```

### Step 5: Handle Edge Cases

Plan for error conditions:

```typescript
/**
 * Edge cases:
 * - Empty directory
 * - Unreadable files
 * - Large files (>1MB)
 * - Binary files
 * - Permission errors
 */
```

## Implementation Strategies

### Strategy 1: Agent-Driven Workflow

Let the agent orchestrate the workflow through a single, comprehensive prompt:

```typescript
class DataAnalysisWorkflow {
  async execute(): Promise<WorkflowResult> {
    const prompt = `
    Perform the following data analysis workflow:
    1. Read data from ${this.inputPath}
    2. Analyze the data for patterns and insights
    3. Calculate key statistics
    4. Generate a report
    5. Write the report to ${this.outputPath}
    `;

    return await this.agent.execute(prompt);
  }
}
```

**Pros:**
- Simple implementation
- Flexible - agent adapts to data
- Natural language workflow definition

**Cons:**
- Less control over execution
- Harder to debug
- Unpredictable tool usage

**Best for:**
- Exploratory workflows
- Workflows that need adaptation
- Rapid prototyping

### Strategy 2: Structured Workflow

Explicitly control each step programmatically:

```typescript
class DataAnalysisWorkflow {
  async execute(): Promise<WorkflowResult> {
    // Step 1: Read data
    const data = await this.readData();

    // Step 2: Analyze
    const analysis = await this.analyzeData(data);

    // Step 3: Generate insights
    const insights = await this.generateInsights(analysis);

    // Step 4: Create report
    const report = await this.createReport(insights);

    // Step 5: Write report
    await this.writeReport(report);

    return { report, insights };
  }

  private async readData(): Promise<any> {
    return await this.agent.execute(`Read data from ${this.inputPath}`);
  }

  // ... other methods
}
```

**Pros:**
- Full control over execution order
- Easy to debug and test
- Predictable behavior

**Cons:**
- More code to write
- Less flexible
- Requires more upfront planning

**Best for:**
- Production workflows
- Workflows with strict requirements
- Complex orchestration

### Strategy 3: Hybrid Approach

Combine both strategies:

```typescript
class CodeReviewWorkflow {
  async execute(): Promise<WorkflowResult> {
    // Structured: Explicitly discover files
    const files = await this.discoverFiles();

    // Agent-driven: Let agent review each file
    const reviews = [];
    for (const file of files) {
      const review = await this.agent.execute(
        `Review ${file} for code quality, security, and performance issues.`
      );
      reviews.push(review);
    }

    // Structured: Combine results
    return this.synthesizeReviews(reviews);
  }
}
```

**Pros:**
- Balance of control and flexibility
- Best of both approaches
- Adaptable to different needs

**Cons:**
- More complex to design
- Requires understanding both patterns

**Best for:**
- Most production workflows
- Complex, multi-phase processes

## Example Workflows

### Example 1: Data Analysis Workflow

```typescript
export class DataAnalysisWorkflow {
  constructor(private config: {
    apiKey: string;
    inputPath: string;
    outputPath: string;
  }) {
    this.agent = new ClaudeAgent({ apiKey: config.apiKey });
    this.agent.registerTools([readFileTool, writeFileTool, calculatorTool]);
  }

  async execute(): Promise<AnalysisResult> {
    const prompt = `
    Perform comprehensive data analysis:

    1. Read data from: ${this.config.inputPath}
    2. Calculate:
       - Mean, median, mode
       - Standard deviation
       - Min/max values
    3. Identify trends and patterns
    4. Generate insights and recommendations
    5. Create a detailed report
    6. Write report to: ${this.config.outputPath}

    Use the calculator tool for all calculations.
    Format the report with clear sections and visualizations.
    `;

    const result = await this.agent.execute(prompt, this.getSystemPrompt());
    return this.parseResult(result);
  }

  private getSystemPrompt(): string {
    return `
    You are a professional data analyst.
    Always use available tools for calculations and file operations.
    Structure your reports with:
    - Executive Summary
    - Detailed Analysis
    - Key Findings
    - Recommendations
    `;
  }
}
```

### Example 2: Code Review Workflow

```typescript
export class CodeReviewWorkflow {
  constructor(private config: {
    apiKey: string;
    targetPath: string;
    criteria: string[];
  }) {
    this.agent = new ClaudeAgent({ apiKey: config.apiKey });
    this.agent.registerTools([
      readFileTool,
      listDirectoryTool,
      writeFileTool,
    ]);
  }

  async execute(): Promise<ReviewResult> {
    // Step 1: Discover files
    const discoveryPrompt = `
    List all files in ${this.config.targetPath}.
    Filter for code files (.ts, .js, .tsx, .jsx).
    `;

    const discovery = await this.agent.execute(discoveryPrompt);

    // Step 2: Review code
    const reviewPrompt = `
    Review the discovered code files against these criteria:
    ${this.config.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

    For each issue found, provide:
    - Severity (high/medium/low)
    - Category
    - Description
    - Location (file and line if possible)
    - Recommendation

    Generate a comprehensive review report.
    `;

    const review = await this.agent.execute(reviewPrompt);

    return this.parseReview(review.content);
  }
}
```

### Example 3: Research Workflow

```typescript
export class ResearchWorkflow {
  constructor(private config: {
    apiKey: string;
    topic: string;
    depth: number;
  }) {
    this.agent = new ClaudeAgent({ apiKey: config.apiKey });
    this.agent.registerTools([webSearchTool, writeFileTool]);
  }

  async execute(): Promise<ResearchResult> {
    let currentDepth = 0;
    let findings: string[] = [];

    while (currentDepth < this.config.depth) {
      const searchPrompt = this.buildSearchPrompt(
        this.config.topic,
        findings,
        currentDepth
      );

      const result = await this.agent.execute(searchPrompt);
      findings.push(result.content);

      currentDepth++;
    }

    // Synthesize findings
    const synthesisPrompt = `
    Based on the research conducted, synthesize a comprehensive report on:
    ${this.config.topic}

    Include:
    - Overview
    - Key findings
    - Sources and references
    - Conclusions
    `;

    const finalReport = await this.agent.execute(synthesisPrompt);
    return { report: finalReport.content, findings };
  }

  private buildSearchPrompt(
    topic: string,
    previousFindings: string[],
    depth: number
  ): string {
    // Build increasingly specific search prompts
    // based on previous findings
    return `Search for information about ${topic}...`;
  }
}
```

## Best Practices

### 1. Clear Prompts

Write explicit, structured prompts:

```typescript
// Good: Structured and clear
const prompt = `
Perform the following steps:

1. Read the file at ${path}
2. Extract all function definitions
3. For each function:
   - Count parameters
   - Check for documentation
   - Identify potential issues
4. Generate a summary report

Output the report in JSON format.
`;

// Bad: Vague and unstructured
const prompt = `Analyze ${path} and tell me about it`;
```

### 2. System Prompts

Use system prompts to define behavior:

```typescript
const systemPrompt = `
You are a code review assistant.
You ALWAYS use tools when they are available.
You provide constructive, actionable feedback.
You follow best practices for ${language}.
`;
```

### 3. Error Recovery

Handle errors gracefully:

```typescript
async execute(): Promise<Result> {
  try {
    return await this.runWorkflow();
  } catch (error) {
    console.error('Workflow failed:', error);

    // Attempt recovery
    if (this.canRecover(error)) {
      return await this.retryWithModifications();
    }

    throw error;
  }
}
```

### 4. Progress Tracking

Provide visibility into workflow execution:

```typescript
async execute(): Promise<Result> {
  console.log('Step 1/5: Reading data...');
  const data = await this.readData();

  console.log('Step 2/5: Analyzing...');
  const analysis = await this.analyze(data);

  // ... more steps
}
```

### 5. Validation

Validate inputs and outputs:

```typescript
async execute(): Promise<Result> {
  // Validate inputs
  this.validateConfig();

  const result = await this.runWorkflow();

  // Validate outputs
  this.validateResult(result);

  return result;
}
```

## Common Pitfalls

### 1. Overly Complex Workflows

**Problem:** Trying to do too much in one workflow

**Solution:** Break into smaller, composable workflows

```typescript
// Instead of one massive workflow
class MegaWorkflow {
  async execute() {
    // 20 different steps...
  }
}

// Use composition
class MainWorkflow {
  async execute() {
    const data = await new DataWorkflow().execute();
    const analysis = await new AnalysisWorkflow(data).execute();
    const report = await new ReportWorkflow(analysis).execute();
    return report;
  }
}
```

### 2. Insufficient Error Handling

**Problem:** Workflows fail on first error

**Solution:** Implement robust error handling

```typescript
async execute(): Promise<Result> {
  const results = [];

  for (const item of items) {
    try {
      const result = await this.processItem(item);
      results.push({ success: true, result });
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        item,
      });
    }
  }

  return results;
}
```

### 3. Not Managing Context

**Problem:** Agent loses context in long workflows

**Solution:** Break into phases or use structured approach

```typescript
// Break into phases
async execute(): Promise<Result> {
  const phase1 = await this.phase1();
  this.agent.clearHistory(); // Fresh start

  const phase2 = await this.phase2(phase1);
  this.agent.clearHistory();

  const phase3 = await this.phase3(phase2);
  return phase3;
}
```

### 4. Ignoring Token Limits

**Problem:** Workflows exceed token limits

**Solution:** Monitor usage and paginate

```typescript
async execute(): Promise<Result> {
  const chunks = this.chunkData(this.data, CHUNK_SIZE);
  const results = [];

  for (const chunk of chunks) {
    const result = await this.agent.execute(
      this.buildPrompt(chunk)
    );

    results.push(result);
    this.agent.clearHistory(); // Prevent context buildup
  }

  return this.combineResults(results);
}
```

## Next Steps

- Review [Agent Concepts](./AGENT-CONCEPTS.md) for foundational knowledge
- Check [API Reference](./API-REFERENCE.md) for implementation details
- Study the example workflows in `/src/workflows`
- Build your own custom workflows

## Resources

- [Anthropic Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [Tool Use Best Practices](https://docs.anthropic.com/claude/docs/tool-use)
