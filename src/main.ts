import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import "./style.css";

////////////////////////////////////////////////////
/////////////////// INTERFACES /////////////////////
////////////////////////////////////////////////////

interface Point {
  x: number;
  y: number;
}

////////////////////////////////////////////////////
////////////////// UI ELEMENTS /////////////////////
////////////////////////////////////////////////////

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
statusPanelDiv.innerHTML = "No points yet...";
document.body.append(statusPanelDiv);

// Movement Buttons (For testing)

const buttonPanelDiv = document.createElement("div");
buttonPanelDiv.id = "buttonPanel";
document.body.append(buttonPanelDiv);

const leftButton = document.createElement("button");
leftButton.innerHTML = "MOVE: Left";
leftButton.addEventListener("click", () => {
  move_player({ x: -1, y: 0 });
});

const rightButton = document.createElement("button");
rightButton.innerHTML = "MOVE: Right";
rightButton.addEventListener("click", () => {
  move_player({ x: 1, y: 0 });
});

const upButton = document.createElement("button");
upButton.innerHTML = "MOVE: Up";
upButton.addEventListener("click", () => {
  move_player({ x: 0, y: 1 });
});

const downButton = document.createElement("button");
downButton.innerHTML = "MOVE: Down";
downButton.addEventListener("click", () => {
  move_player({ x: 0, y: -1 });
});
buttonPanelDiv.appendChild(leftButton);
buttonPanelDiv.appendChild(rightButton);
buttonPanelDiv.appendChild(upButton);
buttonPanelDiv.appendChild(downButton);

////////////////////////////////////////////////////
//////////////////// CONSTANTS /////////////////////
////////////////////////////////////////////////////

const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 20;
const CACHE_SPAWN_PROBABILITY = 0.1;
const RANGE = 4;

////////////////////////////////////////////////////
///////////////// LEAFLET SETUP ////////////////////
////////////////////////////////////////////////////

// Create the map (element with id "map" is defined in index.html)
const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

map.on("moveend", generateCells);

// Populate the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const rectangleGroup = leaflet.layerGroup()
  .addTo(map);

let playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

////////////////////////////////////////////////////
///////////// PLAYER MOVEMENT AND WIN //////////////
////////////////////////////////////////////////////

let playerInventory = 0;
const playerPosition = CLASSROOM_LATLNG;

function move_player(dir: Point) {
  playerPosition.lat += indexToCoord(dir.y);
  playerPosition.lng += indexToCoord(dir.x);
  playerMarker.remove();
  playerMarker = leaflet.marker(playerPosition);
  playerMarker.bindTooltip("That's you!");
  playerMarker.addTo(map);
}

function distance_to_player(i: number, j: number) {
  const playerPoint = pointCoordToIndex(playerPosition);
  const dx = i - playerPoint.x;
  const dy = j - playerPoint.y;
  return Math.sqrt((dx ** 2) + (dy ** 2));
}

function check_win(just_made: number) {
  if (just_made >= 32) {
    statusPanelDiv.innerHTML = "You won!! Great job making " + just_made;
  }
}

////////////////////////////////////////////////////
//////////////// CELL GENERATION ///////////////////
////////////////////////////////////////////////////

const cellMap = new Map<string, number>();

function spawnCache(i: number, j: number) {
  // Convert cell numbers into lat/lng bounds
  const bounds = leaflet.latLngBounds([
    pointIndexToCoord({ x: i, y: j }),
    pointIndexToCoord({ x: i + 1, y: j + 1 }),
  ]);

  // get cachePoints from cellMap if it exists, otherwise generate value
  let storedCachePoints = cellMap.get(pointIndexToString({ x: i, y: j }));
  if (storedCachePoints == 0) return;
  if (storedCachePoints == undefined) {
    storedCachePoints = Math.pow(
      2,
      Math.floor(luck([i, j, "init"].toString()) * 4),
    );
  }
  let cachePoints = storedCachePoints as number;

  // Add a rectangle to the map to represent the cache
  const rect = leaflet.rectangle(bounds);
  rect.addTo(rectangleGroup);

  // Display text on the cache
  const tooltip = leaflet.tooltip({ permanent: true, direction: "center" })
    .setContent(cachePoints.toString());
  rect.bindTooltip(tooltip);

  rect.on("click", () => {
    if (distance_to_player(i, j) >= RANGE) return;

    if (playerInventory == 0) {
      playerInventory = cachePoints;
      cachePoints = 0;
      rect.remove();
      statusPanelDiv.innerHTML = `You are carrying: ${playerInventory}`;
    } else if (playerInventory == cachePoints) {
      cachePoints *= 2;
      playerInventory = 0;
      statusPanelDiv.innerHTML = `Merged!`;
      check_win(cachePoints);
    } else return;

    tooltip.setContent(cachePoints.toString());
    saveCell({ x: i, y: j }, cachePoints);
  });
}

generateCells();

function generateCells() {
  rectangleGroup.clearLayers();
  const mapCenter = pointCoordToIndex(map.getCenter());
  for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
    for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
      const x = mapCenter.x + i;
      const y = mapCenter.y + j;
      if (luck([x, y].toString()) < CACHE_SPAWN_PROBABILITY) {
        spawnCache(x, y);
      }
    }
  }
}

////////////////////////////////////////////////////
/////////////// SAVING CELL STATE //////////////////
////////////////////////////////////////////////////

function saveCell(p: Point, cachePoints: number) {
  cellMap.set(pointIndexToString(p), cachePoints);
}

////////////////////////////////////////////////////
/////////////// HELPER FUNCTIONS ///////////////////
////////////////////////////////////////////////////

function pointIndexToString(p: Point) {
  return p.x.toString() + " " + p.y.toString();
}

function indexToCoord(i: number) {
  return i * TILE_DEGREES;
}

function coordToIndex(c: number) {
  return Math.floor(c / TILE_DEGREES);
}

function pointIndexToCoord(p: Point): leaflet.LatLng {
  return leaflet.latLng(indexToCoord(p.x), indexToCoord(p.y));
}

function pointCoordToIndex(ll: leaflet.LatLng): Point {
  return { x: coordToIndex(ll.lat), y: coordToIndex(ll.lng) };
}
