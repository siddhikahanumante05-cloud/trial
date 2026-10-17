import { Kiln, KilnClass, KilnPeriod, ScoredKiln } from '../types';
import { enrichKilnWithGeoContext } from './geoContext';

export interface ParseResult {
  success: boolean;
  data?: Kiln[];
  error?: string;
}

export function parseKilnData(rawText: string, fileName: string): ParseResult {
  const isJson = fileName.toLowerCase().endsWith('.json') || rawText.trim().startsWith('[');

  if (isJson) {
    try {
      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) {
        return { success: false, error: 'JSON payload must be an array of kiln detection objects.' };
      }
      if (parsed.length === 0) {
        return { success: false, error: 'File contains an empty list of detections.' };
      }

      const validated: Kiln[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        const validationError = validateKilnItem(item, i + 1);
        if (validationError) {
          return { success: false, error: validationError };
        }
        validated.push(normalizeKiln(item));
      }
      return { success: true, data: validated };
    } catch (e: any) {
      return { success: false, error: `Invalid JSON syntax: ${e.message}` };
    }
  }

  // Parse CSV
  try {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) {
      return { success: false, error: 'CSV file must include a header line and at least one data row.' };
    }

    const header = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const requiredHeaders = ['id', 'lat', 'lon', 'class', 'confidence', 'angle_deg', 'width_m', 'height_m', 'period', 'tile_id', 'in_register'];
    const missing = requiredHeaders.filter((req) => !header.includes(req));
    if (missing.length > 0) {
      return { success: false, error: `Missing required CSV column headers: ${missing.join(', ')}` };
    }

    const validated: Kiln[] = [];
    for (let i = 1; i < lines.length; i++) {
      const rowValues = parseCsvLine(lines[i]);
      if (rowValues.length < header.length) {
        return { success: false, error: `Row ${i + 1} has insufficient columns (expected ${header.length}, got ${rowValues.length}).` };
      }

      const item: any = {};
      header.forEach((h, idx) => {
        item[h] = rowValues[idx];
      });

      const validationError = validateKilnItem(item, i + 1);
      if (validationError) {
        return { success: false, error: validationError };
      }
      validated.push(normalizeKiln(item));
    }

    return { success: true, data: validated };
  } catch (e: any) {
    return { success: false, error: `CSV parsing error: ${e.message}` };
  }
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

function validateKilnItem(item: any, rowNum: number): string | null {
  if (!item.id || typeof item.id !== 'string') {
    return `Row ${rowNum}: 'id' is required and must be a string.`;
  }
  const lat = Number(item.lat);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    return `Row ${rowNum}: 'lat' must be a valid number between -90 and 90.`;
  }
  const lon = Number(item.lon);
  if (isNaN(lon) || lon < -180 || lon > 180) {
    return `Row ${rowNum}: 'lon' must be a valid number between -180 and 180.`;
  }
  const validClasses: KilnClass[] = ['FCBK', 'CFCBK', 'Zigzag'];
  if (!validClasses.includes(item.class)) {
    return `Row ${rowNum}: 'class' must be one of 'FCBK', 'CFCBK', or 'Zigzag' (found '${item.class}').`;
  }
  const conf = Number(item.confidence);
  if (isNaN(conf) || conf < 0 || conf > 1) {
    return `Row ${rowNum}: 'confidence' must be a number between 0 and 1 (found '${item.confidence}').`;
  }
  const validPeriods: KilnPeriod[] = ['2023-24', '2025-26'];
  if (!validPeriods.includes(item.period)) {
    return `Row ${rowNum}: 'period' must be either '2023-24' or '2025-26' (found '${item.period}').`;
  }
  if (!item.tile_id) {
    return `Row ${rowNum}: 'tile_id' is required.`;
  }
  return null;
}

