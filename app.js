// The Cagayan River Basin Corridor — Interactive Telemetry & Impact Engine

let currentFloraMultiplier = 1.0;
let currentInfiltrationCapacity = 98; // Liters per m² (Deep alluvial bamboo root system)

document.addEventListener("DOMContentLoaded", () => {
  recalculateImpact();
});

// Map View Filter
function setCorridorView(type) {
  const buttons = document.querySelectorAll(".map-filter-btn");
  buttons.forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");

  const corridorThames = document.getElementById("corridorThames");
  const corridorNorth = document.getElementById("corridorNorth");

  if (type === "all") {
    corridorThames.style.opacity = "1";
    corridorNorth.style.opacity = "1";
  } else if (type === "thames") {
    corridorThames.style.opacity = "1";
    corridorNorth.style.opacity = "0.15";
  } else if (type === "north") {
    corridorThames.style.opacity = "0.15";
    corridorNorth.style.opacity = "1";
  }
}

// Select Apiary Node on Map
function selectApiary(title, location, hives, yieldVal, flora) {
  const drawer = document.getElementById("nodeDrawer");
  document.getElementById("drawerNodeTitle").innerText = title;
  document.getElementById("drawerNodeLocation").innerHTML = `📍 ${location} &bull; Active Field Monitoring`;
  document.getElementById("drawerHives").innerText = hives;
  document.getElementById("drawerYield").innerText = yieldVal;
  document.getElementById("drawerFlora").innerText = flora;

  drawer.style.backgroundColor = "#eaf2ec";
  setTimeout(() => {
    drawer.style.backgroundColor = "#fcfbfa";
  }, 400);
}

// Flora Selection
function setFloraArchetype(archetype, el) {
  const buttons = document.querySelectorAll(".pill-btn");
  buttons.forEach(b => b.classList.remove("active"));
  el.classList.add("active");

  if (archetype === "sedum") {
    // Bamboo Riparian Buffer
    currentFloraMultiplier = 1.0;
    currentInfiltrationCapacity = 98;
  } else if (archetype === "meadow") {
    // Coffee & Cacao Agro-Forest
    currentFloraMultiplier = 1.35;
    currentInfiltrationCapacity = 82;
  } else if (archetype === "wetland") {
    // Estuary Mangrove & Nipa Palm
    currentFloraMultiplier = 1.15;
    currentInfiltrationCapacity = 140;
  }

  recalculateImpact();
}

// Recalculate Environmental Impact Estimator
function recalculateImpact() {
  const area = parseInt(document.getElementById("roofAreaInput").value, 10);
  const density = parseInt(document.getElementById("hiveDensityInput").value, 10);

  // Update readouts
  document.getElementById("roofAreaLabel").innerText = `${area.toLocaleString()} m²`;
  document.getElementById("hiveDensityLabel").innerText = `${density} Colonies / 1,000 m²`;

  // Formulas
  const totalHives = Math.round((area / 1000) * density);
  const honeyYield = Math.round(totalHives * 18.6 * currentFloraMultiplier);
  const activeBees = ((totalHives * 35000) / 1000000).toFixed(1); // Millions of stingless bees
  const waterFiltered = Math.round(area * currentInfiltrationCapacity);
  const carbonOffset = ((area * 1.93) / 1000).toFixed(1); // tons biomass

  // Feed into DOM
  document.getElementById("resHoney").innerText = `${honeyYield.toLocaleString()} kg`;
  document.getElementById("resBees").innerText = `${activeBees}M`;
  document.getElementById("resWater").innerText = `${waterFiltered.toLocaleString()} L`;
  document.getElementById("resCarbon").innerText = `${carbonOffset} tons`;

  // Civic note scaling
  const wardenFamilies = Math.max(1, Math.round(honeyYield / 150));
  document.getElementById("civicNoteText").innerHTML = `
    Enough artisanal kiwot honey yield to supplement livelihoods for <strong>${wardenFamilies} local river-warden families</strong> across Macasandig, Balulang, and Carmen.
  `;
}
