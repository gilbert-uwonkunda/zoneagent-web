// Compact zone parameters used for PDF report generation
// Source: Kigali Master Plan Zoning Regulations (2020)

export const ZONE_PARAMS = {
  R1:   { type: 'Residential', subtype: 'Low Density',               far: '0.5',  coverage: '40%', floors: 'G+1+Penthouse', minPlot: '≤ 500 m²',     landscape: '20%', density: '10–15 Du/Ha' },
  R1A:  { type: 'Residential', subtype: 'Low Density Densification',  far: '1.0',  coverage: '50%', floors: 'G+2',           minPlot: '≤ 300 m²',     landscape: '20%', density: '20–30 Du/Ha' },
  R1B:  { type: 'Residential', subtype: 'Rural Residential',          far: '1.2',  coverage: '60%', floors: 'G+2',           minPlot: '≤ 150 m² (SF)',landscape: 'N/A', density: '40–60 Du/Ha' },
  R2:   { type: 'Residential', subtype: 'Med. Density – Improvement', far: '1.4',  coverage: '60%', floors: 'G+3',           minPlot: '≤ 100 m² (SF)',landscape: '20%', density: '50–90 Du/Ha' },
  R3:   { type: 'Residential', subtype: 'Med. Density – Expansion',   far: '1.2',  coverage: '60%', floors: 'G+2',           minPlot: '≤ 100 m² (SF)',landscape: '20%', density: '40–70 Du/Ha' },
  R4:   { type: 'Residential', subtype: 'High Density',               far: '1.8',  coverage: '50%', floors: 'G+4',           minPlot: '≥ 750 m²',     landscape: '20%', density: '80–120 Du/Ha' },
  C1:   { type: 'Commercial',  subtype: 'Mixed Use',                  far: '1.6',  coverage: '60%', floors: 'G+4',           minPlot: '≥ 500 m²',     landscape: '10%', density: '—' },
  'O-C2':{ type: 'Commercial', subtype: 'Neighbourhood Commercial Overlay', far: 'Base zone +1', coverage: 'As base zone', floors: 'Base zone +1', minPlot: 'As base zone', landscape: '—', density: '—' },
  C3:   { type: 'Commercial',  subtype: 'City Commercial',            far: '2.4',  coverage: '70%', floors: 'G+10',          minPlot: '≥ 1,000 m²',   landscape: '10%', density: '—' },
  PA:   { type: 'Public',      subtype: 'Public Administrative',      far: 'N/A',  coverage: 'N/A', floors: 'N/A',           minPlot: 'N/A',           landscape: '20%', density: '—' },
  PF1:  { type: 'Public',      subtype: 'Education & Research',       far: 'Ministry of Education standards', coverage: 'N/A', floors: 'N/A', minPlot: 'N/A', landscape: '20%', density: '—' },
  PF2:  { type: 'Public',      subtype: 'Health Facilities',          far: 'Ministry of Health standards',    coverage: 'N/A', floors: 'N/A', minPlot: 'N/A', landscape: '20%', density: '—' },
  PF3:  { type: 'Public',      subtype: 'Religious Facilities',       far: 'RGB standards', coverage: 'N/A',  floors: 'N/A', minPlot: 'N/A', landscape: 'N/A', density: '—' },
  PF4:  { type: 'Public',      subtype: 'Cultural / Memorial',        far: 'Authority standards', coverage: 'N/A', floors: 'N/A', minPlot: 'N/A', landscape: 'N/A', density: '—' },
  PF5:  { type: 'Public',      subtype: 'Cemetery / Crematoria',      far: '—',    coverage: '—',  floors: '—',             minPlot: '—',             landscape: '—',   density: '—' },
  I1:   { type: 'Industrial',  subtype: 'Light Industrial',           far: '1.2',  coverage: '60%', floors: 'Max 10m height',minPlot: '≥ 250 m²',     landscape: '10%', density: '—' },
  I2:   { type: 'Industrial',  subtype: 'General Industrial',         far: 'N/A',  coverage: '60%', floors: 'N/A',           minPlot: '≥ 1,000 m²',   landscape: '10%', density: '—' },
  I3:   { type: 'Industrial',  subtype: 'Mining & Quarrying',         far: '—',    coverage: '—',  floors: 'N/A',           minPlot: 'N/A',           landscape: '—',   density: '—' },
  P1:   { type: 'Open Space',  subtype: 'Parks & Open Spaces',        far: '0.05', coverage: 'N/A', floors: 'G+1',           minPlot: 'N/A',           landscape: 'N/A', density: '—' },
  P2:   { type: 'Open Space',  subtype: 'Sports & Eco-Tourism',       far: 'Subject to OSC', coverage: 'N/A', floors: 'G+2', minPlot: 'N/A',          landscape: 'N/A', density: '—' },
  P3A:  { type: 'Conservation',subtype: 'National Parks',             far: 'Authority standards', coverage: 'N/A', floors: 'N/A', minPlot: 'N/A',     landscape: 'N/A', density: '—' },
  P3B:  { type: 'Conservation',subtype: 'Forest Zone',                far: '0.05', coverage: 'N/A', floors: '—',             minPlot: 'N/A',           landscape: 'N/A', density: '—' },
  P3C:  { type: 'Conservation',subtype: 'Steep Slopes (>30%)',        far: '—',    coverage: '—',  floors: '—',             minPlot: '—',             landscape: '—',   density: '—' },
  P3D:  { type: 'Conservation',subtype: 'Natural Conservation',       far: 'N/A',  coverage: 'N/A', floors: '—',             minPlot: 'N/A',           landscape: 'N/A', density: '—' },
  A:    { type: 'Agriculture', subtype: 'Agricultural Zone',          far: '0.01–0.02 (conditional)', coverage: 'N/A', floors: 'G (Ground only)', minPlot: '≥ 1 ha (residential)', landscape: 'N/A', density: '—' },
  A1:   { type: 'Agriculture', subtype: 'Agricultural Zone',          far: '0.01–0.02 (conditional)', coverage: 'N/A', floors: 'G (Ground only)', minPlot: '≥ 1 ha (residential)', landscape: 'N/A', density: '—' },
  T:    { type: 'Infrastructure', subtype: 'Transport Zone',          far: '—',    coverage: '—',  floors: '—',             minPlot: '—',             landscape: '—',   density: '—' },
  U:    { type: 'Infrastructure', subtype: 'Utility Zone',            far: '—',    coverage: '—',  floors: '—',             minPlot: '—',             landscape: '—',   density: '—' },
  W1:   { type: 'Wetland',     subtype: 'Wetland Buffer',             far: '—',    coverage: '—',  floors: '—',             minPlot: '—',             landscape: '—',   density: '—' },
  W2:   { type: 'Wetland',     subtype: 'Wetland Rehabilitation',     far: '—',    coverage: '—',  floors: '—',             minPlot: '—',             landscape: '—',   density: '—' },
  W3:   { type: 'Wetland',     subtype: 'Wetland Sustainable Use',    far: '—',    coverage: '—',  floors: '—',             minPlot: '—',             landscape: '—',   density: '—' },
  W4:   { type: 'Wetland',     subtype: 'Wetland Conservation',       far: '—',    coverage: '—',  floors: '—',             minPlot: '—',             landscape: '—',   density: '—' },
  W5:   { type: 'Wetland',     subtype: 'Wetland Recreational',       far: '—',    coverage: '—',  floors: '—',             minPlot: '—',             landscape: '—',   density: '—' },
  WB:   { type: 'Waterbody',   subtype: 'Waterbody Zone',             far: 'N/A',  coverage: 'N/A', floors: 'N/A',           minPlot: 'N/A',           landscape: 'N/A', density: '—' },
  B:    { type: 'Buffer',      subtype: 'Buffer Zone',                far: 'As base zone', coverage: 'As base zone', floors: 'As base zone', minPlot: 'As base zone', landscape: '—', density: '—' },
}

