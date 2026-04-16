import { NextRequest, NextResponse } from "next/server";

type CityKey = "new-orleans" | "baton-rouge" | "houston";

// ── Service URLs ──────────────────────────────────────────────────────────────

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const NOLA_GEOCODE_URL =
  "https://gis.nola.gov/arcgis/rest/services/Address/AddressLocators/GeocodeServer/findAddressCandidates";
const NOLA_ZONING_URL =
  "https://maps.nola.gov/server/rest/services/landuseplanning/Land_Use_Planning_Layers/MapServer";

// East Baton Rouge Parish GIS (EBRGIS)
const BR_ZONING_URL =
  "https://maps.brla.gov/gis/rest/services/Cadastral/Zoning/MapServer";
const BR_OVERLAY_URL =
  "https://maps.brla.gov/gis/rest/services/Cadastral/Overlay_District/MapServer";
const BR_FLU_URL =
  "https://maps.brla.gov/gis/rest/services/Cadastral/Future_Land_Use/MapServer";

// City of Houston GIS (COHGIS) — Houston has no traditional zoning;
// HCAD land-use codes and planning overlays are the closest equivalent.
const HOU_LANDUSE_URL =
  "https://mycity2.houstontx.gov/pubgis02/rest/services/HoustonMap/Landuse/MapServer";
const HOU_PLANNING_URL =
  "https://mycity2.houstontx.gov/pubgis02/rest/services/HoustonMap/Planning_and_Development/MapServer";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeoPoint {
  x: number;
  y: number;
  address: string;
  score: number;
}

interface LayerFeature {
  attributes: Record<string, string | number | null>;
}

