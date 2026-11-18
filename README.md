# The Depths

**The Depths** is a browser-based, turn-based roguelike dungeon crawler. Explore procedurally generated rooms, fight monsters, collect treasure, level up, choose class-specific skills, and descend as far as you can survive.

## Playing the Game

Open `index.html` in a modern browser, or serve the project with a local web server:

```powershell
python -m http.server 4173
```

Then visit `http://127.0.0.1:4173/`.

## Controls

| Input | Action |
|---|---|
| `W` / Up Arrow | Move up |
| `S` / Down Arrow | Move down |
| `A` / Left Arrow | Move left |
| `D` / Right Arrow | Move right |
| `G` | Pick up an item on the player's tile |
| `H` | Drink a health potion |
| Space | Wait one turn |
| `R` | Restart after death |

On mobile devices, use the fixed on-screen directional pad to move and the **Wait**, **Pick up**, and **Potion** buttons for actions. The dungeon canvas also supports swipe gestures: swipe up, down, left, or right to move in that direction.

Movement and combat are turn-based. Moving into a monster attacks it; waiting or performing another valid action advances the turn and allows nearby monsters to act.

## Objective

Defeat monsters, collect gold and potions, improve your character, and use the stairs (`>`) to descend through increasingly dangerous dungeon levels. The run ends when the player's HP reaches zero. Press `R` to restart and choose another class.

## Character Classes

Choose one class before entering the dungeon:

| Class | Maximum HP | Attack | Starting Potions |
|---|---:|---:|---:|
| Vanguard | 42 | 5 | 2 |
| Ranger | 34 | 6 | 3 |
| Arcanist | 28 | 8 | 4 |

All classes begin with the **Rusty sword**, 0 gold, 1 character level, 0 XP, and 0 skill points.

- **Vanguard:** A durable melee fighter with the highest starting HP.
- **Ranger:** A balanced explorer with more starting HP and potions than the Arcanist.
- **Arcanist:** A fragile but highly offensive starter with the highest attack and potion count.

## Character Panel

The right-hand panel displays:

- Current and maximum HP
- Selected class
- Character level and dungeon depth
- Current XP and XP required for the next level
- Available skill points
- Attack value
- Gold
- Potion count
- Equipped weapon

## XP and Leveling

The initial XP requirement is **40 XP**. XP requirements increase by 35% after each level, rounded down.

| Enemy | XP Reward |
|---|---:|
| Goblin | 25 XP |
| Orc | 35 XP |

Leveling up grants:

- 1 skill point
- 5 maximum HP
- 12 HP healing, capped at the new maximum HP
- 1 attack

Multiple levels can be earned at once if enough XP is gained. XP remaining after a level is carried into the next XP requirement.

## Skill Trees

Open the **Skill tree** button to view and spend skill points. Learned skills are shown with a green border. Skills with unmet prerequisites or insufficient points are unavailable.

### Vanguard

| Skill | Cost | Effect | Prerequisite |
|---|---:|---|---|
| Iron Skin | 1 | Gain 8 maximum HP and 8 current HP | None |
| Cleave | 1 | Gain 3 attack | None |
| Juggernaut | 2 | Gain 12 maximum HP, 12 current HP, and 2 attack | Cleave |

### Ranger

| Skill | Cost | Effect | Prerequisite |
|---|---:|---|---|
| Fleet-Footed | 1 | Reduce incoming enemy damage by 1 | None |
| Keen Eye | 1 | Gain 3 attack | None |
| Wildcraft | 2 | Gain 2 potions, 8 maximum HP, and 8 current HP | Keen Eye |

Fleet-Footed's damage reduction is applied to each attack but never reduces an enemy's attack below 1 damage.

### Arcanist

| Skill | Cost | Effect | Prerequisite |
|---|---:|---|---|
| Arcane Focus | 1 | Gain 4 attack | None |
| Mana Blood | 1 | Gain 10 maximum HP and 10 current HP | None |
| Archmage | 2 | Gain 6 attack and 2 potions | Arcane Focus |

## Dungeon Generation

- The map is 50 tiles wide and 37 tiles tall.
- Each dungeon attempts to place up to 10 rooms measuring 5–11 by 4–8 tiles.
- Rooms are connected by straight corridors.
- The player starts in the first room.
- The stairs are placed in the final room.
- Every dungeon has a fresh randomized layout.
- Visited or nearby tiles use explored and visible states to implement fog of war.

