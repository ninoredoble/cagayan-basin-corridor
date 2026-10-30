# Where the rain goes

An interactive browser study of how rainfall, soil wetness and land cover change runoff in the Cagayan de Oro river basin, Northern Mindanao.

It is a static page (HTML, CSS and plain JavaScript). It is not a production system, not a forecast, and has no backend, sensors or data feed. The starting land-cover mix is illustrative, not a survey.

## What it does

Set one day of rain (0 to 300 mm), the soil wetness (dry, average, soaked) and the share of forest, grass, row crops and town. The page redraws a ridge-to-bay section and shows how much of the rain runs off, how much stays on the land, and a volume over about 1,370 km2 if the rain fell evenly.

## The model

The SCS curve-number method (USDA TR-55), run per land cover and area-weighted:

1. Each cover has a curve number (forest 55, grass 61, row crops 78, town 92; good condition, medium-draining soil).
2. Soil wetness shifts it (antecedent moisture adjustment).
3. S = 25400 / CN - 254 (mm); initial loss is 0.2 S.
4. Q = (P - 0.2 S)^2 / (P + 0.8 S) when P > 0.2 S, otherwise 0.
5. Average Q over the covers by share.

The page works through these steps with the live numbers. `runoff.js` holds the model and `test/runoff.test.js` checks it (`node --test test/`).

## Limits

One daily total, no timing or flood routing; even rain over the basin; textbook curve numbers, not calibrated here; no channels, levees or riparian buffers. For warnings use PAGASA and your local disaster risk reduction office.

## Run

Open `index.html`, or serve the folder with any static server. Fonts (Spectral, Barlow) load from Google Fonts and fall back to system serif and sans.

## Pictures

Credits for the four photographs are in the page footer and `assets/credits.json` (Wikimedia Commons; CC BY 4.0, CC0, CC BY-SA 4.0, public domain).
