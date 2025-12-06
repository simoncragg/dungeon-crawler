import { Key, FlaskConical, Sword, Shield, FileText, Gem } from "lucide-react";
import type { Item, Room, Direction } from "../types";

export const ITEMS: Record<string, Item> = {
  "rusty-key": {
    id: "rusty-key",
    name: "Rusty Key",
    description: "An old iron key. It looks brittle.",
    type: "key",
    icon: Key,
  },
  "potion": {
    id: "potion",
    name: "Red Potion",
    description: "A bubbling red liquid. Heals 50 HP.",
    type: "consumable",
    icon: FlaskConical,
    effect: (state) => ({ health: Math.min(state.health + 50, state.maxHealth) }),
  },
  "sword": {
    id: "sword",
    name: "Iron Sword",
    description: "A sturdy iron sword. Adds +15 Attack Power.",
    type: "weapon",
    icon: Sword,
    stats: { attack: 15 },
    sounds: {
      take: "sword-take.wav",
      attack: "sword-combat-attack.wav",
      block: "sword-combat-block.wav",
      crit: "sword-combat-crit.wav",
      clash: "sword-combat-clash.wav",
    }
  },
  "wooden-shield": {
    id: "wooden-shield",
    name: "Wooden Shield",
    description: "A splintered wooden shield. Adds +5 Defense.",
    type: "armor",
    icon: Shield,
    stats: { defense: 5 },
  },
  "note": {
    id: "note",
    name: "Crumpled Note",
    description: "You unfold the paper. It reads: \"The Guard stole my key! I hid my sword in the cell, but he is too strong to fight without it!\"",
    type: "item",
    icon: FileText,
  },
  "glowing-gem": {
    id: "glowing-gem",
    name: "Glowing Gem",
    description: "A stone pulsing with blue light. It feels warm to the touch.",
    type: "key",
    icon: Gem,
  },
};

export const WORLD: Record<string, Room> = {
  "start": {
    id: "start",
    name: "Damp Cell",
    description: "You woke up here. Stone walls surround you. The door North is ajar.",
    narrative: [
      "You wake with a throbbing headache, the cold stone floor leeching the warmth from your body. How long have you been here? Hours? Days? The passage of time is a blur.",
      "The air is thick with the smell of mildew and old despair. Scratched into the wall near your head are tally marks, grouped in fives, stretching up towards the ceiling. Someone was here for a long time.",
      "A sudden draft chills you to the bone. You need to find a way out, and soon.",
      "You push yourself up, your muscles protesting with every movement. The cell is small, barely enough room to pace. In the corner, a pile of straw serves as a bed, infested with who knows what.",
      "The heavy iron door to the north is the only way out. It stands slightly ajar, a sliver of darkness visible beyond. Why is it open? Did the guard forget to lock it? Or did something happen to them? It feels too easy, yet you have no choice but to investigate."
    ],
    exits: { north: "hallway" },
    items: ["note", "sword"],
    coordinates: { x: 0, y: 0 },
    shortName: "CELL",
    image: "/images/scenes/damp-cell.png",
    audioLoop: "/audio/dripping-water.mp3",
  },
  "hallway": {
    id: "hallway",
    name: "Dark Hallway",
    description: "A long corridor. Archives (East), Armory (West), Exit (North).",
    narrative: [
      "You find yourself in a dim, stone junction where the air feels heavy enough to choke on. The floor is slick with moisture, and the high walls weep streaks of green slime that glisten in the gloom. This place offers no peace; the silence is strangled by a dissonant chorus of unseen whispers and the faint, wet sound of weeping that seems to drift from the stones themselves.",
      "Directly North, the whispers rise to a thrumming crescendo. A swirling seal of violet runes hovers over the heavy double doors, pulsing with the rhythmic heartbeat of an ancient lock spell. It demands a key you do not yet possess.",
      "To the West, the Armory door is shut tight—rough wood scarred with deep, violent scratches. Yet, through the cracks, the scent of cold rust bleeds out, accompanied by the phantom clatter of shifting steel.",
      "To the East, the Archives beckon, marked by a tarnished brass plaque. The darkness there sounds different—softer, filled with the dry rustling of rotting parchment and secrets that are restless in their sleep.",
      "You are a rat in a maze, and the walls are murmuring your name. Which path will you choose?"
    ],
    exits: { south: "start", east: "archives", west: "armory", north: "forest" },
    items: ["wooden-shield"],
    coordinates: { x: 0, y: 1 },
    shortName: "HALL",
    lockedExits: {
      north: { keyId: "glowing-gem", lockedMessage: "A magical barrier blocks the way. Needs a gem.", unlockImage: "/images/scenes/dark-hallway-2.png" },
      east: { keyId: "rusty-key", lockedMessage: "The heavy oak door is locked." }
    },
    image: "/images/scenes/dark-hallway.png",
    audioLoop: "/audio/eerie-echoes.mp3",
  },
  "archives": {
    id: "archives",
    name: "Dusty Archives",
    description: "Shelves of rotting books. Dust motes dance in the air.",
    exits: { west: "hallway" },
    items: ["glowing-gem", "potion"],
    coordinates: { x: 1, y: 1 },
    shortName: "ARCHIVES",
    image: "/images/scenes/archives.png",
  },
  "armory": {
    id: "armory",
    name: "Abandoned Armory",
    description: "Weapon racks line the walls.",
    exits: { east: "hallway" },
    items: [],
    enemy: {
      id: "skeleton-guard",
      name: "Skeleton Guard",
      maxHp: 100,
      hp: 100,
      attack: 10,
      defense: 5,
      description: "A skeleton in rusted armor blocks the room!",
      defeatMessage: "The skeleton falls apart, bones scattering across the floor.",
      drop: "rusty-key",
    },
    coordinates: { x: -1, y: 1 },
    shortName: "ARMORY",
    image: "/images/scenes/armory.png",
  },
  "forest": {
    id: "forest",
    name: "Forest",
    description: "Fresh air! Sunlight! You have escaped the dungeon!",
    exits: {},
    items: [],
    coordinates: { x: 0, y: 2 },
    shortName: "EXIT",
    image: "/images/scenes/forest.png",
  }
};

export const DIRECTIONS: Direction[] = ["north", "south", "east", "west"];
