// ct:./DrownedspanwerActions
import {
  world,
  system
} from "@minecraft/server";
var SPAWNER_BLOCK_ID = "relleks_dungeons:drowned_spawner";
var TRIGGER_RADIUS = 8;
var ZOMBIE_COUNT = 5;
var COOLDOWN_TICKS = 36e3;
var CHECK_INTERVAL = 60;
var DISCOVERY_INTERVAL = 200;
var DISCOVERY_RADIUS = 16;
var DISCOVERY_HEIGHT = 8;
var PROP_COOLDOWN = "relleks_dungeons:cooldown_";
var PROP_ACTIVE = "relleks_dungeons:active_";
var activeSpawners = /* @__PURE__ */ new Map();
function posKey(loc) {
  return `${loc.dimension.id}_${loc.x}_${loc.y}_${loc.z}`;
}
function registerSpawner(loc) {
  const key = posKey(loc);
  if (activeSpawners.has(key))
    return;
  activeSpawners.set(key, loc);
}
function getCooldown(loc) {
  const value = world.getDynamicProperty(PROP_COOLDOWN + posKey(loc));
  return typeof value === "number" ? value : 0;
}
function setCooldown(loc, value) {
  world.setDynamicProperty(PROP_COOLDOWN + posKey(loc), value);
}
function isActive(loc) {
  const value = world.getDynamicProperty(PROP_ACTIVE + posKey(loc));
  return value === true;
}
function setActive(loc, value) {
  world.setDynamicProperty(PROP_ACTIVE + posKey(loc), value);
  const block = loc.dimension.getBlock(loc);
  if (block) {
    block.setPermutation(block.permutation.withState("relleks_dungeons:is_lit", value));
  }
}
function playerNearby(loc) {
  const radiusSq = TRIGGER_RADIUS * TRIGGER_RADIUS;
  for (const player of loc.dimension.getPlayers()) {
    const dx = player.location.x - loc.x;
    const dy = player.location.y - loc.y;
    const dz = player.location.z - loc.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq <= radiusSq)
      return true;
  }
  return false;
}
function getSpawnerTag(loc) {
  return `crypt_${posKey(loc)}`;
}
function spawnWave(loc) {
  const tag = getSpawnerTag(loc);
  let spawned = 0;
  for (let i = 0; i < ZOMBIE_COUNT; i++) {
    try {
      const drowned = loc.dimension.spawnEntity(
        "minecraft:drowned",
        {
          x: loc.x + (Math.random() * 4 - 2),
          y: loc.y + 1,
          z: loc.z + (Math.random() * 4 - 2)
        }
      );
      drowned.addTag(tag);
      spawned++;
    } catch {
    }
  }
  if (spawned > 0) {
    setActive(loc, true);
  }
}
function giveReward(loc) {
  try {
    loc.dimension.runCommand(`loot spawn ${loc.x} ${loc.y + 1} ${loc.z} loot "chests/swamp_crypt_pots"`);
  } catch (e) {
    console.warn(
      `Reward command failed: ${e}`
    );
  }
}
function tickSpawner(loc) {
  const now = system.currentTick;
  const cooldown = getCooldown(loc);
  if (cooldown > now)
    return;
  const tag = getSpawnerTag(loc);
  if (isActive(loc)) {
    const remaining = loc.dimension.getEntities({ tags: [tag] });
    if (remaining.length === 0) {
      giveReward(loc);
      setActive(loc, false);
      setCooldown(loc, now + COOLDOWN_TICKS);
    }
    return;
  }
  if (playerNearby(loc)) {
    spawnWave(loc);
  }
}
function discoverSpawners() {
  for (const player of world.getAllPlayers()) {
    const dim = player.dimension;
    const px = Math.floor(player.location.x);
    const py = Math.floor(player.location.y);
    const pz = Math.floor(player.location.z);
    for (let x = px - DISCOVERY_RADIUS; x <= px + DISCOVERY_RADIUS; x++) {
      for (let z = pz - DISCOVERY_RADIUS; z <= pz + DISCOVERY_RADIUS; z++) {
        for (let y = py - DISCOVERY_HEIGHT; y <= py + DISCOVERY_HEIGHT; y++) {
          try {
            const block = dim.getBlock({ x, y, z });
            if (block?.typeId === SPAWNER_BLOCK_ID) {
              registerSpawner({ dimension: dim, x, y, z });
            }
          } catch {
          }
        }
      }
    }
  }
}
system.runInterval(
  discoverSpawners,
  DISCOVERY_INTERVAL
);
system.runInterval(
  () => {
    for (const loc of activeSpawners.values()) {
      try {
        tickSpawner(loc);
      } catch (e) {
        const now = system.currentTick;
        setActive(loc, false);
        setCooldown(loc, now + COOLDOWN_TICKS);
      }
    }
  },
  CHECK_INTERVAL
);
var DrownedspawnerActions = class {
  onStepOn(_event) {
  }
};
function initDrownedspawnerActions() {
  system.beforeEvents.startup.subscribe(
    (event) => {
      event.blockComponentRegistry.registerCustomComponent(
        "relleks_dungeons:drownedspawner_actions",
        new DrownedspawnerActions()
      );
    }
  );
}

// ct:/main.js
initDrownedspawnerActions();
