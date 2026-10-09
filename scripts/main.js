// ct:./boss_ancient_behavior
import { world, BlockPermutation } from "@minecraft/server";
var TARGET_MOB_ID = "relleks_dungeons:boss_ancient";
var BLOCK_TO_PLACE = "minecraft:web";
world.afterEvents.entityHurt.subscribe((event) => {
  const hurtEntity = event.hurtEntity;
  const damageSource = event.damageSource;
  if (hurtEntity.typeId !== "minecraft:player") {
    return;
  }
  const attacker = damageSource.damagingEntity;
  if (!attacker || attacker.typeId !== TARGET_MOB_ID) {
    return;
  }
  const dimension = hurtEntity.dimension;
  const loc = hurtEntity.location;
  const blockLocation = {
    x: Math.floor(loc.x),
    y: Math.floor(loc.y),
    z: Math.floor(loc.z)
  };
  try {
    const permutation = BlockPermutation.resolve(BLOCK_TO_PLACE);
    for (let i = 0; i <= 3; i++) {
      const randomLocation = getRandomPosition(blockLocation);
      const block = dimension.getBlock(randomLocation);
      if (block.typeId == "minecraft:air") {
        dimension.setBlockPermutation(randomLocation, permutation);
      }
    }
  } catch (error) {
    console.warn("Failed to place block: " + error);
  }
});
function getRandomPosition(blockLocation) {
  return {
    x: blockLocation.x + Math.floor(Math.random() * 4) - 2,
    y: blockLocation.y + Math.floor(Math.random() * 4) - 2,
    z: blockLocation.z + Math.floor(Math.random() * 4) - 2
  };
}
