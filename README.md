# Image Generation MCP Server

This is a Model Context Protocol (MCP) server that allows compatible clients (like Cline, Claude Desktop, etc.) to generate images using OpenAI's API (`gpt-image-1`, `dall-e-3`, `dall-e-2`).

It provides a `create_image` tool that takes a text prompt and other parameters, generates the image, and saves it to a specified project's `public` directory.

## Features

*   Generates images from text prompts using OpenAI models (`gpt-image-1`, `dall-e-3`, `dall-e-2`).
*   Supports optional branding guidelines via a `brandSignature` parameter.
*   Allows specifying image size, quality.
*   Saves generated images to a target project directory specified by the LLM client.
*   Includes detailed documentation within the source code (`src/index.ts`) for LLM usage guidance.
*   Provides unit tests for verification.

## Prerequisites

1.  **Node.js:** Version 18 or higher recommended.
2.  **npm:** Comes with Node.js.
3.  **OpenAI API Key:** You need an API key from OpenAI. Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys) to create one. Note that usage of `gpt-image-1` might require [API Organization Verification](https://help.openai.com/en/articles/10910291-api-organization-verification).

## Installation

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url> image-mcp-server
    cd image-mcp-server
    ```
    *(Replace `<repository-url>` with the actual URL once hosted on GitHub/etc.)*

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Build the Server:**
    ```bash
    npm run build
    ```
    This compiles the TypeScript code into JavaScript in the `dist` directory.

## MCP Client Configuration

To use this server with an MCP client, you need to add its configuration to the client's settings file. The exact file path depends on the client:

*   **Cline (VS Code Extension):** `/Users/<YourUsername>/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` (macOS)
*   **Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
    *(Paths may differ on Windows/Linux - consult client documentation)*
*   **Other Clients (Roo, Cursor, Windsurf, etc.):** Consult the specific client's documentation for its MCP settings file location.

**Add the following configuration block** inside the main `"mcpServers": { ... }` object in your client's settings file. **Make sure to replace placeholders** with your actual absolute path and API key.

```jsonc
// Inside "mcpServers": { ... } in your client's settings JSON file:

"image-mcp-server": {
  "command": "node",
  "args": [
    // IMPORTANT: Use the ABSOLUTE path to the built index.js file
    "/path/to/your/cloned/image-mcp-server/dist/index.js"
  ],
  // IMPORTANT: Use the ABSOLUTE path to the server's root directory
  "cwd": "/path/to/your/cloned/image-mcp-server",
  "env": {
    // IMPORTANT: Replace with your actual OpenAI API Key
    "OPENAI_API_KEY": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  // --- Standard MCP Settings ---
  "disabled": false,      // Set to true to temporarily disable
  "autoApprove": [],      // List tool names to auto-approve (e.g., ["create_image"])
  "transportType": "stdio", // Communication method
  "timeout": 60           // Timeout in seconds (optional)
}

// Make sure to add a comma before this block if it's not the first server listed!
```

**Key Configuration Points:**

*   Replace `/path/to/your/cloned/image-mcp-server` with the **absolute path** where you cloned this repository.
*   Replace `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual **OpenAI API Key**.
*   Ensure `disabled` is `false` to enable the server.

The MCP client should automatically detect the changes and connect to the server.

## Tool Usage (`create_image`)

Once installed and configured, the server provides the `create_image` tool.

*   **Description:** Generates a new image based on a text prompt, optionally applying branding, and saves it to a target project's public folder.
*   **Detailed Usage & Parameters:** For comprehensive details on parameters (`prompt`, `filename`, `targetProjectDir`, `brandSignature`, `model`, `size`, `quality`, etc.) and guidance on how an LLM should use this tool effectively, please refer to the **detailed documentation comment block at the top of the `src/index.ts` file** in this repository.
*   **Output:** Returns a JSON object containing `{ ok: true, path: "relative/path/to/image.png", ... }` on success, where `path` is relative to the `public` folder of the `targetProjectDir` provided in the request.

**Example `curl` Test (after starting the server manually for testing):**

```bash
# First, build and start the server from its directory:
# npm run build && node dist/index.js

# In another terminal:
curl -X POST http://localhost:5050/createImage \
  -H 'Content-Type: application/json' \
  -d '{
        "prompt": "A cute otter mascot",
        "filename": "otter-mascot.png",
        "targetProjectDir": "/path/to/your/target/project"
      }'
```
*(Note: The server listens on port 5050 only if run directly, not when launched via MCP stdio)*

## Development

If you want to contribute or modify the server:

*   **Run Dev Server:** `npm run dev` (uses `tsc -w` and `nodemon` for auto-recompiling and restarting)
 *   **Run Tests:** `npm test` (uses `vitest`)

 ## Docker Support

 This repository includes a `Dockerfile` to build a container image for the server. This is useful for ensuring a consistent running environment and for potential deployment scenarios, although it's not required for the standard MCP client integration via `node`.

 **Build the Docker Image:**
 ```bash
 # Navigate to the project directory
 cd image-mcp-server
 # Build the image
 docker build -t image-mcp-server:latest .
 ```
 *(Requires Docker Desktop or Docker Engine to be installed and running).*

 **Run the Container (Example - Not for MCP stdio):**
 ```bash
 docker run -d --name image-server -e OPENAI_API_KEY="your_api_key" image-mcp-server:latest
 ```
 *(Note: Running via `docker run` like this won't work directly with MCP clients expecting stdio communication. The primary installation method remains configuring the client to run `node dist/index.js` as described above.)*

 ## License

*(Add your chosen license here, e.g., MIT License)*
