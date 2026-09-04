 // Cagayan River Basin Corridor    Watershed Hydrology & Flood Early-Warning Engine
// Real-time Catchment Runoff Routing & Muskingum Hydrograph Simulation

const STATIONS = {
  "talakag": {
    name: "Station 01: Talakag Mountain Headwaters",
    reach: "Upper Catchment    Bukidnon Highland Reach",
    elev: "820m ASL",
    area: "620 km&sup2;",
    baseFlow: 140,
    travelTime: "4.8 hrs",
    sensor: "Acoustic Doppler Current Profiler (ADCP) & Radar Gauge",
    desc: "Originating in the Kalatungan and Kitanglad mountain ranges. Steep volcanic topography creates rapid runoff concentration during intense precipitation events."
  },
  "kabula": {
    name: "Station 02: Kabula River Gorge",
    reach: "Mid-Basin Reach    Narrow Limestone Canyon",
    elev: "145m ASL",
    area: "890 km&sup2;",
    baseFlow: 280,
    travelTime: "3.2 hrs",
    sensor: "Hydrostatic Pressure Transducer & Telemetric Stage Staff",
    desc: "A natural river bottleneck upstream of CDO city limits. Channel constricts to 65 meters, accelerating water velocity and providing critical early flood pulse telemetry."
  },
  "bubunawan": {
    name: "Station 03: Bubunawan River Confluence",
    reach: "Eastern Tributary Inflow    Baungon / San Simon",
    elev: "85m ASL",
    area: "310 km&sup2;",
    baseFlow: 190,
    travelTime: "2.4 hrs",
    sensor: "Continuous Stage Sensor & Optical Turbidity Sonde",
    desc: "The largest single tributary confluence feeding the main stem. Heavy localized rainfall in eastern Bukidnon can double the main river discharge within 90 minutes."
  },
  "macasandig": {
    name: "Station 04: Macasandig Floodway Ingress",
    reach: "Urban Transition Reach    Southern CDO Dike",
    elev: "22m ASL",
    area: "1,280 km&sup2;",
    baseFlow: 420,
    travelTime: "1.1 hrs",
    sensor: "Dual Ultrasonic Level Gauge & Doppler River Velocity Meter",
    desc: "The transition zone where the river exits the mountain gorge into the wide alluvial floodplain. First major urban reach protected by reinforced concrete floodwalls."
  },
  "carmen": {
    name: "Station 05: Carmen Bridge & Isla de Oro Chokepoint",
    reach: "Downtown Urban Core    Carmen-Macasandig Bridge",
    elev: "8.2m ASL",
    area: "1,340 km&sup2;",
    baseFlow: 460,
    travelTime: "0.0 hrs (Baseline Datum)",
    sensor: "Redundant Microwave Radar & City DRRMO Live Sensor",
    desc: "Primary civic reference point for city evacuation. Low bridge clearance and mid-river sandbar historical accretion make this the most sensitive flood stage indicator."
  },
  "puntod": {
    name: "Station 06: Puntod Estuary Outfall",
    reach: "Tidal Reach    Macajalar Bay Outflow",
    elev: "1.2m ASL",
    area: "1,370 km&sup2;",
    baseFlow: 480,
    travelTime: "+0.8 hrs (Estuary)",
    sensor: "Acoustic Tide Gauge, Salinity Probe & Current Profiler",
    desc: "Discharge point into Macajalar Bay. High astronomical spring tides can back up river outflow, compounding flood heights across upstream urban barangays."
  }
};

let currentStation = "carmen";
let bufferActive = true;

document.addEventListener("DOMContentLoaded", () => {
  selectStation("carmen");
  recalculateHydrology();
});

// Station Selection on Basin Map
function selectStation(key) {
  if (!STATIONS[key]) return;
  currentStation = key;
  const s = STATIONS[key];

  // Update SVG markers
  document.querySelectorAll(".station-node").forEach(node => {
    node.classList.remove("active");
  });
  const activeNode = document.getElementById("node-" + key);
  if (activeNode) activeNode.classList.add("active");

  // Update Drawer Info
  document.getElementById("drawerTitle").innerText = s.name;
  document.getElementById("drawerLocation").innerText = `${s.reach}    ${s.sensor}`;
  document.getElementById("drawerElev").innerText = s.elev;
  document.getElementById("drawerArea").innerText = s.area;
  document.getElementById("drawerLeadTime").innerText = s.travelTime;
  document.getElementById("drawerDesc").innerText = s.desc;

  // Visual pulse on drawer
  const drawer = document.getElementById("stationDrawer");
  drawer.style.backgroundColor = "#f2f7f3";
  setTimeout(() => {
    drawer.style.backgroundColor = "#ffffff";
  }, 350);

  updateStationTelemetryReadout();
}

