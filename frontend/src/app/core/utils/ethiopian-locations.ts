/**
 * Comprehensive geographic coordinates database for Ethiopian cities,
 * Addis Ababa sub-cities, and popular residential/commercial neighborhoods (sefers).
 */

export interface GeoLocation {
  lat: number;
  lon: number;
  label: string;
}

export const ETHIOPIAN_LOCATIONS: Record<string, GeoLocation> = {
  // ── Addis Ababa Neighborhoods & Areas ──
  'kazanchis': { lat: 9.0175, lon: 38.7686, label: 'Kazanchis, Addis Ababa' },
  'kazanchis business district': { lat: 9.0175, lon: 38.7686, label: 'Kazanchis, Addis Ababa' },
  'kasanchis': { lat: 9.0175, lon: 38.7686, label: 'Kazanchis, Addis Ababa' },
  'bole': { lat: 8.9950, lon: 38.7885, label: 'Bole, Addis Ababa' },
  'bole medhanialem': { lat: 8.9968, lon: 38.7877, label: 'Bole Medhanialem, Addis Ababa' },
  'medhanialem': { lat: 8.9968, lon: 38.7877, label: 'Bole Medhanialem, Addis Ababa' },
  'atlas': { lat: 9.0065, lon: 38.7801, label: 'Bole Atlas, Addis Ababa' },
  'bole atlas': { lat: 9.0065, lon: 38.7801, label: 'Bole Atlas, Addis Ababa' },
  'bole brass': { lat: 8.9912, lon: 38.7845, label: 'Bole Brass, Addis Ababa' },
  'brass': { lat: 8.9912, lon: 38.7845, label: 'Bole Brass, Addis Ababa' },
  'bole bulbula': { lat: 8.9650, lon: 38.7850, label: 'Bole Bulbula, Addis Ababa' },
  'bulbula': { lat: 8.9650, lon: 38.7850, label: 'Bulbula, Addis Ababa' },
  'bole rwanda': { lat: 8.9980, lon: 38.7750, label: 'Bole Rwanda, Addis Ababa' },
  'rwanda': { lat: 8.9980, lon: 38.7750, label: 'Bole Rwanda, Addis Ababa' },
  'bole japan': { lat: 8.9920, lon: 38.7780, label: 'Bole Japan, Addis Ababa' },
  'japan': { lat: 8.9920, lon: 38.7780, label: 'Bole Japan, Addis Ababa' },
  'bole michael': { lat: 8.9780, lon: 38.7650, label: 'Bole Michael, Addis Ababa' },
  'bole arabsa': { lat: 8.9800, lon: 38.8750, label: 'Bole Arabsa, Addis Ababa' },
  'arabsa': { lat: 8.9800, lon: 38.8750, label: 'Bole Arabsa, Addis Ababa' },
  'cmc': { lat: 9.0225, lon: 38.8520, label: 'CMC, Addis Ababa' },
  'cmc michael': { lat: 9.0260, lon: 38.8580, label: 'CMC Michael, Addis Ababa' },
  'ayat': { lat: 9.0250, lon: 38.8780, label: 'Ayat, Addis Ababa' },
  'ayat zone 1': { lat: 9.0250, lon: 38.8780, label: 'Ayat, Addis Ababa' },
  'ayat zone 2': { lat: 9.0270, lon: 38.8820, label: 'Ayat, Addis Ababa' },
  'summit': { lat: 9.0050, lon: 38.8680, label: 'Summit, Addis Ababa' },
  'summit safari': { lat: 9.0070, lon: 38.8720, label: 'Summit Safari, Addis Ababa' },
  'sarbet': { lat: 8.9980, lon: 38.7350, label: 'Sarbet, Addis Ababa' },
  'bisrate gabriel': { lat: 8.9890, lon: 38.7300, label: 'Bisrate Gabriel, Addis Ababa' },
  'old airport': { lat: 8.9850, lon: 38.7380, label: 'Old Airport, Addis Ababa' },
  'mexico': { lat: 9.0105, lon: 38.7445, label: 'Mexico Square, Addis Ababa' },
  'tor hailoch': { lat: 9.0120, lon: 38.7250, label: 'Tor Hailoch, Addis Ababa' },
  'piassa': { lat: 9.0350, lon: 38.7525, label: 'Piassa, Addis Ababa' },
  'piazza': { lat: 9.0350, lon: 38.7525, label: 'Piassa, Addis Ababa' },
  'arada': { lat: 9.0380, lon: 38.7550, label: 'Arada, Addis Ababa' },
  '4 kilo': { lat: 9.0340, lon: 38.7620, label: '4 Kilo, Addis Ababa' },
  'four kilo': { lat: 9.0340, lon: 38.7620, label: '4 Kilo, Addis Ababa' },
  '6 kilo': { lat: 9.0480, lon: 38.7610, label: '6 Kilo, Addis Ababa' },
  'six kilo': { lat: 9.0480, lon: 38.7610, label: '6 Kilo, Addis Ababa' },
  'megenagna': { lat: 9.0205, lon: 38.8020, label: 'Megenagna, Addis Ababa' },
  'gerji': { lat: 8.9980, lon: 38.8150, label: 'Gerji, Addis Ababa' },
  'gerji roba': { lat: 8.9950, lon: 38.8220, label: 'Gerji Roba, Addis Ababa' },
  'gerji mebrat hail': { lat: 9.0010, lon: 38.8120, label: 'Gerji Mebrat Hail, Addis Ababa' },
  'hayahulet': { lat: 9.0160, lon: 38.7880, label: 'Hayahulet (22), Addis Ababa' },
  '22': { lat: 9.0160, lon: 38.7880, label: 'Hayahulet (22), Addis Ababa' },
  '22 mazoria': { lat: 9.0160, lon: 38.7880, label: 'Hayahulet Mazoria, Addis Ababa' },
  'gotera': { lat: 8.9880, lon: 38.7580, label: 'Gotera, Addis Ababa' },
  'kera': { lat: 8.9970, lon: 38.7490, label: 'Kera, Addis Ababa' },
  'lebu': { lat: 8.9600, lon: 38.7180, label: 'Lebu, Addis Ababa' },
  'lebu varnero': { lat: 8.9580, lon: 38.7120, label: 'Lebu Varnero, Addis Ababa' },
  'jemo': { lat: 8.9500, lon: 38.7050, label: 'Jemo, Addis Ababa' },
  'jemo 1': { lat: 8.9550, lon: 38.7100, label: 'Jemo 1, Addis Ababa' },
  'jemo 2': { lat: 8.9480, lon: 38.7000, label: 'Jemo 2, Addis Ababa' },
  'jemo 3': { lat: 8.9400, lon: 38.6920, label: 'Jemo 3, Addis Ababa' },
  'haile garment': { lat: 8.9520, lon: 38.7350, label: 'Haile Garment, Addis Ababa' },
  'lafto': { lat: 8.9700, lon: 38.7280, label: 'Lafto, Addis Ababa' },
  'nifas silk': { lat: 8.9750, lon: 38.7500, label: 'Nifas Silk, Addis Ababa' },
  'nefas silk': { lat: 8.9750, lon: 38.7500, label: 'Nifas Silk, Addis Ababa' },
  'saris': { lat: 8.9600, lon: 38.7650, label: 'Saris, Addis Ababa' },
  'kality': { lat: 8.9250, lon: 38.7680, label: 'Kality, Addis Ababa' },
  'gullele': { lat: 9.0650, lon: 38.7400, label: 'Gullele, Addis Ababa' },
  'shiro meda': { lat: 9.0620, lon: 38.7620, label: 'Shiro Meda, Addis Ababa' },
  'entoto': { lat: 9.0850, lon: 38.7620, label: 'Entoto, Addis Ababa' },
  'kolfe': { lat: 9.0150, lon: 38.7050, label: 'Kolfe, Addis Ababa' },
  'kolfe keranio': { lat: 9.0150, lon: 38.7050, label: 'Kolfe Keranio, Addis Ababa' },
  'addis ketema': { lat: 9.0320, lon: 38.7350, label: 'Addis Ketema, Addis Ababa' },
  'merkato': { lat: 9.0280, lon: 38.7380, label: 'Merkato, Addis Ababa' },
  'autobus tera': { lat: 9.0360, lon: 38.7350, label: 'Autobus Tera, Addis Ababa' },
  'lideta': { lat: 9.0120, lon: 38.7320, label: 'Lideta, Addis Ababa' },
  'yeka': { lat: 9.0350, lon: 38.8150, label: 'Yeka, Addis Ababa' },
  'ferensay': { lat: 9.0550, lon: 38.7850, label: 'Ferensay, Addis Ababa' },
  'ferensay legasion': { lat: 9.0550, lon: 38.7850, label: 'Ferensay Legasion, Addis Ababa' },
  'kotebe': { lat: 9.0300, lon: 38.8350, label: 'Kotebe, Addis Ababa' },
  'kara': { lat: 9.0380, lon: 38.8650, label: 'Kara, Addis Ababa' },
  'lamberet': { lat: 9.0250, lon: 38.8180, label: 'Lamberet, Addis Ababa' },
  'jackros': { lat: 9.0080, lon: 38.8300, label: 'Jackros, Addis Ababa' },
  'figa': { lat: 9.0120, lon: 38.8450, label: 'Figa, Addis Ababa' },
  'gororo': { lat: 9.0180, lon: 38.8600, label: 'Gororo, Addis Ababa' },
  'tafo': { lat: 9.0700, lon: 38.8900, label: 'Tafo, Addis Ababa' },
  'tuludimtu': { lat: 8.8950, lon: 38.7850, label: 'Tulu Dimtu, Addis Ababa' },
  'tulu dimtu': { lat: 8.8950, lon: 38.7850, label: 'Tulu Dimtu, Addis Ababa' },
  'koye feche': { lat: 8.9100, lon: 38.8300, label: 'Koye Feche, Addis Ababa' },
  'kirkos': { lat: 9.0080, lon: 38.7580, label: 'Kirkos, Addis Ababa' },
  'lemi kura': { lat: 9.0200, lon: 38.8600, label: 'Lemi Kura, Addis Ababa' },

  // ── Ethiopian Regional Cities ──
  'addis ababa': { lat: 9.0192, lon: 38.7525, label: 'Addis Ababa' },
  'adama': { lat: 8.5400, lon: 39.2700, label: 'Adama' },
  'nazret': { lat: 8.5400, lon: 39.2700, label: 'Adama (Nazret)' },
  'hawassa': { lat: 7.0504, lon: 38.4759, label: 'Hawassa' },
  'awassa': { lat: 7.0504, lon: 38.4759, label: 'Hawassa' },
  'bahir dar': { lat: 11.5936, lon: 37.3908, label: 'Bahir Dar' },
  'dire dawa': { lat: 9.5931, lon: 41.8661, label: 'Dire Dawa' },
  'bishoftu': { lat: 8.7523, lon: 38.9785, label: 'Bishoftu' },
  'debre zeyit': { lat: 8.7523, lon: 38.9785, label: 'Bishoftu (Debre Zeyit)' },
  'mekelle': { lat: 13.4967, lon: 39.4753, label: 'Mekelle' },
  'gondar': { lat: 12.6000, lon: 37.4667, label: 'Gondar' },
  'jimma': { lat: 7.6670, lon: 36.8330, label: 'Jimma' },
  'dessie': { lat: 11.1300, lon: 39.6300, label: 'Dessie' },
  'jigjiga': { lat: 9.3500, lon: 42.8000, label: 'Jigjiga' },
  'harar': { lat: 9.3100, lon: 42.1200, label: 'Harar' },
  'wolaita sodo': { lat: 6.8600, lon: 37.7600, label: 'Wolaita Sodo' },
  'arbaminch': { lat: 6.0200, lon: 37.5500, label: 'Arba Minch' },
  'debre birhan': { lat: 9.6800, lon: 39.5300, label: 'Debre Birhan' },
  'shashemene': { lat: 7.2000, lon: 38.6000, label: 'Shashemene' }
};

