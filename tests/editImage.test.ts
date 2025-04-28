import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { openai } from '../src/lib/openaiClient.js'; // Mock target
import { app } from '../src/index.js'; // Import the exported app
import { save } from '../src/lib/fileSaver.js'; // Mock target
import path from 'node:path';
import { rm } from 'node:fs/promises'; // To clean up test files
import fs from 'node:fs';
import { toFile } from 'openai';

// Mock the dependencies
vi.mock('../src/lib/openaiClient.js');
vi.mock('../src/lib/fileSaver.js');
vi.mock('node:fs');
vi.mock('openai', async () => {
  const actual = await vi.importActual('openai');
  return {
    ...actual,
    toFile: vi.fn()
  };
});

describe('POST /createImage with referenceImagePaths', () => {
  let server: any; // Use 'any' or proper type from 'http'
  let api: request.SuperTest<request.Test>;

  const testOutputDir = path.resolve(process.cwd(), 'public', 'test-output');
  const expectedFilePath = path.join('test-output', 'test-edit-image.png'); // Relative path for response check
  const testRefImagePaths = ['test-images/image1.png', 'test-images/image2.png'];
  
  // Mock file objects that would be returned by toFile
  const mockFileObjects = [
    { path: 'image1.png' } as any,
    { path: 'image2.png' } as any
  ];

  beforeAll(async () => {
    // Start the server on a random available port
    server = app.listen(0);
    api = request(server);

    // Mock OpenAI edit API response
    vi.mocked(openai.images.edit).mockResolvedValue({
      created: Date.now(),
      data: [{
        b64_json: Buffer.from('test-edited-png-data').toString('base64'),
        revised_prompt: 'A revised combined image', 
      }],
    });

    // Mock toFile function
    vi.mocked(toFile).mockImplementation(async (_stream, _filename, _options) => {
      // Return mock file object based on position in call sequence
      return mockFileObjects[vi.mocked(toFile).mock.calls.length - 1];
    });

    // Mock createReadStream
    vi.mocked(fs.createReadStream).mockImplementation((_path) => {
      return 'mock-stream' as any;
    });

    // Mock fileSaver to return a predictable path and prevent actual file writing during test
    vi.mocked(save).mockImplementation(async (_buf, filename, saveDir) => {
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
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Re-apply mocks as clearAllMocks clears them
    vi.mocked(openai.images.edit).mockResolvedValue({
      created: Date.now(),
      data: [{
        b64_json: Buffer.from('test-edited-png-data').toString('base64'),
        revised_prompt: 'A revised combined image',
      }],
    });
    
    vi.mocked(toFile).mockImplementation(async (_stream, _filename, _options) => {
      return mockFileObjects[vi.mocked(toFile).mock.calls.length - 1];
    });
    
    vi.mocked(fs.createReadStream).mockImplementation((_path) => {
      return 'mock-stream' as any;
    });
    
    vi.mocked(save).mockImplementation(async (_buf, filename, saveDir) => {
      const baseDir = saveDir ?? path.resolve(process.cwd(), 'public');
      return path.join(baseDir, filename);
    });
  });

  it('should use images.edit API when referenceImagePaths are provided', async () => {
    const requestBody = {
      prompt: 'Combine these images into a gift basket',
      filename: 'test-edit-image.png',
      outputPath: 'test-output',
      referenceImagePaths: testRefImagePaths
    };

    const res = await api
      .post('/createImage')
      .send(requestBody);

    // Check status and basic structure
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);

    // Check specific response fields
    expect(res.body.path).toBe(expectedFilePath);
    expect(res.body.bytes).toBe(Buffer.from('test-edited-png-data').length);
    expect(res.body.model).toBe('gpt-image-1'); // Should always be gpt-image-1 for edits
    expect(res.body.prompt).toContain('Combine these images into a gift basket');
    expect(res.body.revised_prompt).toBe('A revised combined image');
    expect(res.body.operation).toBe('edit');
    expect(res.body.referenceImages).toEqual(testRefImagePaths);

    // Verify mocks were called correctly
    expect(fs.createReadStream).toHaveBeenCalledTimes(2);
    expect(toFile).toHaveBeenCalledTimes(2);
    
    // Expect images.edit to be called, not images.generate
    expect(openai.images.edit).toHaveBeenCalledTimes(1);
    expect(openai.images.edit).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-image-1',
      image: mockFileObjects, 
      prompt: expect.stringContaining('Combine these images into a gift basket'),
      n: 1
    }));
    expect(openai.images.generate).not.toHaveBeenCalled();

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(
      Buffer.from('test-edited-png-data'),
      'test-edit-image.png',
      testOutputDir
    );
  });

  it('should handle errors when loading reference images', async () => {
    // Setup error for createReadStream
    vi.mocked(fs.createReadStream).mockImplementationOnce(() => {
      throw new Error('File not found');
    });

    const requestBody = {
      prompt: 'Combine these images',
      filename: 'test-error-image.png',
      outputPath: 'test-output',
      referenceImagePaths: ['nonexistent-image.png']
    };

    const res = await api
      .post('/createImage')
      .send(requestBody);

    // Check error response
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain('Failed to load reference image');
    
    // Ensure API calls were not made
    expect(openai.images.edit).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('should automatically use gpt-image-1 model even if another model is specified', async () => {
    const requestBody = {
      prompt: 'Edit this image',
      filename: 'test-model-override.png',
      model: 'dall-e-3', // This should be overridden
      outputPath: 'test-output',
      referenceImagePaths: testRefImagePaths
    };

    const res = await api
      .post('/createImage')
      .send(requestBody);

    // Check that the response shows gpt-image-1 was used despite requesting dall-e-3
    expect(res.status).toBe(201);
    expect(res.body.model).toBe('gpt-image-1');
    expect(res.body.operation).toBe('edit');
    
    // Verify edit API was called with correct model
    expect(openai.images.edit).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-image-1'
    }));
  });
});
