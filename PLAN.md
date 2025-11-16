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

#### Steps

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
