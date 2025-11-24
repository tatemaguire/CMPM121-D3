import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import luck from "./_luck.ts";
import "./style.css";

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
const SCORE_GOAL = 32;

////////////////////////////////////////////////////
//////////////// INTERFACES/CLASSES ////////////////
////////////////////////////////////////////////////

interface Point {
  x: number;
  y: number;
}

class PlayerNavigator {
  position: leaflet.LatLng;
  geolocationBased: boolean;
  #watchID: number | null;
  constructor(geolocationBased: boolean) {
    this.position = CLASSROOM_LATLNG;
    this.geolocationBased = geolocationBased;
    this.#watchID = null;

    // initialize watcher
    if (this.geolocationBased) {
      this.#createGeolocationWatcher();
    }
  }
  setGeolocationBased(geolocationBased: boolean) {
    this.geolocationBased = geolocationBased;
    if (this.geolocationBased) {
      // start watching player's geolocation
      this.#createGeolocationWatcher();
    } else {
      // stop watching player's geolocation
      navigator.geolocation.clearWatch(this.#watchID!);
    }
    udpateMovementModeButtonText();
  }
  manuallyMovePlayer(delta: leaflet.LatLng) {
    if (!this.geolocationBased) {
      this.position.lat += delta.lat;
      this.position.lng += delta.lng;
      this.#updatePlayerMarker();
    }
  }
  #createGeolocationWatcher() {
    this.#watchID = navigator.geolocation.watchPosition(
      (pos: GeolocationPosition) => {
        this.position.lat = pos.coords.latitude;
        this.position.lng = pos.coords.longitude;
        this.#updatePlayerMarker();
      },
      () => {
        // if it fails, go back to buttons
        this.setGeolocationBased(false);
      },
    );
  }
  #updatePlayerMarker() {
    playerMarker.remove();
    playerMarker = leaflet.marker(this.position);
    playerMarker.bindTooltip("That's you!");
    playerMarker.addTo(map);
    map.setView(this.position);
  }
}

const playerNav = new PlayerNavigator(true);

////////////////////////////////////////////////////
////////////////// UI ELEMENTS /////////////////////
////////////////////////////////////////////////////

function makeDiv(id: string): HTMLDivElement {
  const div = document.createElement("div");
  div.id = id;
  document.body.append(div);
  return div;
}

makeDiv("controlPanel");
const mapDiv = makeDiv("map");
const statusPanelDiv = makeDiv("statusPanel");

// Movement Buttons
const buttonPanelDiv = makeDiv("buttonPanel");

function makeButtonMove(text: string, delta: leaflet.LatLng) {
  const buttonDebugMove = document.createElement("button");
  buttonDebugMove.innerHTML = text;
  buttonDebugMove.addEventListener("click", () => {
    playerNav.manuallyMovePlayer(delta);
  });
  buttonPanelDiv.appendChild(buttonDebugMove);
  return buttonDebugMove;
}

makeButtonMove("LEFT", leaflet.latLng(0, -TILE_DEGREES));
makeButtonMove("RIGHT", leaflet.latLng(0, TILE_DEGREES));
makeButtonMove("UP", leaflet.latLng(TILE_DEGREES, 0));
makeButtonMove("DOWN", leaflet.latLng(-TILE_DEGREES, 0));

// Settings for switching between geolocation and buttons, and new game
document.body.appendChild(document.createElement("br"));
const settingsDiv = makeDiv("settingsPanel");
const movementModeButton = document.createElement("button");
movementModeButton.id = "movementMode";
movementModeButton.addEventListener("click", () => {
  playerNav.setGeolocationBased(!playerNav.geolocationBased);
  udpateMovementModeButtonText();
});
udpateMovementModeButtonText();
settingsDiv.appendChild(movementModeButton);

function udpateMovementModeButtonText() {
  if (playerNav.geolocationBased) {
    movementModeButton.innerHTML = "Switch to Button Movement";
  } else {
    movementModeButton.innerHTML = "Switch to Geolocation Movement";
  }
}

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
    maxZoom: GAMEPLAY_ZOOM_LEVEL,
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

function distanceToPlayer(p: Point) {
  const playerPoint = pointCoordToIndex(playerNav.position);
  const dx = p.x - playerPoint.x;
  const dy = p.y - playerPoint.y;
  return Math.sqrt((dx ** 2) + (dy ** 2));
}

function checkWin(just_made: number) {
  if (just_made >= SCORE_GOAL) {
    statusPanelDiv.innerHTML = "You won!! Great job making " + just_made;
  }
}

////////////////////////////////////////////////////
//////////////// CELL GENERATION ///////////////////
////////////////////////////////////////////////////

const cellMap = new Map<string, number>();

function saveCell(p: Point, cachePoints: number) {
  cellMap.set(pointIndexToString(p), cachePoints);
  updateSaveState();
}

function spawnCache(i: number, j: number) {
  // Convert cell numbers into lat/lng bounds
  const bounds = leaflet.latLngBounds([
    pointIndexToCoord({ x: i, y: j }),
    pointIndexToCoord({ x: i + 1, y: j + 1 }),
  ]);

  // get cachePoints from cellMap, 0 indicates there's no cache at the cell
  const storedCachePoints = cellMap.get(pointIndexToString({ x: i, y: j }));
  if (storedCachePoints === 0) return;

  let cachePoints: number;
  if (storedCachePoints) {
    cachePoints = storedCachePoints;
  } else {
    cachePoints = Math.pow(2, Math.floor(luck([i, j, "init"].toString()) * 4));
  }

  // Add a rectangle to the map to represent the cache
  const rect = leaflet.rectangle(bounds);
  rect.addTo(rectangleGroup);

  // Display text on the cache
  const tooltip = leaflet.tooltip({ permanent: true, direction: "center" })
    .setContent(cachePoints.toString());
  rect.bindTooltip(tooltip);

  rect.on("click", () => {
    if (distanceToPlayer({ x: i, y: j }) >= RANGE) return;

    if (playerInventory === 0) {
      // pick up
      playerInventory = cachePoints;
      cachePoints = 0;
      statusPanelDiv.innerHTML = `You are carrying: ${playerInventory}`;
      rect.remove();
    } else if (playerInventory === cachePoints) {
      // merge
      playerInventory = 0;
      cachePoints *= 2;
      statusPanelDiv.innerHTML = `Merged!`;
      checkWin(cachePoints);
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
//////////////////// SAVE STATE ////////////////////
////////////////////////////////////////////////////

function updateSaveState() {
  localStorage.setItem("playerInventory", playerInventory.toString());
}

function loadSaveState() {
  const storedInventory = localStorage.getItem("playerInventory");
  if (storedInventory) {
    playerInventory = Number(storedInventory);
    statusPanelDiv.innerHTML = `You are carrying: ${playerInventory}`;
  }
}

// function clearSaveState() {
//   localStorage.clear();
// }

loadSaveState();

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
