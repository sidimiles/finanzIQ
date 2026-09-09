// Simple keyword-based category suggestion. Matches against the default
// FinanzIQ categories — works out of the box, gets smarter if the user
// renames/adds categories that reuse these keywords.
const KEYWORD_MAP: { keywords: string[]; category: string }[] = [
  { keywords: ['migros', 'coop', 'aldi', 'lidl', 'denner', 'volg', 'supermarkt', 'lebensmittel'], category: 'Lebensmittel' },
  { keywords: ['miete', 'hypothek', 'nebenkosten', 'strom', 'wasser', 'gas', 'wohnen'], category: 'Wohnen' },
  { keywords: ['sbb', 'tankstelle', 'benzin', 'parkplatz', 'garage', 'uber', 'taxi', 'auto', 'zvv'], category: 'Transport' },
  { keywords: ['kino', 'restaurant', 'bar', 'ausgang', 'konzert', 'freizeit', 'hobby'], category: 'Freizeit' },
  { keywords: ['apotheke', 'arzt', 'zahnarzt', 'spital', 'krankenkasse', 'gesundheit'], category: 'Gesundheit' },
  { keywords: ['netflix', 'spotify', 'disney', 'amazon prime', 'abo', 'subscription', 'fitnessstudio'], category: 'Abos' },
  { keywords: ['lohn', 'salär', 'gehalt', 'salary'], category: 'Lohn' },
];

export function suggestCategory(description: string): string | null {
  const lower = description.toLowerCase().trim();
  if (!lower) return null;
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.category;
    }
  }
  return null;
}
