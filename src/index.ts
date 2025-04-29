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
import { zodToJsonSchema } from 'zod-to-json-schema';
import { config } from 'dotenv';
import { imageReqSchema, ImageRequest } from './types/image.js';
import { getOpenAIClient } from './lib/openaiClient.js'; // Import the function
import { buildPrompt } from './lib/promptBuilder.js';
import { save } from './lib/fileSaver.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { toFile } from 'openai';

console.error("[MCP DEBUG] Server script started."); // Log start

config(); // Load .env file if present (though MCP client injects it)
console.error("[MCP DEBUG] dotenv config loaded."); // Log dotenv

// --- Tool Definition ---
// Generate the full JSON schema including definitions
const fullJsonSchema = zodToJsonSchema(imageReqSchema, "imageReqSchema");
// Extract the core schema definition that Cline expects (with top-level "type": "object")
const inputSchemaForCline = fullJsonSchema.definitions?.imageReqSchema ?? { type: 'object' }; // Fallback just in case

const CREATE_IMAGE_TOOL: Tool = {
  name: 'create_image',
  description: 'Generates an image using OpenAI (DALL-E 3 / gpt-image-1) based on a detailed text prompt. For best results, provide vivid descriptions incorporating style, composition, lighting, and mood. Can also edit or combine existing images by providing referenceImagePaths. Refer to \'docs/prompt-recipes.md\' for extensive examples, templates, and tips for various image types (hero backgrounds, icons, illustrations, photos). Key parameters include \'prompt\', \'brandSignature\' (use project palette), \'size\' (e.g., 1024x1024, 1536x1024), \'quality\', \'model\', \'filename\', \'outputPath\', \'targetProjectDir\', and \'referenceImagePaths\' (for editing/combining images).',
  // Use the extracted schema object
  inputSchema: inputSchemaForCline as any, // Cast to any to satisfy SDK type
};

// --- Server Class ---
class ImageMcpServer {
  private server: Server;
  // ES module equivalent of __dirname needed for path resolution
  private __filename = fileURLToPath(import.meta.url);
  private __dirname = path.dirname(this.__filename);

  constructor() {
    console.error("[MCP DEBUG] ImageMcpServer constructor entered."); // Log constructor start
    this.server = new Server(
      {
        // Use package name from package.json
        name: '@mcp/image-server',
        version: '1.0.0', // Match package.json
      },
      {
        capabilities: {
          // List available tools
          tools: { [CREATE_IMAGE_TOOL.name]: CREATE_IMAGE_TOOL },
          // Expose documentation as resources for LLMs to access
          resources: {
            "docs/prompt-recipes": {
              type: "text/markdown",
              path: path.resolve(this.__dirname, "../../docs/prompt-recipes.md")
            },
            "docs/readme": {
              type: "text/markdown",
              path: path.resolve(this.__dirname, "../../README.md")
            }
          }
        },
      }
    );
    console.error("[MCP DEBUG] MCP SDK Server instance created."); // Log SDK server creation

     this.setupToolHandlers();

     // Basic error logging
     this.server.onerror = (error: any) => console.error('[MCP Error]', error); // Explicit any type
     process.on('SIGINT', async () => {
       await this.server.close();
       process.exit(0);
    });
  }

