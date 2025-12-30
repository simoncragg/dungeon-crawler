import { Key, FlaskConical, Sword, Shield, FileText, Gem } from "lucide-react";
import type { Item, Room, Direction } from "../types";

export const ITEMS: Record<string, Item> = {
  "crumpled-note": {
    id: "crumpled-note",
    name: "Crumpled Note",
    description: "You unfold the paper. It reads: \"The Guard stole my key! I hid my sword in the cell, but he is too strong to fight without it!\"",
    type: "item",
    icon: FileText,
    image: "/images/items/crumpled-note.png",
    modalStyle: { scale: 0.6 },
    slotStyle: { scale: 1.0 },
  },
  "rusty-sword": {
    id: "rusty-sword",
    name: "Rusty Sword",
    description: "A jagged, rusted blade. It's heavy and uneven.",
    type: "weapon",
    icon: Sword,
    image: "/images/weapons/rusty-short-sword.png",
    overlayConfig: {
      width: "18%",
      right: "2%",
      bottom: "-28%",
      rotation: "-15deg",
    },
    stats: { attack: 10, defense: 0, parryChance: 0.4, critChance: 0.2 },
    sounds: {
      take: "sword-take.wav",
      attack: "sword-combat-attack.mp3",
      block: "sword-combat-block.wav",
      crit: "sword-combat-crit.wav",
      clash: "sword-combat-clash.wav",
      windup: "sword-combat-windup.mp3",
    },
    modalStyle: { scale: 1.35, rotation: "-55deg" },
    slotStyle: { scale: 1.4, rotation: "-45deg" },
  },
  "buckler-shield": {
    id: "buckler-shield",
    name: "Buckler Shield",
    description: "A simple yet effective shield. Adds +5 Defense.",
    type: "armor",
    icon: Shield,
    image: "/images/items/buckler-shield.png",
    modalStyle: { scale: 0.8, rotation: "0deg" },
    stats: { attack: 0, defense: 5, parryChance: 0.1, critChance: 0 },
    slotStyle: { scale: 1.0 },
  },
  "rusty-key": {
    id: "rusty-key",
    name: "Rusty Key",
    description: "An old iron key. It looks brittle.",
    type: "key",
    icon: Key,
    image: "/images/items/rusty-key.png",
    slotStyle: { scale: 1.0, rotation: "45deg" },
    modalStyle: { scale: 1.0, rotation: "45deg" },
  },
  "potion": {
    id: "potion",
    name: "Red Potion",
    description: "A bubbling red liquid. Heals 50 HP.",
    type: "consumable",
    icon: FlaskConical,
    image: "/images/items/potion.png",
    slotStyle: { scale: 0.9 },
    modalStyle: { scale: 0.8, rotation: "0deg" },
    glow: { color: "#ef4444", offsetY: "4px", blur: "10px", intensity: 1 },
    effect: (state) => ({ health: Math.min(state.health + 50, state.maxHealth) }),
  },
  "glowing-gem": {
    id: "glowing-gem",
    name: "Glowing Gem",
    description: "A stone pulsing with blue light. It feels warm to the touch.",
    type: "key",
    icon: Gem,
    image: "/images/items/glowing-gem.png",
    slotStyle: { scale: 0.9 },
    modalStyle: { scale: 0.6 },
    glow: { color: "#10b981", blur: "48px", pulse: true, intensity: 3 },
  },
};

