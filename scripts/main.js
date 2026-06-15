// ct:./DrownedspanwerActions
import {
  world,
  system,
  Enchantment
} from "@minecraft/server";
var SPAWNER_BLOCK_ID = "relleks_dungeons:drowned_spawner";
var TRIGGER_RADIUS = 11;
var ZOMBIE_COUNT = 8;
var SKELETON_COUNT = 5;
var SLIME_COUNT = 3;
var SILVERFISH_COUNT = 15;
var SPIDER_COUNT = 8;
var CAVE_SPIDER_COUNT = 5;
var COOLDOWN_TICKS = 36e3;
var CHECK_INTERVAL = 60;
var DISCOVERY_INTERVAL = 200;
var DISCOVERY_RADIUS = 25;
var DISCOVERY_HEIGHT = 5;
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
function equipDrowned(enemy, loc) {
  system.runTimeout(() => {
    const { x, y, z } = enemy.location;
    const roll = Math.random();
    let material = "";
    if (roll > 0.9) material = "iron";
    else if (roll > 0.75) material = "chainmail";
    else if (roll > 0.4) material = "copper";
    if (material) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.head 0 ${material}_helmet`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.chest 0 ${material}_chestplate`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.legs 0 ${material}_leggings`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.feet 0 ${material}_boots`);
    }
    if (Math.random() > 0.7) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.weapon.mainhand 0 trident`);
    }
  }, 1);
}
function equipBogged(enemy, loc) {
  system.runTimeout(() => {
    const { x, y, z } = enemy.location;
    const roll = Math.random();
    let material = "";
    if (roll > 0.9) material = "iron";
    else if (roll > 0.75) material = "chainmail";
    else if (roll > 0.4) material = "copper";
    if (material) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=bogged] slot.armor.head 0 ${material}_helmet`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=bogged] slot.armor.chest 0 ${material}_chestplate`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=bogged] slot.armor.legs 0 ${material}_leggings`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=bogged] slot.armor.feet 0 ${material}_boots`);
    }
    if (Math.random() > 0.7) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run enchant @n[type=bogged] power 2`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run enchant @n[type=bogged] punch 1`);
    }
  }, 1);
}
function isValidSpawnPosition(loc, x, y, z) {
  try {
    const feet = loc.getBlock({ x, y, z });
    const head = loc.getBlock({ x, y: y + 1, z });
    if (!feet || !head)
      return false;
    if (!feet.isAir && !feet.isLiquid)
      return false;
    if (!head.isAir && !head.isLiquid)
      return false;
    return true;
  } catch (e) {
    console.warn(`Spawner Error: ${e}`);
    return false;
  }
}
function spawnWave(loc) {
  const tag = getSpawnerTag(loc);
  const MAX_ATTEMPTS = 10;
  let spawned = 0;
  const block = loc.dimension.getBlock(loc);
  if (block.permutation.getState("relleks_dungeons:spawner_type") === "drowned") {
    for (let i = 0; i < ZOMBIE_COUNT; i++) {
      let placed = false;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const x = Math.floor(loc.x + (Math.random() * 4 - 2));
        const z = Math.floor(loc.z + (Math.random() * 4 - 2));
        const y = loc.y + 1;
        if (!isValidSpawnPosition(loc.dimension, x, y, z)) continue;
        try {
          const enemy = loc.dimension.spawnEntity("minecraft:drowned", { x, y, z });
          enemy.addTag(tag);
          spawned++;
          placed = true;
          equipDrowned(enemy, loc);
          break;
        } catch (e) {
          console.warn(`Spawner Error: ${e}`);
        }
      }
      if (!placed) {
      }
    }
    if (spawned > 0) {
      setActive(loc, true);
    }
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "bogged") {
    for (let i = 0; i < SKELETON_COUNT; i++) {
      let placed = false;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const x = Math.floor(loc.x + (Math.random() * 4 - 2));
        const z = Math.floor(loc.z + (Math.random() * 4 - 2));
        const y = loc.y + 1;
        if (!isValidSpawnPosition(loc.dimension, x, y, z)) continue;
        try {
          const enemy = loc.dimension.spawnEntity("minecraft:bogged", { x, y, z });
          enemy.addTag(tag);
          spawned++;
          placed = true;
          equipBogged(enemy, loc);
          break;
        } catch (e) {
          console.warn(`Spawner Error: ${e}`);
        }
      }
      if (!placed) {
      }
    }
    if (spawned > 0) {
      setActive(loc, true);
    }
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "zombie") {
    for (let i = 0; i < ZOMBIE_COUNT; i++) {
      try {
        const enemy = loc.dimension.spawnEntity(
          "minecraft:zombie",
          {
            x: loc.x,
            y: loc.y + 1,
            z: loc.z
          }
        );
        enemy.addTag(tag);
        spawned++;
      } catch {
      }
    }
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "skeleton") {
    for (let i = 0; i < SKELETON_COUNT; i++) {
      try {
        const enemy = loc.dimension.spawnEntity(
          "minecraft:skeleton",
          {
            x: loc.x,
            y: loc.y + 1,
            z: loc.z
          }
        );
        enemy.addTag(tag);
        spawned++;
      } catch {
      }
    }
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "husk") {
    for (let i = 0; i < ZOMBIE_COUNT; i++) {
      try {
        const enemy = loc.dimension.spawnEntity(
          "minecraft:husk",
          {
            x: loc.x,
            y: loc.y + 1,
            z: loc.z
          }
        );
        enemy.addTag(tag);
        spawned++;
      } catch {
      }
    }
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "parched") {
    for (let i = 0; i < SKELETON_COUNT; i++) {
      try {
        const enemy = loc.dimension.spawnEntity(
          "minecraft:parched",
          {
            x: loc.x,
            y: loc.y + 1,
            z: loc.z
          }
        );
        enemy.addTag(tag);
        spawned++;
      } catch {
      }
    }
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "spider") {
    for (let i = 0; i < SPIDER_COUNT; i++) {
      try {
        const enemy = loc.dimension.spawnEntity(
          "minecraft:spider",
          {
            x: loc.x,
            y: loc.y + 1,
            z: loc.z
          }
        );
        enemy.addTag(tag);
        spawned++;
      } catch {
      }
    }
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "cave_spider") {
    for (let i = 0; i < CAVE_SPIDER_COUNT; i++) {
      try {
        const enemy = loc.dimension.spawnEntity(
          "minecraft:cave_spider",
          {
            x: loc.x,
            y: loc.y + 1,
            z: loc.z
          }
        );
        enemy.addTag(tag);
        spawned++;
      } catch {
      }
    }
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "slime") {
    for (let i = 0; i < SLIME_COUNT; i++) {
      try {
        const enemy = loc.dimension.spawnEntity(
          "minecraft:slime",
          {
            x: loc.x,
            y: loc.y + 1,
            z: loc.z
          }
        );
        enemy.addTag(tag);
        spawned++;
      } catch {
      }
    }
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "silverfish") {
    for (let i = 0; i < SILVERFISH_COUNT; i++) {
      try {
        const enemy = loc.dimension.spawnEntity(
          "minecraft:silverfish",
          {
            x: loc.x,
            y: loc.y + 1,
            z: loc.z
          }
        );
        enemy.addTag(tag);
        spawned++;
      } catch {
      }
    }
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "stray") {
    for (let i = 0; i < SKELETON_COUNT; i++) {
      try {
        const enemy = loc.dimension.spawnEntity(
          "minecraft:skeleton",
          {
            x: loc.x,
            y: loc.y + 1,
            z: loc.z
          }
        );
        enemy.addTag(tag);
        spawned++;
      } catch {
      }
    }
  }
  if (spawned > 0) {
    setActive(loc, true);
  }
}
function giveReward(loc) {
  try {
    for (const player of loc.dimension.getPlayers()) {
      const dx = player.location.x - loc.x;
      const dy = player.location.y - loc.y;
      const dz = player.location.z - loc.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq <= 400) {
        loc.dimension.runCommand(`loot spawn ${loc.x} ${loc.y + 1.3} ${loc.z} loot "spawners/swamp_crypt_spawners"`);
      }
    }
  } catch (e) {
    console.warn(`Reward command failed: ${e}`);
  }
}
function tickSpawner(loc) {
  const now = system.currentTick;
  const block = loc.dimension.getBlock(loc);
  if (block) {
    const litState = block.permutation.getState("relleks_dungeons:is_lit");
    const shouldBeLit = isActive(loc);
    if (litState !== shouldBeLit) {
      block.setPermutation(
        block.permutation.withState("relleks_dungeons:is_lit", shouldBeLit)
      );
    }
  }
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
      } catch {
        const now = system.currentTick;
        world.setDynamicProperty(PROP_ACTIVE + posKey(loc), false);
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