// Preset Rainfall Buttons
function setRainfallPreset(intensity, sat) {
  document.getElementById("rainInput").value = intensity;
  document.getElementById("satInput").value = sat;
  recalculateHydrology();
}

// Buffer Toggle Handler
function toggleBuffer() {
  bufferActive = document.getElementById("bufferToggle").checked;
  recalculateHydrology();
}

// Corridor View Filter
function setCorridorFilter(filterType, btnEl) {
  document.querySelectorAll(".map-filter-btn").forEach(b => b.classList.remove("active"));
  btnEl.classList.add("active");

  const nodes = document.querySelectorAll(".station-node");
  nodes.forEach(node => {
    const id = node.id.replace("node-", "");
    if (filterType === "all") {
      node.style.opacity = "1";
    } else if (filterType === "upland") {
      node.style.opacity = (id === "talakag" || id === "kabula" || id === "bubunawan") ? "1" : "0.2";
    } else if (filterType === "urban") {
      node.style.opacity = (id === "macasandig" || id === "carmen" || id === "puntod") ? "1" : "0.2";
    }
  });
}

// Master Hydrological Calculation Engine
function recalculateHydrology() {
  const rain = parseFloat(document.getElementById("rainInput").value);
  const sat = parseFloat(document.getElementById("satInput").value);

  // Update slider label readouts
  document.getElementById("rainLabel").innerText = `${rain} mm/hr`;
  document.getElementById("satLabel").innerText = `${sat}% Saturated`;

  // Hydrological Calculations (Rational Method & Muskingum Routing)
  // Base catchment runoff coefficient C: 0.35 (dry forest) to 0.88 (fully saturated rock/clay)
  const cBare = 0.35 + (0.52 * (sat / 100));
  // Bamboo and vegetative riparian agro-forestry buffer reduces runoff coefficient by ~28%
  const cCoeff = bufferActive ? (cBare * 0.72) : cBare;

  // Peak discharge calculation at Carmen Bridge (Catchment ~1,340 km&sup2;)
  // Q = Baseflow + C * Intensity * Area factor
  const baseQ = 460;
  const qPeakBare = Math.round(baseQ + (cBare * rain * 48.5));
  const qPeak = Math.round(baseQ + (cCoeff * rain * 48.5));

  // Runoff volume dampening
  const qDifference = qPeakBare - qPeak;

  // River Stage Height at Carmen Bridge (Dike Crest = 7.50m)
  // Rating curve: H = 2.0 + (Q / 620)^0.86
  const stageHeight = (1.8 + Math.pow(qPeak / 620, 0.88)).toFixed(2);
  const freeboard = (7.50 - parseFloat(stageHeight)).toFixed(2);

  // Crest Arrival Time from Talakag Headwaters (Distance ~52km)
  // Faster when soil is saturated, slowed down by vegetation roughness (Manning's n)
  let speedKmH = 11.5 + (sat * 0.04);
  if (bufferActive) speedKmH -= 2.8; // Hydraulic friction of riparian vegetation
  const travelHours = (48 / speedKmH).toFixed(1);

  // Update DOM readouts
  document.getElementById("resDischarge").innerHTML = `${qPeak.toLocaleString()} <small>m&sup3;/s</small>`;
  document.getElementById("resStage").innerHTML = `${stageHeight} <small>meters</small>`;
  document.getElementById("resLeadTime").innerHTML = `${travelHours} <small>hours</small>`;
  document.getElementById("resBufferReduction").innerHTML = bufferActive 
    ? `-${qDifference.toLocaleString()} <small>m&sup3;/s (-28%)</small>`
    : `0 <small>m&sup3;/s (Inactive)</small>`;

  // Update Alert Level Banner
  const alertCard = document.getElementById("alertBanner");
  const alertTitle = document.getElementById("alertTitle");
  const alertDesc = document.getElementById("alertDesc");
  const alertIcon = document.getElementById("alertIcon");

  alertCard.className = "alert-card";

  if (stageHeight < 4.8) {
    alertCard.classList.add("alert-normal");
    alertIcon.innerText = "  ";
    alertTitle.innerText = "NORMAL CONDITIONS    ALL CLEAR";
    alertDesc.innerText = `River stage is safe at ${stageHeight}m. Substantial levee freeboard margin remaining (${freeboard}m). Normal commercial navigation and riverbank operations.`;
  } else if (stageHeight < 6.2) {
    alertCard.classList.add("alert-watch");
    alertIcon.innerText = " - &sup2;";
    alertTitle.innerText = "YELLOW WATCH    MONSOON SURGE IN PROGRESS";
    alertDesc.innerText = `River stage has elevated to ${stageHeight}m (${freeboard}m below dike crest). Upstream headwaters are saturated. Barangays Macasandig and Carmen DRRMO placed on standby.`;
  } else if (stageHeight < 7.5) {
    alertCard.classList.add("alert-watch");
    alertCard.style.borderColor = "#ea580c";
    alertIcon.innerText = "  ";
    alertTitle.innerText = "ORANGE WARNING    HIGH FLOOD RISK";
    alertDesc.innerText = `Critical river stage of ${stageHeight}m! Dike freeboard narrowed to only ${freeboard}m. Sandbar inundation at Isla de Oro imminent. Voluntary evacuation urged for riverside zones.`;
  } else {
    alertCard.classList.add("alert-critical");
    alertIcon.innerText = "   ";
    alertTitle.innerText = "RED ALERT    MANDATORY EVACUATION & OVERTOPPING";
    alertDesc.innerText = `EMERGENCY: River stage has reached ${stageHeight}m, breaching and overtopping the 7.50m urban floodwall! Disaster Risk Reduction command executing immediate forced evacuation!`;
  }

  // Redraw the 24-Hour Hydrograph SVG
  drawHydrograph(qPeakBare, qPeak, rain);
  updateStationTelemetryReadout();
}

