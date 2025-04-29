# Image Generation MCP Server

This is a Model Context Protocol (MCP) server that allows compatible clients (like Cline, Claude Desktop, etc.) to generate images using OpenAI's API (`gpt-image-1`, `dall-e-3`, `dall-e-2`).

It provides a `create_image` tool that takes a text prompt and other parameters, generates the image, and saves it to a specified project's `public` directory.

## Features

*   Generates images from text prompts using OpenAI models (`gpt-image-1`, `dall-e-3`, `dall-e-2`).
*   Edits and combines existing images using reference images with OpenAI's `gpt-image-1` model.
*   Supports optional branding guidelines via a `brandSignature` parameter.
*   Allows specifying image size, quality, and background type (transparent or opaque).
*   Supports consistent visual styling through the `styleDefinitionJSON` parameter.
*   Saves generated images to a target project directory specified by the LLM client.
*   Includes detailed documentation within the source code (`src/index.ts`) for LLM usage guidance.
*   Provides unit tests for verification.

## Prerequisites

1.  **Node.js:** Version 18 or higher recommended.
2.  **npm:** Comes with Node.js.
3.  **OpenAI API Key:** You need an API key from OpenAI. Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys) to create one. Note that usage of `gpt-image-1` might require [API Organization Verification](https://help.openai.com/en/articles/10910291-api-organization-verification).

## Installation

### Option 1: NPX Installation (Recommended)

The easiest way to install and use the image server is with NPX. This approach automatically provides updates whenever the server is restarted:

```bash
# You don't need to install or clone anything - just run this command to test
npx -y @dfeirstein/image-server@latest
```

NPX will download the latest version from npm and execute it. The server will be kept up-to-date automatically every time it's launched.

### Option 2: Clone the Repository

If you prefer to have full access to the source code or want to contribute:

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url> image-mcp-server
    cd image-mcp-server
    ```
    *(Replace `<repository-url>` with the actual URL once hosted on GitHub/etc.)*

2.  **Install Dependencies:**
    ```bash
    npm ci
    ```
    This command installs exact versions from package-lock.json, ensuring consistent dependencies.

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

### For NPX Installation (Recommended)

```jsonc
// Inside "mcpServers": { ... } in your client's settings JSON file:

"image-mcp-server": {
  "command": "npx",
  "args": [
    "-y",                          // Auto-accept installation
    "@dfeirstein/image-server@latest"     // Always fetch the latest version
  ],
  "cwd": "/tmp",                   // Any temporary directory is fine
  "env": {
    // IMPORTANT: Replace with your actual OpenAI API Key
    "OPENAI_API_KEY": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  // --- Standard MCP Settings ---
  "disabled": false,
  "autoApprove": [],      // List tool names to auto-approve (e.g., ["create_image"])
  "transportType": "stdio",
  "timeout": 60
}

// Make sure to add a comma before this block if it's not the first server listed!
```

This configuration will automatically download and run the latest version of the server each time your MCP client starts, ensuring you always have the most recent features and bug fixes.

### For Repository-Based Installation

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
  "disabled": false,
  "autoApprove": [],
  "transportType": "stdio",
  "timeout": 60
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

### Accessing Documentation Resources

The server exposes its documentation as MCP resources which can be accessed by LLMs before crafting prompts:

```xml
<!-- To access prompt recipes documentation -->
<access_mcp_resource>
<server_name>image-mcp-server</server_name>
<uri>docs/prompt-recipes</uri>
</access_mcp_resource>

<!-- To access general README documentation -->
<access_mcp_resource>
<server_name>image-mcp-server</server_name>
<uri>docs/readme</uri>
</access_mcp_resource>
```

This allows LLMs to read the prompt recipes documentation before crafting image prompts, leading to better results.

*   **Description:** Generates a new image based on a text prompt, optionally applying branding or using a style definition JSON, and saves it to a target project's public folder. Can also edit or combine existing images by providing reference images.
*   **Detailed Usage & Parameters:** For comprehensive details on parameters (`prompt`, `filename`, `targetProjectDir`, `brandSignature`, `styleDefinitionJSON`, `model`, `size`, `quality`, `background`, `referenceImagePaths`, etc.) and guidance on how an LLM should use this tool effectively, please refer to the **detailed documentation comment block at the top of the `src/index.ts` file** in this repository.
*   **Background Options:** The `background` parameter accepts either 'transparent' or 'opaque' (default) values. Transparent backgrounds are useful for logos, icons, and overlays, and work best with the `gpt-image-1` model. Transparent backgrounds require PNG or WebP format.
*   **Image Editing:** When `referenceImagePaths` is provided (an array of paths relative to the target project's public folder), the tool will use OpenAI's image editing capabilities to modify or combine those images based on the prompt. For image editing operations, the model is automatically set to `gpt-image-1`.
*   **Style Definition:** The optional `styleDefinitionJSON` parameter allows you to define a consistent visual style across multiple images. This is especially useful for creating themed image collections with a unified aesthetic. The JSON structure is passed directly to the image model within the prompt, allowing for flexible and expressive style definitions.
*   **Output:** Returns a JSON object containing `{ ok: true, path: "relative/path/to/image.png", operation: "edit"|"generate", ... }` on success, where `path` is relative to the `public` folder of the `targetProjectDir` provided in the request.

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

# Example with background parameter for transparent PNG:
curl -X POST http://localhost:5050/createImage \
  -H 'Content-Type: application/json' \
  -d '{
        "prompt": "A professional logo of a cloud with lightning bolt",
        "filename": "cloud-logo.png",
        "model": "gpt-image-1",
        "background": "transparent",
        "targetProjectDir": "/path/to/your/target/project"
      }'

# Example with image editing and transparent background:
curl -X POST http://localhost:5050/createImage \
  -H 'Content-Type: application/json' \
  -d '{
        "prompt": "Add a glowing blue aura effect around the object",
        "filename": "enhanced-icon.png",
        "model": "gpt-image-1",
        "background": "transparent",
        "referenceImagePaths": ["existing-icon.png"],
        "targetProjectDir": "/path/to/your/target/project"
      }'

# Example with styleDefinitionJSON parameter:
curl -X POST http://localhost:5050/createImage \
  -H 'Content-Type: application/json' \
  -d '{
        "prompt": "Abstract representation of Litigation",
        "filename": "litigation-concept.png",
        "targetProjectDir": "/path/to/your/target/project",
        "styleDefinitionJSON": {
          "output_requirements": {
            "color_mode": "Full Vibrant Color Photography", 
            "style": "Abstract Conceptual Realism",
            "quality": "High-end Professional Photo Shoot"
          },
          "color_palette": {
            "primary_accent": {"name": "Primary Blue", "hex": "#1474F3"},
            "supporting_colors": [
              {"name": "Deep Navy", "hex": "#1C2B4A"},
              {"name": "Warm Neutral", "hex": "#E8D7C1"}
            ],
            "overall_tone": "Predominantly cool with warm accents"
          },
          "strict_exclusions": [
            "No Black and White or Monochrome output",
            "No Text or Writing"
          ]
        }
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
