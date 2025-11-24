# D3: Slimopolis

## Game Design Vision

In this game, you will be merging globs of slime with other globs of slime of equal value.

## Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

## Assignments

### D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

#### Steps for a

- [x] copy main.ts to reference.ts for future reference
- [x] put a basic leaflet map on the screen
- [x] draw the player's location on the map
- [x] draw a rectangle representing one cell on the map
- [x] draw the rectangles using hash function
- [x] draw the value on each token
- [x] make rectangles interactable
- [x] find a way to represent rectangle values
- [x] make rectangle interaction update the inventory
- [x] display the player's inventory
- [x] make rect interaction merge tiles if inventory full
- [x] limit interaction to a certain range
- [x] make tiles reach the edge of the screen
- [x] clean up code

### D3.b: Core mechanics (token collection and crafting)

Key technical challenge: Can you make cell generation react to player movement and map scrolling?
Key gameplay challenge: Can players reach the win condition?

#### Steps for b

- [x] Create functions for index to coordinate conversion
- [x] Create generate cells function to spawn cells around the given location
- [x] Have generate cells function called on map scroll
- [x] Create layergroup for all rectangles
- [x] Clear layergroup in generateCells function
- [x] Rewrite distance_to to be distance_to_player
- [x] Create functions for index to coordinate conversion of _points_
- [x] Implement player movement
- [x] Check win condition
- [x] Clean up, organized code into separate sections
- [x] Removed unnecessary constants

### D3.c

Key technical challenge: implementing a data structure to keep track of altered cells
Key gameplay challenge: make the map feel permanent, it should be a smooth experience for the player

#### Steps for c

- [x] Use a Map to keep track of altered cells
- [x] Restore altered cell states after generating cells
- [x] Clean up

### D3.d

Key technical challenge: implementing geolocation and local storage
Key gameplay challenge: making the switch between buttons and geolocation feel smooth

#### Steps for d

- [x] isolate player movement into a separate navigator class
- [x] implement geolocation watching in this class
- [x] allow the ability to switch between different movement types
- [x] use a button to let the player switch
- [x] implement saving the cellMap into localStorage
- [x] implement loading the cellMap out of storage
- [x] save and load player inventory
- [x] implement function to clear storage and start newgame
- [x] create button to start new game
- [x] clean up