export const WORLD: Record<string, Room> = {
  "start": {
    id: "start",
    name: "Damp Cell",
    description: "The moss-slicked walls of the cell weep with moisture, illuminated by the flicker of restless torches. The heavy wooden door has been left ajar.",
    exits: { north: "hallway" },
    items: ["crumpled-note", "rusty-sword"],
    coordinates: { x: 0, y: 0 },
    shortName: "CELL",
    image: "/images/scenes/damp-cell.png",
    videoLoop: {
      path: "/video/scenes/damp-cell.mp4",
      volume: 0.2
    },
    audioLoop: { path: "/audio/dripping-water.mp3" },
    heldItemBrightness: 0.3,
    narration: {
      text: "You wake with a start! Such a strange dream... The cell door! It's... open! This is your chance, but you must act quickly! Time to move.",
      path: "/audio/narration/damp-cell.mp3",
      volume: 0.7,
    },
    hotspots: [
      { type: "door", direction: "north", top: "25%", left: "40%", width: "20%", height: "55%", label: "Cell Door" },
      { type: "item", itemId: "crumpled-note", top: "85%", left: "25%", width: "10%", height: "10%", rotation: "15deg", brightness: 0.7, label: "CrumpledNote" },
      { type: "item", itemId: "rusty-sword", top: "55%", left: "70%", width: "5%", height: "30%", rotation: "185deg", brightness: 0.5, label: "Rusty Sword" },
    ],
    transitionVideos: {
      north: { path: "/video/scenes/transition-from-damp-cell-to-dark-hallway.mp4", volume: 1.0 },
    },
    facing: "north"
  },
  "hallway": {
    id: "hallway",
    name: "Dark Hallway",
    description: "A dimly lit junction between stone walls choked with damp and moss. Beams of light spill from high above onto a floor of cracked slate and stagnant puddles, but a shimmering lock spell bars the way north.",
    exits: { south: "start", east: "archives", west: "armory", north: "forest" },
    items: ["buckler-shield"],
    coordinates: { x: 0, y: 1 },
    shortName: "HALL",
    lockedExits: {
      north: { keyId: "glowing-gem", lockedMessage: "A magical barrier blocks the way. Needs a gem.", unlockImage: "/images/scenes/dark-hallway-2.png" },
      east: { keyId: "rusty-key", lockedMessage: "The heavy oak door is locked." }
    },
    image: "/images/scenes/dark-hallway.png",
    videoLoop: {
      path: "/video/scenes/dark-hallway.mp4",
      volume: 0.5
    },
    heldItemBrightness: 0.4,
    narration: {
      text: "That's old magic! You'll need a gem.",
      path: "/audio/narration/dark-hallway.mp3",
      volume: 0.8,
    },
    audioLoop: {
      path: "/audio/eerie-echoes.mp3",
      volume: 0.08
    },
    hotspots: [
      { type: "door", direction: "north", top: "30%", left: "40%", width: "20%", height: "45%", label: "North Gate" },
      { type: "door", direction: "east", top: "10%", left: "80%", width: "10%", height: "80%", label: "Archives Door" },
      { type: "door", direction: "west", top: "10%", left: "10%", width: "10%", height: "80%", label: "Armory Door" },
      { type: "item", itemId: "buckler-shield", top: "70%", left: "19%", width: "16%", height: "16%", rotation: "15deg", brightness: 0.5, label: "Buckler Shield" }
    ],
    transitionVideos: {
      east: "/video/scenes/transition-from-dark-hallway-to-archives.mp4",
      west: "/video/scenes/transition-from-dark-hallway-to-armory.mp4"
    },
    facing: "north"
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
    heldItemBrightness: 0.5,
    facing: "west",
    hotspots: [
      { type: "item", itemId: "rusty-key", top: "30%", left: "40%", width: "20%", height: "45%", rotation: "90deg", scale: 0.8, brightness: 1.0, label: "Rusty Key", glow: { color: "rgba(6, 182, 212, 1)", intensity: 2, blur: "15px", pulse: true } },
    ],
    isSignposted: true
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
    heldItemBrightness: 0.4,
    facing: "east",
    hotspots: [
      {
        type: "item", itemId: "potion", top: "66%", left: "34%", width: "6%", height: "14%", scale: 1.0, brightness: 0.7, label: "Health Potion"
      },
      { type: "item", itemId: "glowing-gem", top: "51%", left: "55%", width: "2%", height: "4%", rotation: "-22deg", scale: 0.8, brightness: 1.2, label: "Glowing Gem" },
    ],
    isSignposted: true
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
    heldItemBrightness: 0.3,
    facing: "north"
  }
};

export const DIRECTIONS: Direction[] = ["north", "south", "east", "west"];