interface ZoningResult {
  address: string;
  city: CityKey;
  geocode: { x: number; y: number; score: number };
  zoning: {
    classification: string;
    description: string;
    ordinanceNumber: string | number | null;
    year: string | number | null;
    hyperlink: string | null;
  };
  overlays: { name: string }[];
  futureLandUse: { designation: string }[];
  conditionalUse: { name: string }[];
  inclusionaryZoning: boolean;
  note: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// WGS84 (EPSG:4326) → Web Mercator (EPSG:3857 / WKID 102100).
// All NOLA, BR, and Houston ArcGIS layers expect coordinates in WKID 102100.
function toWebMercator(lon: number, lat: number): { x: number; y: number } {
  const R = 6378137;
  return {
    x: lon * (Math.PI / 180) * R,
    y: Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * R,
  };
}

function detectCity(address: string): CityKey {
  const s = address.toLowerCase();
  if (s.includes("baton rouge") || /\b708\d{2}\b/.test(s)) return "baton-rouge";
  if (s.includes("houston") || s.includes(", tx") || s.includes(", texas") || /\b77[0-2]\d{2}\b/.test(s)) return "houston";
  return "new-orleans";
}

function appendCitySuffix(address: string, city: CityKey): string {
  const suffixes: Record<CityKey, string> = {
    "new-orleans": "New Orleans, LA",
    "baton-rouge": "Baton Rouge, LA",
    houston: "Houston, TX",
  };
  const marker = suffixes[city].toLowerCase();
  return address.toLowerCase().includes(marker) ? address : `${address}, ${suffixes[city]}`;
}

// ── Geocoders ─────────────────────────────────────────────────────────────────

async function geocodeWithNola(address: string): Promise<GeoPoint | null> {
  const params = new URLSearchParams({
    SingleLine: address,
    f: "json",
    outSR: "102100",
    maxLocations: "1",
  });
  const res = await fetch(`${NOLA_GEOCODE_URL}?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.candidates?.length) return null;
  const c = data.candidates[0];
  return { x: c.location.x, y: c.location.y, address: c.address, score: c.score };
}

// Nominatim is the fallback for all cities (and the primary geocoder for BR/Houston
// since they lack a public ArcGIS locator). Returns coordinates already converted
// to Web Mercator so callers don't need to care about the source.
async function geocodeWithNominatim(address: string): Promise<GeoPoint | null> {
  const params = new URLSearchParams({ q: address, format: "json", limit: "1" });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { "User-Agent": "RipeSpot/1.0" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const { lat, lon, display_name } = data[0] as {
    lat: string;
    lon: string;
    display_name: string;
  };
  const { x, y } = toWebMercator(parseFloat(lon), parseFloat(lat));
  return { x, y, address: display_name, score: 80 };
}

async function geocodeAddress(address: string, city: CityKey): Promise<GeoPoint | null> {
  if (city === "new-orleans") {
    try {
      const result = await geocodeWithNola(address);
      if (result) return result;
    } catch {
      // NOLA geocoder unavailable — fall through to Nominatim
    }
  }
  return geocodeWithNominatim(address);
}

// ── ArcGIS layer query ────────────────────────────────────────────────────────

async function queryArcGIS(
  baseUrl: string,
  layerId: number,
  x: number,
  y: number
): Promise<LayerFeature[]> {
  const geom = JSON.stringify({ x, y, spatialReference: { wkid: 102100 } });
  const params = new URLSearchParams({
    geometry: geom,
    geometryType: "esriGeometryPoint",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "false",
    f: "json",
  });
  const res = await fetch(`${baseUrl}/${layerId}/query?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features as LayerFeature[]) ?? [];
}

// ── City-specific zoning queries ──────────────────────────────────────────────

async function queryNolaZoning(
  x: number,
  y: number
): Promise<Omit<ZoningResult, "address" | "city" | "geocode" | "note">> {
  const [zoningFeats, overlayFeats, fluFeats, cuFeats, inclFeats] = await Promise.all([
    queryArcGIS(NOLA_ZONING_URL, 2, x, y),
    queryArcGIS(NOLA_ZONING_URL, 1, x, y),
    queryArcGIS(NOLA_ZONING_URL, 3, x, y),
    queryArcGIS(NOLA_ZONING_URL, 0, x, y),
    queryArcGIS(NOLA_ZONING_URL, 4, x, y),
  ]);
  const z = zoningFeats[0]?.attributes ?? {};
  return {
    zoning: {
      classification: (z.ZONECLASS ?? "Unknown") as string,
      description: (z.ZONEDESC ?? "Unknown") as string,
      ordinanceNumber: z.ORDNUM ?? null,
      year: z.ZONEYEAR ?? null,
      hyperlink: (z.HYPERLINK ?? null) as string | null,
    },
    overlays: overlayFeats.map((f) => ({
      name: (f.attributes.Name ?? f.attributes.OVERLAY ?? "Overlay") as string,
    })),
    futureLandUse: fluFeats.map((f) => ({
      designation: (f.attributes.FLUM ?? f.attributes.Name ?? "Unknown") as string,
    })),
    conditionalUse: cuFeats.map((f) => ({
      name: (f.attributes.Name ?? "Conditional Use") as string,
    })),
    inclusionaryZoning: inclFeats.length > 0,
  };
}

async function queryBatonRougeZoning(
  x: number,
  y: number
): Promise<Omit<ZoningResult, "address" | "city" | "geocode" | "note">> {
  const [zoningFeats, overlayFeats, fluFeats] = await Promise.all([
    queryArcGIS(BR_ZONING_URL, 0, x, y),
    queryArcGIS(BR_OVERLAY_URL, 0, x, y),
    queryArcGIS(BR_FLU_URL, 0, x, y),
  ]);
  const z = zoningFeats[0]?.attributes ?? {};
  return {
    zoning: {
      // EBRGIS field names vary by vintage; try most common aliases in order
      classification: (z.ZONING ?? z.ZONE_CLASS ?? z.ZONINGCLASS ?? z.Zone ?? "Unknown") as string,
      description: (z.ZONE_DESC ?? z.ZONING_DESC ?? z.ZoneDesc ?? z.DESCRIPTION ?? "Unknown") as string,
      ordinanceNumber: z.ORDNUM ?? z.ORD_NUM ?? null,
      year: z.YEAR ?? z.ZONE_YEAR ?? null,
      hyperlink: (z.HYPERLINK ?? null) as string | null,
    },
    overlays: overlayFeats.map((f) => ({
      name: (f.attributes.Name ?? f.attributes.OVERLAY_NAME ?? f.attributes.DISTRICT ?? "Overlay") as string,
    })),
    futureLandUse: fluFeats.map((f) => ({
      designation: (f.attributes.FLUM ?? f.attributes.FLU_DESC ?? f.attributes.Name ?? "Unknown") as string,
    })),
    conditionalUse: [],
    inclusionaryZoning: false,
  };
}

async function queryHoustonZoning(
  x: number,
  y: number
): Promise<Omit<ZoningResult, "address" | "city" | "geocode" | "note">> {
  const [landUseFeats, planningFeats] = await Promise.all([
    queryArcGIS(HOU_LANDUSE_URL, 0, x, y),       // HCAD parcels
    queryArcGIS(HOU_PLANNING_URL, 10, x, y),      // Special Minimum Lot Size overlay
  ]);
  const lu = landUseFeats[0]?.attributes ?? {};
  return {
    zoning: {
      classification: (lu.landuse_cd ?? lu.LANDUSE_CD ?? lu.STATE_CLASS ?? "N/A") as string,
      description: (lu.landuse_dscr ?? lu.LANDUSE_DSCR ?? lu.DESCRIPT ?? "No classification") as string,
      ordinanceNumber: null,
      year: null,
      hyperlink: null,
    },
    overlays: planningFeats.map((f) => ({
      name: (f.attributes.Name ?? f.attributes.DISTRICT ?? "Special District") as string,
    })),
    futureLandUse: [],
    conditionalUse: [],
    inclusionaryZoning: false,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");
  const cityParam = url.searchParams.get("city");

  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

  const VALID_CITIES: CityKey[] = ["new-orleans", "baton-rouge", "houston"];
  const city: CityKey =
    cityParam && (VALID_CITIES as string[]).includes(cityParam)
      ? (cityParam as CityKey)
      : detectCity(address);

  try {
    const fullAddress = appendCitySuffix(address, city);
    const location = await geocodeAddress(fullAddress, city);
    if (!location) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    let zoningData: Omit<ZoningResult, "address" | "city" | "geocode" | "note">;
    let note: string | null = null;

    if (city === "new-orleans") {
      zoningData = await queryNolaZoning(location.x, location.y);
    } else if (city === "baton-rouge") {
      zoningData = await queryBatonRougeZoning(location.x, location.y);
    } else {
      zoningData = await queryHoustonZoning(location.x, location.y);
      // Inform callers that Houston's "zoning" is HCAD land-use codes, not
      // a zoning ordinance — relevant for LIHTC QAP site scoring purposes.
      note =
        "Houston has no traditional zoning ordinance. Land-use codes from HCAD and planning overlays are shown instead.";
    }

    return NextResponse.json({
      address: location.address,
      city,
      geocode: { x: location.x, y: location.y, score: location.score },
      ...zoningData,
      note,
    } satisfies ZoningResult);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Zoning lookup failed" },
      { status: 500 }
    );
  }
}
