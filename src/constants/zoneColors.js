// Official zone colors — Kigali Master Plan 2020 legend
export const ZONE_COLORS = {
  // Agriculture
  'A1-Agriculture zone':                               '#8B9A6A',

  // Commercial
  'C1-Mixed use zone':                                 '#E08E98',
  'C3-City commercial zone':                           '#C06464',

  // Industrial
  'I1-Light industrial zone':                          '#D4A0C4',
  'I2-General industrial zone':                        '#C8BCDC',
  'I3-Mining/ Extraction/Quarry':                      '#A890C4',

  // Parks & Open Space
  'P1-Parks and open spaces zone':                     '#CCE038',
  'P2-Sport and Eco tourism zone':                     '#7CB47C',
  'P3B-Forest zone':                                   '#5E7850',
  'P3C-Steep slopes (> 30%) zone':                     '#6A7858',

  // Public Administration
  'PA-Public Administration zone':                     '#78E4E0',

  // Public Facilities
  'PF1-Education and research facilities':             '#8080CC',
  'PF2-Health facilities':                             '#8888C8',
  'PF3-Religious facilities':                          '#8080C8',
  'PF4-Cultural/ memorial sites':                      '#6868C0',
  'PF5-Cemetery/ crematoria':                          '#7878B8',

  // Residential
  'R1-Low density residential zone':                   '#F5F5C8',
  'R1A-Low density residential densification zone':    '#F0F0A0',
  'R1B-Rural residential zone':                        '#F8F4E0',
  'R2-Medium density residential - Improvement zone':  '#F0D890',
  'R3-Medium density residential - Expansion zone':    '#F0A870',
  'R4-High density residential  zone':                 '#F09090',
  'R4-High density residential zone':                  '#F09090',

  // Infrastructure
  'T-Transportation zone':                             '#C8C8C8',
  'U-Utility zone':                                    '#A89080',

  // Wetlands
  'W1 - Buffer':                                       '#D8ECC8',
  'W2 - Rehabilitation':                               '#D8ECC8',
  'W3 - Sustainable Exploitation':                     '#D4ECC0',
  'W4 - Conservation':                                 '#D4EAC0',
  'W5 - Recreational':                                 '#D4ECC8',

  // Waterbody
  'WB-Waterbody zone':                                 '#A0B4E8',
  'WR-Waterbody zone':                                 '#A0B4E8',
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cok-development-assistant.onrender.com/api'
