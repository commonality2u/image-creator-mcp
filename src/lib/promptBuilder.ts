/**
 * Build a prompt by conditionally including user prompt, brand signature, and style JSON
 * @param user User's original prompt text (required)
 * @param brandSig Brand signature string (optional)
 * @param styleDefinition Style definition JSON object (optional)
 */
export function buildPrompt(user: string, brandSig?: string, styleDefinition?: Record<string, any>): string {
  console.error("[PROMPT_BUILDER] Function called with params:");
  console.error(`[PROMPT_BUILDER] user: "${user}"`);
  console.error(`[PROMPT_BUILDER] brandSig: ${brandSig ? `"${brandSig}"` : "undefined"}`);
  console.error(`[PROMPT_BUILDER] styleDefinition present: ${styleDefinition ? 'YES' : 'NO'}`);
  
  // Start with the user prompt - this is always required
  let finalPrompt = user;
  
  // Add brand signature if provided
  if (brandSig && brandSig.trim()) {
    finalPrompt = `${finalPrompt}\n\n--- BRAND SIGNATURE ---\n${brandSig}`;
    console.error(`[PROMPT_BUILDER] Added brand signature (${brandSig.length} chars)`);
  }
  
  // Add style definition JSON if provided
  if (styleDefinition && Object.keys(styleDefinition).length > 0) {
    // Stringify with indentation for readability
    const styleJson = JSON.stringify(styleDefinition, null, 2);
    finalPrompt = `${finalPrompt}\n\n--- STYLE DEFINITION (JSON) ---\n${styleJson}`;
    console.error(`[PROMPT_BUILDER] Added style definition JSON (${styleJson.length} chars)`);
  }
  
  console.error(`[PROMPT_BUILDER] Final prompt length: ${finalPrompt.length} chars`);
  console.error(`[PROMPT_BUILDER] Final prompt preview: ${finalPrompt.substring(0, Math.min(200, finalPrompt.length))}...`);
  
  return finalPrompt;
}
