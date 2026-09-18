// Direct browser → ArcGIS Enterprise query with resilient fallback chain:
// 1. Fresh localStorage cache (instant)
// 2. Direct ArcGIS query (fast, ~300-800ms)
// 3. Stale cache (if ArcGIS is down — better than nothing)
// 4. Render backend (/api/zoning/location) as last resort

import { API_BASE_URL } from '../constants/zoneColors'

const ARCGIS_URL =
  'https://masterplan.kigalicity.gov.rw/server/rest/services/Masterplan2020/' +
  'Zoning_Phases_18March2026/FeatureServer/0/query'

const OUT_FIELDS =
  'zone_code,new_zoning,level_1,level_2,level_3,lu_code,area_ha,area_sqkm,name,year,wet_name'

const CACHE_TTL   = 24 * 60 * 60 * 1000  // 24 hours fresh
const ARCGIS_TIMEOUT = 8000               // 8s — if no response, ArcGIS is down

function cacheKey(lat, lng) {
  return `za_zone_${lat.toFixed(4)}_${lng.toFixed(4)}`
}

function readCache(key, allowStale = false) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return undefined   // undefined = not cached at all
    const { data, ts } = JSON.parse(raw)
    if (!allowStale && Date.now() - ts > CACHE_TTL) return undefined  // expired
    return data   // data can be null (outside Kigali) — that's a valid cached result
  } catch { return undefined }
}

function writeCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

// Aborts the request on timeout and always clears the timer. The previous
// Promise.race version left the timer pending and the socket open even after a
// fast response, so every query held a reference for the full timeout window.
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('timeout')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

async function fetchFromArcGIS(lat, lng) {
  // resultRecordCount here made the service apply it BEFORE the spatial
  // filter, so it could cap/paginate the raw table scan and return
  // exceededTransferLimit with zero features even when the point's zone
  // genuinely exists — omit it and just take the first (and only expected)
  // match.
  const params = new URLSearchParams({
    geometry:          JSON.stringify({ x: lng, y: lat }),
    geometryType:      'esriGeometryPoint',
    inSR:              '4326',
    spatialRel:        'esriSpatialRelIntersects',
    outFields:         OUT_FIELDS,
    returnGeometry:    'false',
    f:                 'json',
  })

  const res = await fetchWithTimeout(`${ARCGIS_URL}?${params}`, ARCGIS_TIMEOUT)
  if (!res.ok) throw new Error(`ArcGIS HTTP ${res.status}`)

  const json = await res.json()
  if (json.error) throw new Error(`ArcGIS error: ${json.error.message}`)

  if (!json.features?.length) return null

  const a = json.features[0].attributes
  // new_zoning is null on some forest/wetland polygons — fall back to zone_code or level_1
  const zoneName = a.new_zoning || a.zone_code || a.level_1 || 'Unclassified'
  return {
    zone_name: zoneName,
    zone_code: a.zone_code || null,
    level_1:   a.level_1  || null,
    level_2:   a.level_2  || null,
    level_3:   a.level_3  || null,
    area_ha:   a.area_ha  || null,
    wet_name:  a.wet_name || null,
    source:    'arcgis_direct',
  }
}

async function fetchFromBackend(lat, lng) {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/zoning/location?lat=${lat}&lng=${lng}`,
    15000
  )
  if (!res.ok) throw new Error(`Backend HTTP ${res.status}`)
  const json = await res.json()
  if (!json.success || !json.data?.zoneData) return null
  const z = json.data.zoneData
  return {
    zone_name: z.zone_name,
    zone_code: z.zone_code || null,
    level_1:   z.level_1   || null,
    level_2:   z.level_2   || null,
    level_3:   z.level_3   || null,
    area_ha:   z.area_ha   || null,
    wet_name:  z.wet_name  || null,
    source:    'backend_fallback',
  }
}

/**
 * Returns zone attributes for a lat/lng point, or null if outside mapped zones.
 *
 * Fallback chain:
 *   fresh cache → ArcGIS direct → stale cache → Render backend
 */
export async function queryZoneAtPoint(lat, lng) {
  const key = cacheKey(lat, lng)

  // 1. Fresh cache — instant
  const fresh = readCache(key, false)
  if (fresh !== undefined) return fresh

  // 2. ArcGIS direct query
  try {
    const result = await fetchFromArcGIS(lat, lng)
    writeCache(key, result)
    return result
  } catch (arcgisErr) {
    console.warn('ArcGIS direct query failed:', arcgisErr.message)
  }

  // 3. Stale cache — ArcGIS is down but we have old data
  const stale = readCache(key, true)
  if (stale !== undefined) {
    console.warn('Using stale cache (ArcGIS down)')
    return stale
  }

  // 4. Render backend — last resort
  try {
    console.warn('Falling back to Render backend for zone query')
    const result = await fetchFromBackend(lat, lng)
    if (result) writeCache(key, result)
    return result
  } catch (backendErr) {
    console.error('All zone query sources failed:', backendErr.message)
    throw new Error('Zone data unavailable — please try again shortly.')
  }
}
