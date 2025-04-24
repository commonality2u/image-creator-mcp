import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { openai } from '../src/lib/openaiClient.js'; // Mock target
import { app } from '../src/index.js'; // Import the exported app
import { save } from '../src/lib/fileSaver.js'; // Mock target
import path from 'node:path';
import { rm } from 'node:fs/promises'; // To clean up test files

// Mock the dependencies
vi.mock('../src/lib/openaiClient.js');
vi.mock('../src/lib/fileSaver.js');

describe('POST /createImage', () => {
  let server: any; // Use 'any' or proper type from 'http'
  let api: request.SuperTest<request.Test>;

  const testOutputDir = path.resolve(process.cwd(), 'public', 'test-output');
  const expectedFilePath = path.join('test-output', 'test-image.png'); // Relative path for response check

  beforeAll(async () => {
    // Start the server on a random available port
    server = app.listen(0);
    api = request(server);

    // Mock OpenAI response
    vi.mocked(openai.images.generate).mockResolvedValue({
      created: Date.now(), // Added created timestamp
      data: [{
        b64_json: Buffer.from('test-png-data').toString('base64'),
        revised_prompt: 'A revised blue square', // Added revised_prompt
      }],
    });

    // Mock fileSaver to return a predictable path and prevent actual file writing during test
    vi.mocked(save).mockImplementation(async (_buf, filename, saveDir) => {
        // Ensure saveDir is used if provided, otherwise default logic applies (though we provide it here)
        const baseDir = saveDir ?? path.resolve(process.cwd(), 'public');
        return path.join(baseDir, filename);
    });
  });

  afterAll(async () => {
    // Close the server
    await new Promise<void>((resolve, reject) => {
        server.close((err?: Error) => {
            if (err) return reject(err);
            resolve();
        });
    });
    // Clean up test output directory if it exists
    await rm(testOutputDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    // Reset mocks before each test if needed (though generate is simple here)
    vi.clearAllMocks();
     // Re-apply mocks as clearAllMocks clears them
    vi.mocked(openai.images.generate).mockResolvedValue({
      created: Date.now(),
      data: [{
        b64_json: Buffer.from('test-png-data').toString('base64'),
        revised_prompt: 'A revised blue square',
      }],
    });
     vi.mocked(save).mockImplementation(async (_buf, filename, saveDir) => {
        const baseDir = saveDir ?? path.resolve(process.cwd(), 'public');
        return path.join(baseDir, filename);
    });
  });

  it('should return 201 and image details on valid request', async () => {
    const requestBody = {
        prompt: 'Blue square',
        filename: 'test-image.png',
        outputPath: 'test-output' // Specify output path for test isolation
    };

    const res = await api
      .post('/createImage')
      .send(requestBody);

    // Check status and basic structure
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);

    // Check specific response fields
     expect(res.body.path).toBe(expectedFilePath); // Check relative path
     expect(res.body.bytes).toBe(Buffer.from('test-png-data').length);
     expect(res.body.model).toBe('gpt-image-1'); // Expect schema default model
     expect(res.body.prompt).toContain('Blue square'); // Check if original prompt is included
     expect(res.body.revised_prompt).toBe('A revised blue square');

    // Verify mocks were called correctly
     expect(openai.images.generate).toHaveBeenCalledTimes(1);
     expect(openai.images.generate).toHaveBeenCalledWith(expect.objectContaining({
         prompt: 'palette:#000,#FFF; tone:neutral\n\n---\nBlue square', // Check full default prompt
         model: 'gpt-image-1', // Expect schema default model
         response_format: 'b64_json',
         n: 1,
        size: '1024x1024', // Default size
        quality: 'standard', // Default quality mapped
    }));

    expect(save).toHaveBeenCalledTimes(1);
    // Check that save was called with the correct buffer, filename, and absolute directory
    expect(save).toHaveBeenCalledWith(
        Buffer.from('test-png-data'),
        'test-image.png',
        testOutputDir // Check absolute path
    );
  });

  it('should return 400 for invalid input (missing prompt)', async () => {
    const requestBody = {
        // prompt is missing
        filename: 'test-image.png'
    };

    const res = await api
      .post('/createImage')
      .send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Invalid input data');
    expect(res.body.details).toBeInstanceOf(Array);
    expect(res.body.details[0].message).toBe('Required'); // Zod error message
    expect(res.body.details[0].path).toEqual(['prompt']); // Zod error path

    // Ensure external calls were not made
    expect(openai.images.generate).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

   it('should return 400 for invalid input (invalid size)', async () => {
    const requestBody = {
        prompt: 'A circle',
        size: 'invalid-size' // Invalid enum value
    };

    const res = await api
      .post('/createImage')
      .send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Invalid input data');
    expect(res.body.details).toBeInstanceOf(Array);
    expect(res.body.details[0].message).toContain('Invalid enum value'); // Zod error message
    expect(res.body.details[0].path).toEqual(['size']); // Zod error path

    // Ensure external calls were not made
    expect(openai.images.generate).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  // Add more tests:
  // - Test fallback brandSignature logic (requires mocking fs/promises or dynamic import)
  // - Test different quality/size/model inputs
  // - Test error handling if OpenAI API fails
  // - Test error handling if file saving fails
});
