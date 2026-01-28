import { AgentTool } from '../agent';

export const webSearchTool: AgentTool = {
  name: 'web_search',
  description: 'Searches the web for information. Returns a list of relevant results with titles and snippets.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5)',
      },
    },
    required: ['query'],
  },
  execute: async (input: { query: string; max_results?: number }) => {
    const { query, max_results = 5 } = input;

    // Simulated web search results
    // In a production environment, you would integrate with a real search API
    // such as Google Custom Search, Bing Search API, or SerpAPI

    const mockResults = [
      {
        title: `${query} - Wikipedia`,
        url: `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, '_')}`,
        snippet: `Information about ${query} from the free encyclopedia.`,
      },
      {
        title: `${query} Tutorial`,
        url: `https://example.com/tutorial/${query.replace(/\s+/g, '-').toLowerCase()}`,
        snippet: `Learn about ${query} with this comprehensive tutorial.`,
      },
      {
        title: `${query} Documentation`,
        url: `https://docs.example.com/${query.replace(/\s+/g, '-').toLowerCase()}`,
        snippet: `Official documentation for ${query}.`,
      },
      {
        title: `Best practices for ${query}`,
        url: `https://blog.example.com/${query.replace(/\s+/g, '-').toLowerCase()}`,
        snippet: `Learn the best practices and patterns for ${query}.`,
      },
      {
        title: `${query} GitHub Repository`,
        url: `https://github.com/topics/${query.replace(/\s+/g, '-').toLowerCase()}`,
        snippet: `Open source projects related to ${query}.`,
      },
    ];

    return {
      query,
      results: mockResults.slice(0, max_results),
      total_results: mockResults.length,
    };
  },
};