function normalizeKiln(item: any): Kiln {
  const inRegStr = String(item.in_register).toLowerCase();
  const inRegister = inRegStr === 'true' || inRegStr === '1' || inRegStr === 'yes';
  const claimedStr = String(item.claimed_conversion || '').toLowerCase();
  const claimed = claimedStr === 'true' || claimedStr === '1' || claimedStr === 'yes';

  const baseKiln: Kiln = {
    id: String(item.id),
    lat: Number(item.lat),
    lon: Number(item.lon),
    class: item.class as KilnClass,
    confidence: Number(item.confidence),
    angle_deg: Number(item.angle_deg || 0),
    width_m: Number(item.width_m || 24),
    height_m: Number(item.height_m || 68),
    period: item.period as KilnPeriod,
    tile_id: String(item.tile_id),
    in_register: inRegister,
    claimed_conversion: claimed,
    coordinate_precision: item.coordinate_precision || '±10m (Sentinel-2 10m GSD)',
    source: item.source || 'User Uploaded Detections',
    tehsil: item.tehsil,
    village: item.village,
    road_access: item.road_access,
    soil_type: item.soil_type,
    gee_scene_id: item.gee_scene_id,
  };

  return enrichKilnWithGeoContext(baseKiln);
}

export function generateSampleCsv(): string {
  return `id,lat,lon,class,confidence,angle_deg,width_m,height_m,period,tile_id,in_register
KLN-2023-001,26.9812,80.7645,FCBK,0.88,32,24,68,2023-24,tile_042,true
KLN-2025-001,26.9814,80.7648,Zigzag,0.84,30,22,62,2025-26,tile_042,true
KLN-2023-002,26.9754,80.7712,FCBK,0.91,75,26,72,2023-24,tile_042,true
KLN-2025-002,26.9756,80.7715,FCBK,0.86,74,26,70,2025-26,tile_042,true
KLN-2025-003,26.9780,80.7820,FCBK,0.58,45,28,74,2025-26,tile_042,false
KLN-2025-006,26.9860,80.7690,CFCBK,0.76,0,35,35,2025-26,tile_042,true`;
}

export function generateSampleJson(): string {
  return JSON.stringify(
    [
      {
        id: 'KLN-2023-001',
        lat: 26.9812,
        lon: 80.7645,
        class: 'FCBK',
        confidence: 0.88,
        angle_deg: 32,
        width_m: 24,
        height_m: 68,
        period: '2023-24',
        tile_id: 'tile_042',
        in_register: true,
      },
      {
        id: 'KLN-2025-001',
        lat: 26.9814,
        lon: 80.7648,
        class: 'Zigzag',
        confidence: 0.84,
        angle_deg: 30,
        width_m: 22,
        height_m: 62,
        period: '2025-26',
        tile_id: 'tile_042',
        in_register: true,
      },
      {
        id: 'KLN-2025-003',
        lat: 26.978,
        lon: 80.782,
        class: 'FCBK',
        confidence: 0.58,
        angle_deg: 45,
        width_m: 28,
        height_m: 74,
        period: '2025-26',
        tile_id: 'tile_042',
        in_register: false,
      },
    ],
    null,
    2
  );
}

export function exportTop20Csv(top20: ScoredKiln[]): string {
  const headers = [
    'rank',
    'id',
    'class',
    'confidence',
    'priority_score',
    'tehsil',
    'village',
    'road_access',
    'lat',
    'lon',
    'tile_id',
    'in_register',
    'cluster_id',
    'visit_order',
    'gee_scene_id',
    'primary_factors_reason',
  ];

  const rows = top20.map((k) => [
    k.rank,
    k.id,
    k.class,
    (k.confidence * 100).toFixed(0) + '%',
    k.priorityScore,
    `"${k.tehsil || 'Mohanlalganj'}"`,
    `"${k.village || 'Kalyanpur'}"`,
    `"${(k.road_access || 'Jeep 4WD track').replace(/"/g, '""')}"`,
    k.lat.toFixed(5),
    k.lon.toFixed(5),
    k.tile_id,
    k.in_register ? 'Yes' : 'No (To Verify)',
    k.clusterId || '1',
    k.clusterOrder || k.rank,
    `"${k.gee_scene_id || 'COPERNICUS/S2_SR'}"`,
    `"${k.oneLineReason.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
