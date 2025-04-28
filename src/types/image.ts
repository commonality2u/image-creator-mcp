import { z } from 'zod';

export const imageReqSchema = z.object({
  prompt: z.string().min(3)
    .describe("Detailed text description of the desired image."),
  brandSignature: z.string().optional()
    .describe("Optional branding guidelines (e.g., 'palette:#...; font:...')"),
  size: z.enum(['1024x1024', '1024x1536', '1536x1024']).optional().default('1024x1024')
    .describe("Image dimensions (default: 1024x1024)."),
  // Added 'auto' based on documentation
  quality: z.enum(['low', 'medium', 'high', 'auto']).optional().default('medium')
    .describe("Image quality (default: medium). 'auto' lets the model choose."),
  background: z.enum(['transparent', 'opaque']).optional().default('opaque')
    .describe("Background type (default: opaque). 'transparent' requires PNG/WEBP format."),
  model: z.enum(['gpt-image-1', 'dall-e-3', 'dall-e-2']).optional().default('gpt-image-1')
    .describe("OpenAI model to use (default: gpt-image-1). Server may fallback to dall-e-3."),
  filename: z.string().optional()
    .describe("Suggested filename for the saved image (e.g., 'logo.png'). Include extension."),
  outputPath: z.string().optional()
    .describe("Subdirectory within the target project's public folder to save the image (e.g., 'icons')."),
  targetProjectDir: z.string().optional()
    .describe("Absolute path to the target project directory where the image should be saved."),
  referenceImagePaths: z.array(z.string()).optional()
    .describe("Optional array of image paths (relative to targetProjectDir's public folder) to use as references for editing or combining images."),
});

export type ImageRequest = z.infer<typeof imageReqSchema>;
