import { AgentTool } from '../agent';
import * as fs from 'fs/promises';
import * as path from 'path';

export const readFileTool: AgentTool = {
  name: 'read_file',
  description: 'Reads the contents of a file from the filesystem.',
  input_schema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The path to the file to read',
      },
    },
    required: ['file_path'],
  },
  execute: async (input: { file_path: string }) => {
    try {
      const content = await fs.readFile(input.file_path, 'utf-8');
      return {
        file_path: input.file_path,
        content,
        success: true,
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export const writeFileTool: AgentTool = {
  name: 'write_file',
  description: 'Writes content to a file on the filesystem. Creates the file if it does not exist.',
  input_schema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The path to the file to write',
      },
      content: {
        type: 'string',
        description: 'The content to write to the file',
      },
    },
    required: ['file_path', 'content'],
  },
  execute: async (input: { file_path: string; content: string }) => {
    try {
      // Ensure directory exists
      const dir = path.dirname(input.file_path);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(input.file_path, input.content, 'utf-8');
      return {
        file_path: input.file_path,
        bytes_written: Buffer.byteLength(input.content, 'utf-8'),
        success: true,
      };
    } catch (error) {
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export const listDirectoryTool: AgentTool = {
  name: 'list_directory',
  description: 'Lists the contents of a directory.',
  input_schema: {
    type: 'object',
    properties: {
      directory_path: {
        type: 'string',
        description: 'The path to the directory to list',
      },
    },
    required: ['directory_path'],
  },
  execute: async (input: { directory_path: string }) => {
    try {
      const entries = await fs.readdir(input.directory_path, { withFileTypes: true });

      const files = entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name);

      const directories = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      return {
        directory_path: input.directory_path,
        files,
        directories,
        total_entries: entries.length,
        success: true,
      };
    } catch (error) {
      throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
