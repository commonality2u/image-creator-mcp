/**
 * Prepend brandSignature so the LLM gets style guidance without huge files.
 */
export function buildPrompt(user: string, brandSig: string) {
  return `${brandSig}\n\n---\n${user}`;
}