// Redraw Dynamic SVG Hydrograph
function drawHydrograph(qBare, qBuffered, rain) {
  const svg = document.getElementById("hydrographSvg");
  if (!svg) return;

  const w = 700;
  const h = 220;
  const padLeft = 60;
  const padBottom = 30;
  const padTop = 20;
  const padRight = 20;

  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  // Max discharge scale on Y axis (at least 5,000 m&sup3;/s for extreme runs)
  const maxY = Math.max(5000, qBare * 1.15);
  const leveeThreshold = 3600; // m&sup3;/s levee capacity

  // Peak arrival hours: bare vs buffered
  const tPeakBare = 7; // Hour 7
  const tPeakBuffered = 9; // Delayed to Hour 9 by buffer vegetation

  // Generate 24 hourly points
  let barePoints = [];
  let buffPoints = [];

  for (let t = 0; t <= 24; t++) {
    const x = padLeft + (t / 24) * plotW;

    // Bell curve hydrograph formula
    const valBare = 450 + (qBare - 450) * Math.exp(-Math.pow(t - tPeakBare, 2) / 16);
    const valBuff = 450 + (qBuffered - 450) * Math.exp(-Math.pow(t - tPeakBuffered, 2) / 22);

    const yBare = padTop + plotH - (valBare / maxY) * plotH;
    const yBuff = padTop + plotH - (valBuff / maxY) * plotH;

    barePoints.push(`${x.toFixed(1)},${yBare.toFixed(1)}`);
    buffPoints.push(`${x.toFixed(1)},${yBuff.toFixed(1)}`);
  }

  const dPathBare = "M " + barePoints.join(" L ");
  const dPathBuff = "M " + buffPoints.join(" L ");

  // Levee capacity threshold line
  const yLevee = padTop + plotH - (leveeThreshold / maxY) * plotH;

  // Fill in SVG
  svg.innerHTML = `
    <!-- Grid Lines -->
    <line x1="${padLeft}" y1="${padTop}" x2="${padLeft + plotW}" y2="${padTop}" stroke="#e2e8f0" stroke-width="1"/>
    <line x1="${padLeft}" y1="${padTop + plotH * 0.33}" x2="${padLeft + plotW}" y2="${padTop + plotH * 0.33}" stroke="#f1f5f9" stroke-width="1"/>
    <line x1="${padLeft}" y1="${padTop + plotH * 0.66}" x2="${padLeft + plotW}" y2="${padTop + plotH * 0.66}" stroke="#f1f5f9" stroke-width="1"/>
    <line x1="${padLeft}" y1="${padTop + plotH}" x2="${padLeft + plotW}" y2="${padTop + plotH}" stroke="#cbd5e1" stroke-width="1"/>

    <!-- Axis Labels -->
    <text x="${padLeft - 10}" y="${padTop + 4}" font-family="'JetBrains Mono', monospace" font-size="10" fill="#94a3b8" text-anchor="end">${Math.round(maxY)} m&sup3;/s</text>
    <text x="${padLeft - 10}" y="${yLevee.toFixed(1)}" font-family="'JetBrains Mono', monospace" font-size="9" fill="#dc2626" font-weight="600" text-anchor="end">3,600 (Dike Limit)</text>
    <text x="${padLeft - 10}" y="${padTop + plotH + 3}" font-family="'JetBrains Mono', monospace" font-size="10" fill="#94a3b8" text-anchor="end">450 m&sup3;/s</text>

    <!-- Time Labels on X Axis -->
    <text x="${padLeft}" y="${h - 10}" font-family="'JetBrains Mono', monospace" font-size="10" fill="#94a3b8">T+0h</text>
    <text x="${padLeft + plotW * 0.25}" y="${h - 10}" font-family="'JetBrains Mono', monospace" font-size="10" fill="#94a3b8">T+6h</text>
    <text x="${padLeft + plotW * 0.5}" y="${h - 10}" font-family="'JetBrains Mono', monospace" font-size="10" fill="#94a3b8">T+12h</text>
    <text x="${padLeft + plotW * 0.75}" y="${h - 10}" font-family="'JetBrains Mono', monospace" font-size="10" fill="#94a3b8">T+18h</text>
    <text x="${padLeft + plotW - 15}" y="${h - 10}" font-family="'JetBrains Mono', monospace" font-size="10" fill="#94a3b8">T+24h</text>

    <!-- Dike Overtopping Limit Line -->
    <line x1="${padLeft}" y1="${yLevee.toFixed(1)}" x2="${padLeft + plotW}" y2="${yLevee.toFixed(1)}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 4"/>

    <!-- Hydrograph Curve: Bare Catchment (Without Buffer) -->
    <path d="${dPathBare}" fill="none" stroke="#dc2626" stroke-width="2" stroke-opacity="0.55"/>

    <!-- Hydrograph Curve: Vegetated / Bamboo Buffer (With Buffer) -->
    <path d="${dPathBuff}" fill="none" stroke="#2d6a4f" stroke-width="3"/>
  `;
}

