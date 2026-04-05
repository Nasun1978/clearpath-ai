import { NextRequest, NextResponse } from "next/server";

const NOLA_GEOCODE_URL =
  "https://gis.nola.gov/arcgis/rest/services/Address/AddressLocators/GeocodeServer/findAddressCandidates";
const NOLA_ZONING_URL =
  "https://maps.nola.gov/server/rest/services/landuseplanning/Land_Use_Planning_Layers/MapServer";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface GeoPoint {
  x: number;
  y: number;
  address: string;
  score: number;
}

// WGS84 (EPSG:4326) → Web Mercator (EPSG:3857 / WKID 102100)
// The NOLA ArcGIS layers expect coordinates in WKID 102100.
function toWebMercator(lon: number, lat: number): { x: number; y: number } {
  const R = 6378137;
  const x = lon * (Math.PI / 180) * R;
  const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * R;
  return { x, y };
}

async function geocodeWithNola(address: string): Promise<GeoPoint | null> {
  const params = new URLSearchParams({
    SingleLine: address,
    f: "json",
    outSR: "102100",
    maxLocations: "1",
  });
  const res = await fetch(NOLA_GEOCODE_URL + "?" + params);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.candidates || data.candidates.length === 0) return null;
  const c = data.candidates[0];
  return { x: c.location.x, y: c.location.y, address: c.address, score: c.score };
}

// Nominatim is used as a fallback when the NOLA geocoder returns no results.
// Nominatim returns WGS84; we convert to Web Mercator before querying the
// NOLA ArcGIS layers which require WKID 102100.
async function geocodeWithNominatim(address: string): Promise<GeoPoint | null> {
  const params = new URLSearchParams({
    q: address,
    format: "json",
    limit: "1",
    addressdetails: "0",
  });
  const res = await fetch(NOMINATIM_URL + "?" + params, {
    headers: { "User-Agent": "ClearPathAI/1.0" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const { lat, lon, display_name } = data[0];
  const { x, y } = toWebMercator(parseFloat(lon), parseFloat(lat));
  return { x, y, address: display_name, score: 80 };
}

async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  try {
    const result = await geocodeWithNola(address);
    if (result) return result;
  } catch {
    // NOLA geocoder unavailable — fall through to Nominatim
  }
  return geocodeWithNominatim(address);
}

interface LayerFeature {
  attributes: Record<string, string | number | null>;
}

async function queryLayer(layerId: number, x: number, y: number): Promise<LayerFeature[]> {
  const geom = JSON.stringify({ x, y, spatialReference: { wkid: 102100 } });
  const params = new URLSearchParams({
    geometry: geom,
    geometryType: "esriGeometryPoint",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "false",
    f: "json",
  });
  const res = await fetch(NOLA_ZONING_URL + "/" + layerId + "/query?" + params);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features as LayerFeature[]) || [];
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");
  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

  try {
    const fullAddress = address.includes("New Orleans")
      ? address
      : address + ", New Orleans, LA";

    const location = await geocodeAddress(fullAddress);
    if (!location) {
      return NextResponse.json({ error: "Address not found in New Orleans" }, { status: 404 });
    }

    const [zoning, overlays, futureLandUse, conditionalUse, inclusionary] = await Promise.all([
      queryLayer(2, location.x, location.y),
      queryLayer(1, location.x, location.y),
      queryLayer(3, location.x, location.y),
      queryLayer(0, location.x, location.y),
      queryLayer(4, location.x, location.y),
    ]);

    const z = zoning[0]?.attributes ?? {};

    return NextResponse.json({
      address: location.address,
      geocode: { x: location.x, y: location.y, score: location.score },
      zoning: {
        classification: z.ZONECLASS ?? "Unknown",
        description: z.ZONEDESC ?? "Unknown",
        ordinanceNumber: z.ORDNUM ?? null,
        year: z.ZONEYEAR ?? null,
        hyperlink: z.HYPERLINK ?? null,
      },
      overlays: overlays.map((f) => ({
        name: (f.attributes.Name ?? f.attributes.OVERLAY ?? "Overlay") as string,
      })),
      futureLandUse: futureLandUse.map((f) => ({
        designation: (f.attributes.FLUM ?? f.attributes.Name ?? "Unknown") as string,
      })),
      conditionalUse: conditionalUse.map((f) => ({
        name: (f.attributes.Name ?? "Conditional Use") as string,
      })),
      inclusionaryZoning: inclusionary.length > 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Zoning lookup failed" },
      { status: 500 }
    );
  }
}
