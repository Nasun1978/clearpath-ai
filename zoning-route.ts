// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";

const NOLA_GEOCODE_URL = "https://gis.nola.gov/arcgis/rest/services/Address/AddressLocators/GeocodeServer/findAddressCandidates";
const NOLA_ZONING_URL = "https://maps.nola.gov/server/rest/services/landuseplanning/Land_Use_Planning_Layers/MapServer";

async function geocodeAddress(address) {
  const params = new URLSearchParams({ SingleLine: address, f: "json", outSR: "102100", maxLocations: "1" });
  const res = await fetch(NOLA_GEOCODE_URL + "?" + params);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.candidates || data.candidates.length === 0) return null;
  return { x: data.candidates[0].location.x, y: data.candidates[0].location.y, address: data.candidates[0].address, score: data.candidates[0].score };
}

async function queryLayer(layerId, x, y) {
  const geom = JSON.stringify({ x: x, y: y, spatialReference: { wkid: 102100 } });
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
  return data.features || [];
}

export async function GET(request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");
  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

  try {
    const fullAddress = address.includes("New Orleans") ? address : address + ", New Orleans, LA";
    const location = await geocodeAddress(fullAddress);
    if (!location) return NextResponse.json({ error: "Address not found in New Orleans" }, { status: 404 });

    const results = await Promise.all([
      queryLayer(2, location.x, location.y),
      queryLayer(1, location.x, location.y),
      queryLayer(3, location.x, location.y),
      queryLayer(0, location.x, location.y),
      queryLayer(4, location.x, location.y),
    ]);

    const zoning = results[0];
    const overlays = results[1];
    const futureLandUse = results[2];
    const conditionalUse = results[3];
    const inclusionary = results[4];

    const z = zoning && zoning[0] ? zoning[0].attributes : {};

    return NextResponse.json({
      address: location.address,
      geocode: { x: location.x, y: location.y, score: location.score },
      zoning: {
        classification: z.ZONECLASS || "Unknown",
        description: z.ZONEDESC || "Unknown",
        ordinanceNumber: z.ORDNUM || null,
        year: z.ZONEYEAR || null,
        hyperlink: z.HYPERLINK || null,
      },
      overlays: (overlays || []).map(function(f) { return { name: f.attributes.Name || f.attributes.OVERLAY || "Overlay" }; }),
      futureLandUse: (futureLandUse || []).map(function(f) { return { designation: f.attributes.FLUM || f.attributes.Name || "Unknown" }; }),
      conditionalUse: (conditionalUse || []).map(function(f) { return { name: f.attributes.Name || "Conditional Use" }; }),
      inclusionaryZoning: (inclusionary || []).length > 0,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Zoning lookup failed" }, { status: 500 });
  }
}