// Zone type → color mapping for PDF badges
export const ZONE_TYPE_COLORS = {
  Residential:   { r: 34,  g: 139, b: 87  },   // green
  Commercial:    { r: 59,  g: 130, b: 246 },   // blue
  Industrial:    { r: 239, g: 108, b: 0   },   // orange
  Public:        { r: 139, g: 92,  b: 246 },   // purple
  'Open Space':  { r: 20,  g: 184, b: 166 },   // teal
  Conservation:  { r: 5,   g: 150, b: 105 },   // dark green
  Agriculture:   { r: 132, g: 204, b: 22  },   // lime
  Wetland:       { r: 6,   g: 182, b: 212 },   // cyan
  Waterbody:     { r: 14,  g: 165, b: 233 },   // sky blue
  Infrastructure:{ r: 100, g: 116, b: 139 },   // slate
  Buffer:        { r: 156, g: 163, b: 175 },   // gray
}

export function getZoneParams(zoneName) {
  if (!zoneName) return null
  // Try direct code match first (e.g. "R3", "C1")
  const codeMatch = zoneName.match(/^([A-Z0-9-]+)/)
  if (codeMatch) {
    const code = codeMatch[1]
    if (ZONE_PARAMS[code]) return ZONE_PARAMS[code]
  }
  // Try full name prefix match
  for (const [code, params] of Object.entries(ZONE_PARAMS)) {
    if (zoneName.startsWith(code + '-') || zoneName.startsWith(code + ' ')) return params
  }
  return null
}
