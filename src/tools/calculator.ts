import { AgentTool } from '../agent';

export const calculatorTool: AgentTool = {
  name: 'calculator',
  description: 'Performs basic mathematical calculations. Supports addition, subtraction, multiplication, and division.',
  input_schema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: 'The mathematical operation to perform',
      },
      a: {
        type: 'number',
        description: 'The first number',
      },
      b: {
        type: 'number',
        description: 'The second number',
      },
    },
    required: ['operation', 'a', 'b'],
  },
  execute: async (input: { operation: string; a: number; b: number }) => {
    const { operation, a, b } = input;

    switch (operation) {
      case 'add':
        return { result: a + b };
      case 'subtract':
        return { result: a - b };
      case 'multiply':
        return { result: a * b };
      case 'divide':
        if (b === 0) {
          throw new Error('Division by zero is not allowed');
        }
        return { result: a / b };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
};
