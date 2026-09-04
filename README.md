# The Cagayan River Basin Corridor

> **Northern Mindanao Hydrological Modeling & Flood Early-Warning Simulator**  
> A real-time hydrological modeling engine simulating upstream rainfall-to-runoff routing from the Bukidnon mountain ranges (Kalatungan & Kitanglad) down the 52-kilometer river corridor to urban Cagayan de Oro and Macajalar Bay.

---

## Overview

The **Cagayan River Basin Corridor Model** provides civic engineers, disaster risk reduction teams (CDRRM), and environmental planners with an interactive early-warning telemetry and simulation platform for Northern Mindanao's 1,370 km^2 drainage basin.

The platform couples parametric rainfall-to-runoff calculations (Rational Method calibrated to local volcanic loam soil groups) with Muskingum hydrograph flood routing, modeling the vital role of nature-based riparian agro-forestry and giant bamboo (*Dendrocalamus asper*) bio-shields in flattening flood crests and preserving critical urban warning windows.

---

## Key Capabilities & Interactive Engineering Visuals

1. **Interactive Basin Topography & River Network Map**:
   - Geographically grounded vector cartography depicting the north-flowing Cagayan River from the Bukidnon high ranges (2,800m ASL) through narrow limestone canyons, the Bubunawan confluence, down to urban CDO and the Macajalar Bay estuary.
   - Six interactive hydrometric stations:
     - **Station 01: Talakag Mountain Headwaters** (Elev 820m &bull; Catchment 620 km^2)
     - **Station 02: Kabula River Gorge** (Elev 145m &bull; Canyon Chokepoint)
     - **Station 03: Bubunawan River Confluence** (Elev 85m &bull; Tributary Inflow)
     - **Station 04: Macasandig Floodway Ingress** (Elev 22m &bull; Urban Dike Transition)
     - **Station 05: Carmen Bridge & Isla de Oro** (Elev 8.2m &bull; Primary Urban Chokepoint)
     - **Station 06: Puntod Estuary Outfall** (Elev 1.2m &bull; Macajalar Bay Tidal Reach)
   - Real-time station telemetry drawer with stage height, bed elevation, discharge rate, and transit offsets.

2. **Rainfall-to-Runoff Early-Warning Calculator**:
   - Parametric precipitation intensity controls (5 to 100 mm/hr) with historical presets (Monsoon Surge, Severe Storm, and Typhoon Sendong 2011 benchmark).
   - Soil moisture saturation slider modeling infiltration rates from dry unsaturated ground to 100% waterlogged state.
   - Real-time calculations of peak discharge ($Q_{peak}$ in m^3/s), Carmen Bridge flood stage elevation (meters), levee freeboard margin, and flood wave travel time.
   - Dynamic 4-tier civic alert system: *Normal Conditions*, *Yellow Watch*, *Orange Warning*, and *Red Critical Evacuation*.

3. **Dynamic 24-Hour Flood Routing Hydrograph**:
   - Real-time SVG hydrograph rendering discharge curves ($Q$ vs. Time) across a 24-hour simulation window.
   - Compares bare/deforested runoff against vegetative buffer attenuation, demonstrating how riparian root retention dissipates peak flood volume by up to 28% and delays crest arrival by up to 1.8 hours.

4. **Bio-Engineering Technical Dossier**:
   - Rigorous quantitative comparison of channelized concrete floodwalls vs. living bamboo/vetiver root bio-shields across Manning's roughness coefficient ($n$), shear strength reinforcement, and upstream sediment capture.

---

## Technical Stack & Architecture

- **Aesthetics & Typography**: Editorial serif typography (`Newsreader`) paired with clean technical data readouts (`Plus Jakarta Sans` and `JetBrains Mono`), warm linen parchment foundation (`#faf8f5`), and river pine palettes (`#1b4332`, `#2d6a4f`).
- **Frontend Core**: Vanilla ES6+ JavaScript, dynamically generated SVG hydrographs, responsive layout with zero external framework dependencies.
- **Hydrological Modeling**: Calibrated runoff coefficients, Muskingum flood routing approximation, and local stage-discharge rating curves.

---

## Local Run

```bash
# Clone the repository
git clone https://github.com/ninoredoble/cagayan-basin-corridor.git

# Open index.html in any modern web browser
cd cagayan-basin-corridor
start index.html
```