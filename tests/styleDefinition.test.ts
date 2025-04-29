import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildPrompt } from '../src/lib/promptBuilder.js';

describe('Enhanced prompt builder for create_image tool', () => {
  beforeEach(() => {
    // Reset console.error spy before each test
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('user prompt only', () => {
    it('should return only the user prompt when no other parameters are provided', () => {
      const result = buildPrompt("Generate a blue square");
      expect(result).toBe("Generate a blue square");
    });
  });

  describe('with brand signature', () => {
    it('should append brand signature when provided', () => {
      const result = buildPrompt(
        "Generate a blue square",
        "palette:#0EA5E9,#0F172A; tone:Clean"
      );
      
      expect(result).toContain("Generate a blue square");
      expect(result).toContain("--- BRAND SIGNATURE ---");
      expect(result).toContain("palette:#0EA5E9,#0F172A; tone:Clean");
    });

    it('should handle empty brand signature', () => {
      const result = buildPrompt("Generate a blue square", "");
      expect(result).toBe("Generate a blue square");
    });
  });

  describe('with style definition JSON', () => {
    it('should append stringified style definition JSON when provided', () => {
      const styleDefinition = {
        visual_tone: {
          style: "Abstract, minimalist",
          color_palette: {
            base: "Cool neutral tones"
          }
        }
      };
      
      const result = buildPrompt("Generate a blue square", undefined, styleDefinition);
      
      expect(result).toContain("Generate a blue square");
      expect(result).toContain("--- STYLE DEFINITION (JSON) ---");
      expect(result).toContain(JSON.stringify(styleDefinition, null, 2));
    });

    it('should handle complex style definition', () => {
      const styleDefinition = {
        output_requirements: {
          color_mode: "Full Vibrant Color Photography",
          style: "Abstract Conceptual Realism"
        },
        color_palette: {
          primary_accent: {
            name: "Primary Blue",
            hex: "#1474F3"
          },
          supporting_colors: [
            { name: "Deep Navy", hex: "#1C2B4A" },
            { name: "Warm Neutral", hex: "#E8D7C1" }
          ]
        },
        strict_exclusions: [
          "No Black and White or Monochrome output",
          "No Text or Writing"
        ]
      };
      
      const result = buildPrompt("Abstract representation of Law", undefined, styleDefinition);
      
      expect(result).toContain("Abstract representation of Law");
      expect(result).toContain("--- STYLE DEFINITION (JSON) ---");
      // The JSON should be formatted with indentation
      expect(result).toContain('"output_requirements": {');
      expect(result).toContain('"color_mode": "Full Vibrant Color Photography"');
    });

    it('should handle empty style definition object', () => {
      const result = buildPrompt("Generate a blue square", undefined, {});
      expect(result).toBe("Generate a blue square");
    });
  });

  describe('with both brand signature and style definition', () => {
    it('should include both brand signature and style definition in correct order', () => {
      const brandSig = "palette:#0EA5E9,#0F172A; tone:Clean";
      const styleDefinition = {
        visual_elements: {
          lighting: "Soft directional studio light"
        }
      };
      
      const result = buildPrompt("Create a logo", brandSig, styleDefinition);
      
      // Check content
      expect(result).toContain("Create a logo");
      expect(result).toContain("--- BRAND SIGNATURE ---");
      expect(result).toContain(brandSig);
      expect(result).toContain("--- STYLE DEFINITION (JSON) ---");
      expect(result).toContain(JSON.stringify(styleDefinition, null, 2));
      
      // Check order
      const brandIndex = result.indexOf("--- BRAND SIGNATURE ---");
      const styleIndex = result.indexOf("--- STYLE DEFINITION (JSON) ---");
      expect(brandIndex).toBeLessThan(styleIndex);
    });
  });

  describe('console logging', () => {
    it('should log debugging information about the prompt construction', () => {
      buildPrompt("Test prompt", "test brand", { test: true });
      
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining("[PROMPT_BUILDER] Function called with params:"));
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Final prompt length:"));
    });
  });
});
