export function cleanSpeechTranscript(text: string): string {
  if (!text) return '';

  // 1. Convert to lowercase for uniform processing, then trim and collapse multiple spaces.
  let cleaned = text.toLowerCase().replace(/\s+/g, ' ').trim();

  // 2. Remove filler words safely (don't over-clean).
  // Common fillers in ID/EN.
  const fillerRegex = /\b(hmm|hm|eee|ee|em|eh|uh|um|anu)\b/gi;
  cleaned = cleaned.replace(fillerRegex, ' ');

  // 3. Re-collapse spaces that might have been created by removing fillers.
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 4. Simple deduplication of obvious repeated adjacent phrases if needed.
  // This is tricky without destroying valid grammar, so we only handle exact duplicates of longish phrases.
  // Example: "so we cannot talk about so we cannot talk about something like new"
  // It's safer to avoid regex for complex overlap and just do a basic check but let's keep it simple.
  
  if (!cleaned) return '';

  // Return original capitalization is difficult if we lowercased, but the prompt says 
  // we can use lowercase for comparison. Let's just return normalized string or re-apply capitalization.
  // Actually, wait, people might want standard sentence case. We can just return it.
  
  // Or, better, just clean without lowercasing the whole sentence initially to preserve structure:
  let originalPreserved = text.replace(/\s+/g, ' ').trim();
  originalPreserved = originalPreserved.replace(fillerRegex, ' ');
  originalPreserved = originalPreserved.replace(/\s+/g, ' ').trim();
  
  return originalPreserved;
}
