// ct:./DrownedspanwerActions
import {
  world,
  system,
  Enchantment
} from "@minecraft/server";
var SPAWNER_BLOCK_ID = "relleks_dungeons:drowned_spawner";
var TRIGGER_RADIUS = 11;
var ZOMBIE_COUNT = 8;
var SKELETON_COUNT = 4;
var SLIME_COUNT = 2;
var SILVERFISH_COUNT = 12;
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
    if (value) {
      loc.dimension.spawnParticle("minecraft:trial_spawner_detection", loc);
      loc.dimension.runCommand(`playsound trial_spawner.detect_player @a ${loc.x} ${loc.y} ${loc.z}`);
    }
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
function equipZombie(enemy, loc) {
  system.runTimeout(() => {
    const { x, y, z } = enemy.location;
    const roll = Math.random();
    let material = "";
    if (roll > 0.9) material = "chainmail";
    else if (roll > 0.75) material = "copper";
    if (material) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=zombie] slot.armor.head 0 ${material}_helmet`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=zombie] slot.armor.chest 0 ${material}_chestplate`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=zombie] slot.armor.legs 0 ${material}_leggings`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=zombie] slot.armor.feet 0 ${material}_boots`);
    }
    if (Math.random() > 0.7) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=zombie] slot.weapon.mainhand 0 iron_sword`);
    }
  }, 1);
}
function equipSkeleton(enemy, loc) {
  system.runTimeout(() => {
    const { x, y, z } = enemy.location;
    const roll = Math.random();
    let material = "";
    if (roll > 0.9) material = "chainmail";
    else if (roll > 0.75) material = "copper";
    if (material) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=skeleton] slot.armor.head 0 ${material}_helmet`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=skeleton] slot.armor.chest 0 ${material}_chestplate`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=skeleton] slot.armor.legs 0 ${material}_leggings`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=skeleton] slot.armor.feet 0 ${material}_boots`);
    }
  }, 1);
}
function equipHusk(enemy, loc) {
}
function equipParched(enemy, loc) {
}
function equipSpider(enemy, loc) {
}
function equipCaveSpider(enemy, loc) {
}
function equipSlime(enemy, loc) {
}
function equipSilverfish(enemy, loc) {
}
function equipStray(enemy, loc) {
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
  const block = loc.dimension.getBlock(loc);
  if (block.permutation.getState("relleks_dungeons:spawner_type") === "drowned") {
    spawnWaveRecursive(loc, ZOMBIE_COUNT, "drowned", equipDrowned, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "bogged") {
    spawnWaveRecursive(loc, SKELETON_COUNT, "bogged", equipBogged, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "zombie") {
    spawnWaveRecursive(loc, ZOMBIE_COUNT, "zombie", equipZombie, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "skeleton") {
    spawnWaveRecursive(loc, SKELETON_COUNT, "skeleton", equipSkeleton, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "husk") {
    spawnWaveRecursive(loc, ZOMBIE_COUNT, "husk", equipHusk, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "parched") {
    spawnWaveRecursive(loc, SKELETON_COUNT, "parched", equipParched, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "spider") {
    spawnWaveRecursive(loc, SPIDER_COUNT, "spider", equipSpider, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "cave_spider") {
    spawnWaveRecursive(loc, CAVE_SPIDER_COUNT, "cave_spider", equipCaveSpider, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "slime") {
    spawnWaveRecursive(loc, SLIME_COUNT, "slime", equipSlime, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "silverfish") {
    spawnWaveRecursive(loc, SILVERFISH_COUNT, "silverfish", equipSilverfish, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "stray") {
    spawnWaveRecursive(loc, SKELETON_COUNT, "stray", equipStray, 0);
  }
  setActive(loc, true);
}
function spawnWaveRecursive(loc, count, type, equip, iterations) {
  if (iterations > 35 || count <= 0) {
    return;
  }
  const block = loc.dimension.getBlock(loc);
  if (cleanupSpawner(loc) || !block) {
    return;
  }
  if (count > 0) {
    system.runTimeout(() => {
      const tag = getSpawnerTag(loc);
      const MAX_ATTEMPTS = 10;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const x = Math.floor(loc.x + (Math.random() * 4 - 2));
        const z = Math.floor(loc.z + (Math.random() * 4 - 2));
        const y = loc.y + 1;
        if (!isValidSpawnPosition(loc.dimension, x, y, z)) {
          continue;
        }
        try {
          const enemy = loc.dimension.spawnEntity(`minecraft:${type}`, { x, y, z });
          loc.dimension.runCommand(`playsound trial_spawner.spawn_mob @a ${loc.x} ${loc.y} ${loc.z}`);
          enemy.addTag(tag);
          equip(enemy, loc);
          break;
        } catch (e) {
          console.warn(`Spawner Error: ${e}`);
        }
      }
      spawnWaveRecursive(loc, count - 1, type, equip, iterations + 1);
    }, 40);
  }
}
function getNearbyPlayers(loc) {
  let players = 0;
  for (const player of loc.dimension.getPlayers()) {
    const dx = player.location.x - loc.x;
    const dy = player.location.y - loc.y;
    const dz = player.location.z - loc.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq <= 400) {
      players++;
    }
  }
  return players;
}
function giveReward(loc, players) {
  system.runTimeout(() => {
    if (players > 0) {
      loc.dimension.runCommand(`loot spawn ${loc.x} ${loc.y + 1.3} ${loc.z} loot "spawners/swamp_crypt_spawners"`);
      loc.dimension.runCommand(`playsound trial_spawner.eject_item @a ${loc.x} ${loc.y} ${loc.z}`);
    }
  }, 20);
}
function tickSpawner(loc) {
  if (cleanupSpawner(loc)) {
    return;
  }
  const now = system.currentTick;
  const block = loc.dimension.getBlock(loc);
  if (block) {
    const litState = block.permutation.getState("relleks_dungeons:is_lit");
    const shouldBeLit = isActive(loc);
    if (litState !== shouldBeLit) {
      block.setPermutation(block.permutation.withState("relleks_dungeons:is_lit", shouldBeLit));
    }
  }
  const cooldown = getCooldown(loc);
  if (cooldown > now)
    return;
  const tag = getSpawnerTag(loc);
  if (isActive(loc)) {
    const remaining = loc.dimension.getEntities({ tags: [tag] });
    if (remaining.length === 0) {
      giveReward(loc, getNearbyPlayers(loc));
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
function cleanupSpawner(loc) {
  const block = loc.dimension.getBlock(loc);
  const key = posKey(loc);
  if (block.typeId !== SPAWNER_BLOCK_ID) {
    activeSpawners.delete(key);
    world.setDynamicProperty(PROP_COOLDOWN + key, void 0);
    world.setDynamicProperty(PROP_ACTIVE + key, void 0);
    const tag = getSpawnerTag(loc);
    for (const entity of loc.dimension.getEntities({ tags: [tag] })) {
      try {
        entity.removeTag(tag);
      } catch {
      }
    }
    return true;
  }
  return false;
}
world.beforeEvents.worldInitialize.subscribe((event) => {
  event.blockComponentRegistry.registerCustomComponent("relleks_dungeons:spawner_cleanup", {
    onBreak(event2) {
      const block = event2.block;
      const dimension = event2.dimension;
      const loc = {
        // the block location
        dimension,
        x: block.location.x,
        y: block.location.y,
        z: block.location.z
      };
      cleanupSpawner(loc);
    }
  });
});
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
  system.beforeEvents.startup.subscribe((event) => {
    event.blockComponentRegistry.registerCustomComponent("relleks_dungeons:drownedspawner_actions", new DrownedspawnerActions());
  });
}

// ct:/main.js
initDrownedspawnerActions();