export const DEFAULT_ETHIOPIAN_COORDINATES: GeoLocation = {
  lat: 9.0192,
  lon: 38.7525,
  label: 'Addis Ababa'
};

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Resolves latitude and longitude coordinates from explicit coordinates or text fields
 * (neighborhood, landmark, subCity, city, region).
 */
export function resolvePropertyCoordinates(options: {
  latitude?: number | null;
  longitude?: number | null;
  neighborhood?: string | null;
  landmark?: string | null;
  subCity?: string | null;
  city?: string | null;
  region?: string | null;
}): { lat: number; lon: number; isExact: boolean; label: string } {
  const { latitude, longitude } = options;

  // 1. If explicit non-zero finite coordinates exist, use them directly
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    (latitude !== 0 || longitude !== 0)
  ) {
    const locLabel = [options.neighborhood, options.subCity, options.city].filter(Boolean).join(', ');
    return { lat: latitude, lon: longitude, isExact: true, label: locLabel || 'Property Location' };
  }

  // 2. Try to match neighborhood, landmark, subCity, city
  const candidates = [
    options.neighborhood,
    options.landmark,
    options.subCity,
    options.city,
    options.region
  ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

  for (const candidate of candidates) {
    const norm = normalizeKey(candidate);
    if (!norm) continue;

    // Direct match
    if (ETHIOPIAN_LOCATIONS[norm]) {
      const match = ETHIOPIAN_LOCATIONS[norm];
      return { lat: match.lat, lon: match.lon, isExact: false, label: match.label };
    }

    // Match each word or sub-phrase
    for (const [key, loc] of Object.entries(ETHIOPIAN_LOCATIONS)) {
      if (norm === key || norm.includes(key) || key.includes(norm)) {
        return { lat: loc.lat, lon: loc.lon, isExact: false, label: loc.label };
      }
    }
  }

  // 3. Fallback to Addis Ababa default
  return {
    lat: DEFAULT_ETHIOPIAN_COORDINATES.lat,
    lon: DEFAULT_ETHIOPIAN_COORDINATES.lon,
    isExact: false,
    label: DEFAULT_ETHIOPIAN_COORDINATES.label
  };
}
