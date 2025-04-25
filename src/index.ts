#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool, // Import Tool type
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod'; // Keep zod for input validation
import { zodToJsonSchema } from 'zod-to-json-schema'; // Import converter
import { config } from 'dotenv';
import { imageReqSchema, ImageRequest } from './types/image.js'; // Import schema and type
import { openai } from './lib/openaiClient.js';
import { buildPrompt } from './lib/promptBuilder.js';
import { save } from './lib/fileSaver.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

config(); // Load .env file if present (though MCP client injects it)

// --- Tool Definition ---
 const CREATE_IMAGE_TOOL: Tool = {
   name: 'create_image',
   description: `Generates a new image based on a text prompt using OpenAI's DALL-E 3 or gpt-image-1 model, optionally applying branding guidelines. Saves the image to the target project's public folder (or server's public folder if target not specified) and returns the relative path within that public folder. For advanced prompt templates, recipe examples, and creative formatting techniques to produce exceptional images, see docs/prompt-recipes.md.`,
   // Convert Zod schema to JSON Schema for MCP and cast to 'any' to satisfy SDK type
   inputSchema: zodToJsonSchema(imageReqSchema, "imageReqSchema") as any, // Reflects updated imageReqSchema
 };

// --- Server Class ---
class ImageMcpServer {
  private server: Server;
  // ES module equivalent of __dirname needed for path resolution
  private __filename = fileURLToPath(import.meta.url);
  private __dirname = path.dirname(this.__filename);

  constructor() {
    this.server = new Server(
      {
        // Use a more specific name if desired
        name: 'image-mcp-server',
        version: '1.0.0', // Match package.json
      },
      {
        capabilities: {
          tools: {}, // Tools are listed via handler
        },
      }
    );

     this.setupToolHandlers();

     // Basic error logging
     this.server.onerror = (error: any) => console.error('[MCP Error]', error); // Explicit any type
     process.on('SIGINT', async () => {
       await this.server.close();
       process.exit(0);
    });
  }

  private setupToolHandlers() {
    // Handler for listing available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [CREATE_IMAGE_TOOL],
    }));

    // Handler for executing the tool call
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => { // Explicit any type
      if (request.params.name !== CREATE_IMAGE_TOOL.name) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      let input: ImageRequest;
      try {
        // Validate input arguments using the Zod schema
        input = imageReqSchema.parse(request.params.arguments);
      } catch (err) {
        if (err instanceof z.ZodError) {
          // Throw specific MCP error for invalid parameters
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid input arguments: ${err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
            err.errors // Optionally include Zod error details
          );
        }
        // Re-throw other parsing errors
        throw err;
      }

      // --- Core Image Generation Logic (adapted from Express route) ---
      try {
        // brandSignature fallback
        let brandSignature = input.brandSignature;
        if (!brandSignature) {
          try {
            const palettePath = path.resolve(this.__dirname, '../branding/palette.json');
            const palette = await import(palettePath, { assert: { type: 'json' } }).then(m => m.default);
            brandSignature = `palette:${Object.values(palette).join(',')}`;
          } catch {
            brandSignature = 'palette:#000,#FFF; tone:neutral';
          }
        }

        const finalPrompt = buildPrompt(input.prompt, brandSignature);

        // Call OpenAI API
        const rsp = await openai.images.generate({
          model: input.model ?? 'dall-e-3', // Keep dall-e-3 fallback
          prompt: finalPrompt,
          size: input.size,
          quality: input.quality, // Pass validated quality directly
          n: 1,
          // response_format defaults to b64_json for Node client
        });

        // Validate response and get image data
        if (!rsp.data?.[0]?.b64_json) {
          throw new Error('Invalid or missing image data in OpenAI API response');
        }
        const imgBytes = Buffer.from(rsp.data[0].b64_json, 'base64');

        // Save the file
         const filename = input.filename ?? `img_${Date.now()}.png`;
         const outputPath = input.outputPath ?? '';
         // Determine base directory: use targetProjectDir if provided, otherwise use server's CWD as fallback
         const baseDir = input.targetProjectDir ?? process.cwd();
           // Save relative to target project's public folder
           const saveDir = path.resolve(baseDir, 'public', outputPath);
           // NOTE: Removed debug log here compared to installed version
           const fullPath = await save(imgBytes, filename, saveDir); // Pass absolute save directory

           // Calculate path relative to the *target* public directory for the response
         const publicDir = path.resolve(baseDir, 'public');
         const relativePath = path.relative(publicDir, fullPath);

         // --- Format Success Response for MCP ---
        const resultData = {
          ok: true,
          path: relativePath,
          bytes: imgBytes.length,
          model: input.model ?? 'dall-e-3',
          prompt: finalPrompt,
          revised_prompt: rsp.data[0].revised_prompt,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(resultData, null, 2), // Return result as JSON string
            },
          ],
        };

      } catch (err: any) {
         console.error('❌ createImage tool error:', err); // Log the internal error
         // --- Format Error Response for MCP ---
         // Use McpError for structured errors, otherwise return a generic error message
         if (err instanceof McpError) {
             throw err; // Re-throw MCP errors
         }

         // For OpenAI API errors or other internal errors
         return {
             content: [
                 {
                     type: 'text',
                     text: `Failed to create image: ${err.message || 'Internal server error'}`,
                 },
             ],
             isError: true,
         };
      }
    });
  }

  // Start the server and connect transport
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // No console.log here for stdio transport
    // console.error('Image MCP server running on stdio'); // Use stderr for logs if needed
  }
}

// Instantiate and run the server
const serverInstance = new ImageMcpServer();
serverInstance.run().catch(error => {
    console.error("Fatal error running Image MCP server:", error);
    process.exit(1);
});
