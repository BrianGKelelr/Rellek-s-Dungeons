import { world, BlockPermutation } from "@minecraft/server";

const TARGET_MOB_ID = "relleks_dungeons:boss_ancient"; 
const BLOCK_TO_PLACE = "minecraft:web";

world.afterEvents.entityHurt.subscribe((event) => {
    const hurtEntity = event.hurtEntity;
    const damageSource = event.damageSource;

    // Check if the hurt entity is a player
    if (hurtEntity.typeId !== "minecraft:player"){
        return;
    }

    // Check if there is an attacking entity and if it is the correct entity
    const attacker = damageSource.damagingEntity;
    if (!attacker || attacker.typeId !== TARGET_MOB_ID){
        return;
    }

    const dimension = hurtEntity.dimension;
    const loc = hurtEntity.location;
    
    // Target the block position directly at the player's feet
    const blockLocation = { 
        x: Math.floor(loc.x), 
        y: Math.floor(loc.y), 
        z: Math.floor(loc.z) 
    };

    try {
        const permutation = BlockPermutation.resolve(BLOCK_TO_PLACE);
        for(let i = 0; i <= 3; i++){
            const randomLocation = getRandomPosition(blockLocation);
            const block = dimension.getBlock(randomLocation);
            if(block.typeId == "minecraft:air"){
                dimension.setBlockPermutation(randomLocation, permutation);
            }
        }
    } 
    catch (error) {
        console.warn("Failed to place block: " + error);
    }
});

function getRandomPosition(blockLocation: {x: number, y: number, z: number}): {x: number, y: number, z: number} {
    return {
        x: blockLocation.x + Math.floor(Math.random() * 4) - 2,
        y: blockLocation.y + Math.floor(Math.random() * 4) - 2,
        z: blockLocation.z + Math.floor(Math.random() * 4) - 2
    };
}