  private setupToolHandlers() {
    console.error("[MCP DEBUG] setupToolHandlers entered."); // Log handler setup start
    // Handler for listing available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error("[MCP DEBUG] ListToolsRequest received. Returning tools:", JSON.stringify([CREATE_IMAGE_TOOL])); // Log before returning tools
      return {
        tools: [CREATE_IMAGE_TOOL],
      };
    });
    console.error("[MCP DEBUG] ListTools handler set."); // Log handler set

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
        // Log incoming request arguments for debugging
        console.error("[MCP DEBUG] Incoming request arguments:", JSON.stringify(request.params.arguments, null, 2));
        
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
        // Create the final prompt using only what was provided in the input
        // No fallbacks for brandSignature - use exactly what was provided (or undefined)
        const finalPrompt = buildPrompt(input.prompt, input.brandSignature, input.styleDefinitionJSON);
        
        // Log the complete prompt for debugging
        console.error("[MCP DEBUG] Final prompt being sent to OpenAI:");
        console.error("---PROMPT START---");
        console.error(finalPrompt);
        console.error("---PROMPT END---");
        
        // Log style JSON if provided (for debugging)
        if (input.styleDefinitionJSON) {
          console.error("[MCP DEBUG] Style definition JSON provided:", 
            JSON.stringify(input.styleDefinitionJSON, null, 2));
        }
        
        // Get OpenAI client instance when needed
        const openai = getOpenAIClient();
        
        let rsp;
        
        // Check if reference images are provided
        if (input.referenceImagePaths && input.referenceImagePaths.length > 0) {
          console.error("[MCP DEBUG] Using images.edit with reference images:", input.referenceImagePaths);
          
          // Determine base directory for reference images
          const baseDir = input.targetProjectDir ?? process.cwd();
          const publicDir = path.resolve(baseDir, 'public');
          
          // Load reference images
          const images = await Promise.all(
            input.referenceImagePaths.map(async (imagePath) => {
              // Resolve full path to the image (relative to public directory)
              const fullImagePath = path.resolve(publicDir, imagePath);
              console.error(`[MCP DEBUG] Loading reference image from ${fullImagePath}`);
              
              // Determine MIME type based on file extension
              const ext = path.extname(fullImagePath).toLowerCase();
              const mimeType = ext === '.png' ? 'image/png' : 
                              ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                              ext === '.webp' ? 'image/webp' : 'image/png'; // Default to PNG
              
              try {
                // Create a readable stream for the image file
                const stream = fs.createReadStream(fullImagePath);
                // Convert to OpenAI compatible format
                return await toFile(stream, path.basename(fullImagePath), { type: mimeType });
              } catch (err: any) {
                console.error(`[MCP ERROR] Failed to load reference image ${fullImagePath}:`, err);
                throw new Error(`Failed to load reference image ${imagePath}: ${err.message || 'Unknown error'}`);
              }
            })
          );
          
          // Ensure we'll use gpt-image-1 for edit operations
          const editModel = 'gpt-image-1';
          if (input.model && input.model !== editModel) {
            console.error(`[MCP DEBUG] Overriding model ${input.model} with ${editModel} for image edit operation`);
          }
          
          // Call OpenAI images.edit API
          rsp = await openai.images.edit({
            model: editModel, // Always use gpt-image-1 for edits
            image: images, // Pass the loaded reference images
            prompt: finalPrompt,
            background: input.background, // Directly include background parameter
            n: 1,
            // size is not supported in edit operations
            // response_format defaults to b64_json
          } as any); // Type assertion to bypass TypeScript checking
          
          console.error("[MCP DEBUG] Successfully completed images.edit call");
        } else {
          console.error("[MCP DEBUG] Using images.generate (no reference images)");
          
          // Call OpenAI images.generate API (existing functionality)
          rsp = await openai.images.generate({
            model: input.model ?? 'dall-e-3', // Keep dall-e-3 fallback
            prompt: finalPrompt,
            size: input.size,
            quality: input.quality, // Pass validated quality directly
            background: input.background, // Directly include background parameter
            n: 1,
            // response_format defaults to b64_json for Node client
          });
          
          console.error("[MCP DEBUG] Successfully completed images.generate call");
        }

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
          model: input.referenceImagePaths && input.referenceImagePaths.length > 0 ? 'gpt-image-1' : (input.model ?? 'dall-e-3'),
          prompt: finalPrompt,
          revised_prompt: rsp.data[0].revised_prompt,
          operation: input.referenceImagePaths && input.referenceImagePaths.length > 0 ? 'edit' : 'generate',
          referenceImages: input.referenceImagePaths || []
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
    console.error("[MCP DEBUG] run() method entered."); // Log run start
    const transport = new StdioServerTransport();
    console.error("[MCP DEBUG] StdioServerTransport created."); // Log transport creation
    await this.server.connect(transport);
    console.error("[MCP DEBUG] Server connected to transport. Waiting for requests..."); // Log connection success
    // No console.log here for stdio transport
  }
}

// Instantiate and run the server
console.error("[MCP DEBUG] Instantiating ImageMcpServer..."); // Log instantiation
const serverInstance = new ImageMcpServer();
console.error("[MCP DEBUG] ImageMcpServer instantiated. Calling run()..."); // Log before run
serverInstance.run().catch(error => {
    console.error("Fatal error running Image MCP server:", error);
    process.exit(1);
});
