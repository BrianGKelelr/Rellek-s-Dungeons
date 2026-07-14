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
var SLIME_COUNT = 4;
var SPIDER_COUNT = 8;
var SILVERFISH_COUNT = 15;
var WRAITH_COUNT = 2;
var COOLDOWN_TICKS = 36e3;
var CHECK_INTERVAL = 60;
var DISCOVERY_INTERVAL = 200;
var DISCOVERY_RADIUS = 25;
var DISCOVERY_HEIGHT = 5;
var PROP_PENDING = "relleks_dungeons:pending_";
function getPending(loc) {
  const value = world.getDynamicProperty(PROP_PENDING + posKey(loc));
  return typeof value === "number" ? value : 0;
}
function setPending(loc, value) {
  world.setDynamicProperty(PROP_PENDING + posKey(loc), value);
}
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
function setActive(loc, activate, isOminous) {
  world.setDynamicProperty(PROP_ACTIVE + posKey(loc), activate);
  const block = loc.dimension.getBlock(loc);
  if (block) {
    block.setPermutation(block.permutation.withState("relleks_dungeons:is_lit", activate));
    if (activate) {
      if (isOminous) {
        loc.dimension.spawnParticle("minecraft:trial_spawner_detection_ominous", loc);
      } else {
        loc.dimension.spawnParticle("minecraft:trial_spawner_detection", loc);
      }
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
    if (distSq <= radiusSq) {
      const effect = player.getEffect("bad_omen");
      const effect2 = player.getEffect("trial_omen");
      if (effect || effect2) {
        return [true, true];
      } else {
        return [true, false];
      }
    }
  }
  return [false, false];
}
function getSpawnerTag(loc) {
  return `crypt_${posKey(loc)}`;
}
function equipDrowned(enemy, loc, hasBadOmen) {
  system.runTimeout(() => {
    const { x, y, z } = enemy.location;
    const roll = Math.random();
    let material = "";
    const multiplier = hasBadOmen ? 1.5 : 1;
    if (roll * multiplier > 0.9) material = "iron";
    else if (roll * multiplier > 0.75) material = "chainmail";
    else if (roll * multiplier > 0.4) material = "copper";
    if (material) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.head 0 ${material}_helmet`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.chest 0 ${material}_chestplate`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.legs 0 ${material}_leggings`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.feet 0 ${material}_boots`);
    }
    if (Math.random() * multiplier > 0.7) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.weapon.mainhand 0 trident`);
    }
  }, 1);
}
function equipBogged(enemy, loc, hasBadOmen) {
  system.runTimeout(() => {
    const { x, y, z } = enemy.location;
    const roll = Math.random();
    let material = "";
    const multiplier = hasBadOmen ? 1.5 : 1;
    if (roll * multiplier > 0.9) material = "iron";
    else if (roll * multiplier > 0.75) material = "chainmail";
    else if (roll * multiplier > 0.4) material = "copper";
    if (material) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=bogged] slot.armor.head 0 ${material}_helmet`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=bogged] slot.armor.chest 0 ${material}_chestplate`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=bogged] slot.armor.legs 0 ${material}_leggings`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=bogged] slot.armor.feet 0 ${material}_boots`);
    }
    if (Math.random() * multiplier > 0.7) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run enchant @n[type=bogged] power 2`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run enchant @n[type=bogged] punch 1`);
    }
  }, 1);
}
function equipZombie(enemy, loc, hasBadOmen) {
  system.runTimeout(() => {
    const { x, y, z } = enemy.location;
    const roll = Math.random();
    let material = "";
    const multiplier = hasBadOmen ? 1.5 : 1;
    if (roll * multiplier > 0.95) material = "chainmail";
    else if (roll * multiplier > 0.75) material = "copper";
    if (material) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=zombie] slot.armor.head 0 ${material}_helmet`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=zombie] slot.armor.chest 0 ${material}_chestplate`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=zombie] slot.armor.legs 0 ${material}_leggings`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=zombie] slot.armor.feet 0 ${material}_boots`);
    }
    if (Math.random() * multiplier > 0.9) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=zombie] slot.weapon.mainhand 0 iron_sword`);
    }
  }, 1);
}
function equipSkeleton(enemy, loc, hasBadOmen) {
  system.runTimeout(() => {
    const { x, y, z } = enemy.location;
    const roll = Math.random();
    let material = "";
    const multiplier = hasBadOmen ? 1.5 : 1;
    if (roll * multiplier > 0.95)
      material = "chainmail";
    else if (roll * multiplier > 0.75)
      material = "copper";
    if (material) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=skeleton] slot.armor.head 0 ${material}_helmet`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=skeleton] slot.armor.chest 0 ${material}_chestplate`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=skeleton] slot.armor.legs 0 ${material}_leggings`);
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=skeleton] slot.armor.feet 0 ${material}_boots`);
    }
  }, 1);
}
function equipHusk(enemy, loc, hasBadOmen) {
}
function equipParched(enemy, loc, hasBadOmen) {
}
function equipSpider(enemy, loc, hasBadOmen) {
  system.runTimeout(() => {
    const { x, y, z } = enemy.location;
    const roll = Math.random();
    let effect = "";
    const multiplier = hasBadOmen ? 1.5 : 1;
    if (roll * multiplier > 0.95)
      effect = "invisibility";
    if (roll * multiplier > 0.8)
      effect = "speed";
    if (effect) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run effect @n[type=spider] ${effect} infinite 0 false`);
    }
  }, 1);
}
function equipCaveSpider(enemy, loc, hasBadOmen) {
  system.runTimeout(() => {
    const { x, y, z } = enemy.location;
    const roll = Math.random();
    let effect = "";
    const multiplier = hasBadOmen ? 1.5 : 1;
    if (roll * multiplier > 0.95)
      effect = "invisibility";
    if (roll * multiplier > 0.8)
      effect = "speed";
    if (effect) {
      loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run effect @n[type=cave_spider] ${effect} infinite 0 false`);
    }
  }, 1);
}
function equipWraith(enemy, loc, hasBadOmen) {
}
function equipSlime(enemy, loc, hasBadOmen) {
}
function equipStray(enemy, loc, hasBadOmen) {
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
function spawnWave(loc, hasBadOmen) {
  const block = loc.dimension.getBlock(loc);
  if (block.permutation.getState("relleks_dungeons:spawner_type") === "drowned") {
    const count = Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1));
    setPending(loc, count);
    spawnWaveRecursive(loc, Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:drowned", equipDrowned, hasBadOmen, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "bogged") {
    const count = Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1));
    setPending(loc, count);
    spawnWaveRecursive(loc, Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:bogged", equipBogged, hasBadOmen, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "zombie") {
    const count = Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1));
    setPending(loc, count);
    spawnWaveRecursive(loc, Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:zombie", equipZombie, hasBadOmen, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "skeleton") {
    const count = Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1));
    setPending(loc, count);
    spawnWaveRecursive(loc, Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:skeleton", equipSkeleton, hasBadOmen, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "husk") {
    const count = Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1));
    setPending(loc, count);
    spawnWaveRecursive(loc, Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:husk", equipHusk, hasBadOmen, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "parched") {
    const count = Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1));
    setPending(loc, count);
    spawnWaveRecursive(loc, Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:parched", equipParched, hasBadOmen, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "spider") {
    const count = Math.floor(SPIDER_COUNT * (hasBadOmen ? 1.5 : 1));
    setPending(loc, count);
    spawnWaveRecursive(loc, Math.floor(SPIDER_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:spider", equipSpider, hasBadOmen, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "cave_spider") {
    const count = Math.floor(SILVERFISH_COUNT * (hasBadOmen ? 1.5 : 1));
    setPending(loc, count);
    spawnWaveRecursive(loc, Math.floor(SILVERFISH_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:cave_spider", equipCaveSpider, hasBadOmen, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "slime") {
    const count = Math.floor(SLIME_COUNT * (hasBadOmen ? 1.5 : 1));
    setPending(loc, count);
    spawnWaveRecursive(loc, Math.floor(SLIME_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:slime", equipSlime, hasBadOmen, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "stray") {
    const count = Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1));
    setPending(loc, count);
    spawnWaveRecursive(loc, Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:stray", equipStray, hasBadOmen, 0);
  } else if (block.permutation.getState("relleks_dungeons:spawner_type") === "wraith") {
    const count = Math.floor(WRAITH_COUNT * (hasBadOmen ? 1.5 : 1));
    setPending(loc, count);
    spawnWaveRecursive(loc, Math.floor(WRAITH_COUNT * (hasBadOmen ? 1.5 : 1)), "relleks_dungeons:wraith", equipWraith, hasBadOmen, 0);
  }
}
function spawnWaveRecursive(loc, count, type, equip, hasBadOmen, iterations) {
  if (iterations > 35 || count <= 0) {
    setPending(loc, 0);
    return;
  }
  system.runTimeout(() => {
    const block = loc.dimension.getBlock(loc);
    if (!block || block.typeId !== SPAWNER_BLOCK_ID) {
      setPending(loc, 0);
      return;
    }
    const tag = getSpawnerTag(loc);
    const MAX_ATTEMPTS = 10;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const x = Math.floor(loc.x + (Math.random() * 4 - 2));
      const z = Math.floor(loc.z + (Math.random() * 4 - 2));
      const y = loc.y + 1;
      if (!isValidSpawnPosition(loc.dimension, x, y, z)) continue;
      try {
        const enemy = loc.dimension.spawnEntity(`${type}`, { x, y, z });
        loc.dimension.runCommand(`playsound trial_spawner.spawn_mob @a ${loc.x} ${loc.y} ${loc.z}`);
        enemy.addTag(tag);
        equip(enemy, loc, hasBadOmen);
        setPending(loc, getPending(loc) - 1);
        break;
      } catch (e) {
        console.warn(`Spawner Error: ${e}`);
      }
    }
    spawnWaveRecursive(loc, count - 1, type, equip, hasBadOmen, iterations + 1);
  }, 40);
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
    const stillSpawning = getPending(loc) > 0;
    if (!stillSpawning && remaining.length === 0) {
      giveReward(loc, getNearbyPlayers(loc));
      setActive(loc, false, false);
      setCooldown(loc, now + COOLDOWN_TICKS);
    }
    return;
  }
  const [playerIsNearby, hasBadOmen] = playerNearby(loc);
  if (playerIsNearby) {
    setActive(loc, true, hasBadOmen);
    spawnWave(loc, hasBadOmen);
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
  if (!block) {
    return false;
  }
  if (block.typeId !== SPAWNER_BLOCK_ID) {
    activeSpawners.delete(key);
    world.setDynamicProperty(PROP_COOLDOWN + key, void 0);
    world.setDynamicProperty(PROP_ACTIVE + key, void 0);
    world.setDynamicProperty(PROP_PENDING + key, void 0);
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
world.afterEvents.playerBreakBlock.subscribe((event) => {
  const blockId = event.brokenBlockPermutation.type.id;
  if (blockId !== SPAWNER_BLOCK_ID) {
    return;
  }
  const loc = {
    // the block location
    dimension: event.dimension,
    x: event.block.x,
    y: event.block.y,
    z: event.block.z
  };
  cleanupSpawner(loc);
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
        world.setDynamicProperty(PROP_PENDING + posKey(loc), 0);
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