## Visibility and Fog of War

The player has a circular visibility radius of 7 tiles. Visible tiles are drawn brightly, while previously explored tiles remain dimly visible after leaving them. Walls, monsters, items, and stairs outside the player's radius are hidden.

## Monsters

Monsters occupy the same tiles as normal dungeon floor tiles and cannot share a tile with the player or another monster.

| Monster | Symbol | HP by Dungeon Depth | Attack by Dungeon Depth |
|---|---|---:|---:|
| Goblin | `g` | 8 (depth 1–3), 12 (depth 4+) | 2 (depth 1–3), 4 (depth 4+) |
| Orc | `o` | 8 (depth 1–3), 12 (depth 4+) | 2 (depth 1–3), 4 (depth 4+) |

Monster types and symbols are selected independently, so a monster's visual letter is only its in-world representation.

- Each room after the first has an 80% chance to contain a monster.
- Monsters deal damage only while adjacent to the player.
- Monsters more than 7 Manhattan tiles away remain stationary.
- Monsters within 7 tiles attempt to move toward the player with a 75% chance on each turn.
- Movement is attempted along one axis at a time, with alternating randomized axis priority.
- Monsters cannot enter walls, occupied tiles, or the player's tile.

## Combat

- Moving into a monster deals the player's full attack value.
- The monster is removed if its HP reaches zero.
- A defeated goblin awards 25 XP and also drops 2–8 gold.
- A defeated orc awards 35 XP and also drops 2–8 gold.
- When an enemy is adjacent, it deals its attack value after any Ranger damage reduction.
- At least 1 damage is always dealt.

## Items

Items are found as treasure throughout dungeon rooms:

| Item | Symbol | Effect |
|---|---|---|
| Gold | `$` | Awards 5–15 gold immediately when collected |
| Health Potion | `!` | Adds 1 potion to the inventory |
| Enchanted Blade | `/` | Grants 3 attack and permanently changes the weapon name |

- Each room after the starting room has a 70% chance to contain an item.
- An item is automatically collected when the player moves onto its tile.
- `G` can also collect an item by targeting the player's current tile.
- Gold drops awarded for monster kills are added directly to the player's gold total.

A guaranteed enchanted blade is placed in the final room on dungeon levels divisible by 3. If the blade is left behind, it remains in that room for the rest of the level.

## Potions

- Drinking a potion restores up to 15 HP.
- The heal is capped by maximum HP and only uses as much as needed.
- At full HP, the potion is not consumed and no turn is spent.
- With no potions, no turn is spent.
- Using a potion on injured HP consumes 1 potion and advances the turn.

## Dungeon Descending

When the player moves onto the stairs:

1. The dungeon depth increases by 1.
2. Maximum HP increases by 2.
3. HP is increased by 8, capped at the new maximum HP.
4. A new randomly generated dungeon is created.

Monster HP and attack increase to 12 and 4 respectively once the player reaches dungeon depth 4.

## Death and Restart

When HP reaches zero:

- HP is fixed at zero.
- The game enters the defeated state.
- A death overlay is displayed.
- Movement and actions are disabled.
- Press `R` or use **New game** to return to class selection.

## Interface and Responsiveness

- The game uses an 800 × 600 canvas with 16 × 16 tile rendering.
- The dungeon and character panels are arranged side by side on wide screens.
- On narrow screens, the layout becomes a single column and class/skill cards stack vertically.
- Mobile and coarse-pointer devices receive a fixed touch D-pad and action buttons with large tap targets.
- The Canvas also accepts directional swipe gestures on mobile.
- Touch interactions prevent accidental page scrolling while controlling the game.
- The latest 7 event messages are shown in the activity log, with newest events at the top.

## Project Structure

```text
fantastic-eureka/
├── index.html              # Page markup and UI containers
├── README.md               # Project and gameplay documentation
└── assets/
    ├── css/
    │   └── styles.css      # Layout, themes, modals, and responsive styles
    └── js/
        └── game.js         # Game state, dungeon generation, combat, and UI logic
```

## Technical Notes

- `index.html` contains the semantic page structure and Canvas element.
- `assets/css/styles.css` contains all presentation styles.
- `assets/js/game.js` contains all JavaScript and Canvas API logic.
- The game does not require a build step or external dependencies.
- Character, enemy, dungeon, item, and UI state are maintained in browser memory.
- Reloading or restarting begins a fresh run.
