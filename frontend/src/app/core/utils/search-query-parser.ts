/**
 * Turns a natural-language search ("2-bedroom in Bole under 30,000 birr with parking")
 * into the query params the /properties page understands.
 */

export interface ParsedSearch {
  city?: string;
  type?: string;
  maxPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  features: string[];
}

/** Areas first, cities after, so "Bole, Addis Ababa" resolves to the more specific "Bole". */
export const KNOWN_PLACES: readonly string[] = [
  'Bole',
  'CMC',
  'Kazanchis',
  'Sarbet',
  'Addis Ababa',
  'Hawassa',
  'Mekelle',
  'Bahir Dar',
  'Dire Dawa',
  'Adama',
  'Jimma',
  'Gondar',
];

const TYPE_RULES: ReadonlyArray<[RegExp, string]> = [
  [/\bcondo(?:minium)?s?\b/i, 'Condominium'],
  [/\b(?:villa|house)s?\b/i, 'Villa'],
  [/\b(?:studio|room)s?\b/i, 'Studio'],
  [/\b(?:commercial|office|shop|store)s?\b/i, 'Commercial'],
  [/\b(?:apartment|flat)s?\b/i, 'Apartment'],
];

const FEATURE_RULES: ReadonlyArray<[RegExp, string]> = [
  [/\b(?:parking|garage)\b/i, 'parking'],
  [/\bbalcon(?:y|ies)\b/i, 'balcony'],
  [/\bgarden\b/i, 'garden'],
  [/\b(?:elevator|lift)\b/i, 'elevator'],
  [/\bfurnished\b/i, 'furnished'],
  [/\bpet[- ]?friendly\b/i, 'pet-friendly'],
];

const BEDROOMS = /(\d+)\s*[- ]?\s*(?:bed(?:room)?s?|br|rooms?)\b/i;
const MAX_PRICE =
  /(?:under|below|less than|up to|max(?:imum)?|within|<=?)\s*(?:etb|birr|br)?\s*(\d[\d,.]*)\s*(k|thousand)?\s*(?:etb|birr)?/i;
const BARE_PRICE = /(\d[\d,.]*)\s*(k|thousand)?\s*(?:etb|birr)\b/i;
const MIN_AREA =
  /(?:at least|min(?:imum)?|>=?)?\s*(\d+)\s*(?:m²|m2|sqm|sq\.?\s?m|square\s*met(?:er|re)s?)/i;

function toNumber(raw: string, suffix?: string): number {
  const n = parseFloat(raw.replace(/,/g, ''));
  return suffix ? n * 1000 : n;
}

export function parseSearchQuery(input: string): ParsedSearch {
  const result: ParsedSearch = { features: [] };
  let text = (input ?? '').trim();
  if (!text) return result;

  // Order matters: pull out numeric phrases first so "2 rooms" is not mistaken for a "room" type.
  const bedrooms = text.match(BEDROOMS);
  if (bedrooms) {
    result.minBedrooms = parseInt(bedrooms[1], 10);
    text = text.replace(bedrooms[0], ' ');
  }

  const area = text.match(MIN_AREA);
  if (area) {
    result.minArea = parseInt(area[1], 10);
    text = text.replace(area[0], ' ');
  }

  const price = text.match(MAX_PRICE) ?? text.match(BARE_PRICE);
  if (price) {
    result.maxPrice = toNumber(price[1], price[2]);
    text = text.replace(price[0], ' ');
  }

  for (const [pattern, label] of FEATURE_RULES) {
    if (pattern.test(text)) result.features.push(label);
  }

  for (const [pattern, value] of TYPE_RULES) {
    if (pattern.test(text)) {
      result.type = value;
      break;
    }
  }

  const lower = text.toLowerCase();
  const place = KNOWN_PLACES.find((p) => new RegExp(`\\b${p.toLowerCase()}\\b`).test(lower));
  if (place) result.city = place;

  // Nothing recognised at all: treat the whole phrase as a place name (e.g. "Piassa").
  const recognised =
    result.type ||
    result.maxPrice ||
    result.minBedrooms ||
    result.minArea ||
    result.features.length;
  if (!result.city && !recognised) result.city = input.trim();

  return result;
}

/** Query params for `router.navigate(['/properties'], { queryParams })`. */
export function toQueryParams(parsed: ParsedSearch): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (parsed.city) params['city'] = parsed.city;
  if (parsed.type) params['type'] = parsed.type;
  if (parsed.maxPrice) params['maxPrice'] = parsed.maxPrice;
  if (parsed.minBedrooms) params['minBedrooms'] = parsed.minBedrooms;
  if (parsed.minArea) params['minArea'] = parsed.minArea;
  if (parsed.features.length) params['features'] = parsed.features.join(',');
  return params;
}