function updateStationTelemetryReadout() {
  const rain = parseFloat(document.getElementById("rainInput").value);
  const sat = parseFloat(document.getElementById("satInput").value);
  const s = STATIONS[currentStation];
  if (!s) return;

  const currentQ = Math.round(s.baseFlow + (rain * (sat / 100) * 18.5));
  const stageH = (1.2 + Math.pow(currentQ / 480, 0.85)).toFixed(2);

  const statusEl = document.getElementById("drawerStatus");
  if (statusEl) {
    if (stageH < 4.5) {
      statusEl.className = "d-status-pill status-normal";
      statusEl.innerText = "NORMAL";
    } else if (stageH < 6.0) {
      statusEl.className = "d-status-pill status-watch";
      statusEl.innerText = "WATCH";
    } else if (stageH < 7.5) {
      statusEl.className = "d-status-pill status-warning";
      statusEl.innerText = "WARNING";
    } else {
      statusEl.className = "d-status-pill status-critical";
      statusEl.innerText = "CRITICAL";
    }
  }

  const stageEl = document.getElementById("drawerStage");
  if (stageEl) stageEl.innerText = `${stageH}m`;

  const flowEl = document.getElementById("drawerFlow");
  if (flowEl) flowEl.innerText = `${currentQ.toLocaleString()} m&sup3;/s`;
}