import {
    world,
    system,
    BlockCustomComponent,
    BlockComponentStepOnEvent,
    DimensionLocation,
    ItemStack,
    Entity,
    Enchantment,
    
} from "@minecraft/server";

/* ============================================================
   CONFIG
============================================================ */

function enchantItem(item: ItemStack, enchantment: string, level: number): void {
    const enchantable = item.getComponent("minecraft:enchantable");

    if (!enchantable)
        return;

    try {
        enchantable.addEnchantment(new Enchantment(enchantment, level));
    } catch (e) {
        console.error(`Error enchanting item: ${e}`);
    }
}

const SPAWNER_BLOCK_ID = "relleks_dungeons:drowned_spawner";

const TRIGGER_RADIUS = 11;

const ZOMBIE_COUNT = 8;
const SKELETON_COUNT = 4;
const SLIME_COUNT = 4;
const SPIDER_COUNT = 8;
const SILVERFISH_COUNT = 15;
const WRAITH_COUNT = 2;

const COOLDOWN_TICKS = 36000; //36000 = 30 minutes

const CHECK_INTERVAL = 60;

const DISCOVERY_INTERVAL = 200;

const DISCOVERY_RADIUS = 25;

const DISCOVERY_HEIGHT = 5;

const PROP_PENDING = "relleks_dungeons:pending_";

function getPending(loc: DimensionLocation): number {
    const value = world.getDynamicProperty(PROP_PENDING + posKey(loc));
    return typeof value === "number" ? value : 0;
}

function setPending(loc: DimensionLocation, value: number): void {
    world.setDynamicProperty(PROP_PENDING + posKey(loc), value);
}

/* ============================================================
   DYNAMIC PROPERTY KEYS
============================================================ */

const PROP_COOLDOWN = "relleks_dungeons:cooldown_";

const PROP_ACTIVE = "relleks_dungeons:active_";

/* ============================================================
   ACTIVE SPAWNERS
============================================================ */

const activeSpawners = new Map<string, DimensionLocation>();

function posKey(loc: DimensionLocation): string {
    return `${loc.dimension.id}_${loc.x}_${loc.y}_${loc.z}`;
}

function registerSpawner(loc: DimensionLocation): void {
    const key = posKey(loc);

    if (activeSpawners.has(key))
        return;

    activeSpawners.set(key, loc);
}

/* ============================================================
   STATE
============================================================ */

function getCooldown(loc: DimensionLocation): number {
    const value = world.getDynamicProperty(PROP_COOLDOWN + posKey(loc));

    return typeof value === "number" ? value : 0;
}

function setCooldown(loc: DimensionLocation, value: number): void {
    world.setDynamicProperty(PROP_COOLDOWN + posKey(loc), value);
}

function isActive(loc: DimensionLocation): boolean {
    const value = world.getDynamicProperty(PROP_ACTIVE + posKey(loc));

    return value === true;
}

function setActive(loc: DimensionLocation, activate: boolean, isOminous: boolean): void {
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

/* ============================================================
   PLAYER CHECK
============================================================ */

function playerNearby(loc: DimensionLocation): [boolean, boolean] {
    const radiusSq = TRIGGER_RADIUS * TRIGGER_RADIUS;

    for (const player of loc.dimension.getPlayers()) {
        const dx = player.location.x - loc.x;
        const dy = player.location.y - loc.y;
        const dz = player.location.z - loc.z;

        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq <= radiusSq){
            const effect = player.getEffect("bad_omen");
            const effect2 = player.getEffect("trial_omen");

            if(effect || effect2){
                return [true, true];
            }
            else{
                return [true, false];
            }

        }  
    }
    return [false, false];
}

/* ============================================================
   ENEMY TAG
============================================================ */

function getSpawnerTag(loc: DimensionLocation): string {
    return `crypt_${posKey(loc)}`;
}

/* ============================================================
   Equip WAVE
============================================================ */

function equipDrowned(enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean): void {
    system.runTimeout(() => {
        const { x, y, z } = enemy.location;
        const roll = Math.random();
        let material = "";

        const multiplier = hasBadOmen ? 1.5 : 1;

        if (roll * multiplier > 0.9)       material = "iron";
        else if (roll * multiplier > 0.75) material = "chainmail";
        else if (roll * multiplier > 0.4)  material = "copper";

        if (material) {
            loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.head 0 ${material}_helmet`);
            loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.chest 0 ${material}_chestplate`);
            loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.legs 0 ${material}_leggings`);
            loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.armor.feet 0 ${material}_boots`);
        }

        if (Math.random() * multiplier > 0.7) {
            loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run replaceitem entity @n[type=drowned] slot.weapon.mainhand 0 trident`);
        }
    }, 1); // 1 tick delay to allow entity to fully initialize before equipping
}

function equipBogged(enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean): void {
    system.runTimeout(() => {
        const { x, y, z } = enemy.location;
        const roll = Math.random();
        let material = "";

        const multiplier = hasBadOmen ? 1.5 : 1;

        if (roll * multiplier > 0.9)       material = "iron";
        else if (roll * multiplier > 0.75) material = "chainmail";
        else if (roll * multiplier > 0.4)  material = "copper";

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
    }, 1); // 1 tick delay to allow entity to fully initialize before equipping
}

function equipZombie(enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean): void {
    system.runTimeout(() => {
        const { x, y, z } = enemy.location;
        const roll = Math.random();
        let material = "";

        const multiplier = hasBadOmen ? 1.5 : 1;

        if (roll * multiplier > 0.95)       material = "chainmail";
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
    }, 1); // 1 tick delay to allow entity to fully initialize before equipping
}

function equipSkeleton(enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean): void {
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
    }, 1); // 1 tick delay to allow entity to fully initialize before equipping
}

function equipHusk(enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean): void {}
function equipParched(enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean): void {}

function equipSpider(enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean): void {
    system.runTimeout(() => {
        const {x, y, z} = enemy.location;
        const roll = Math.random();
        let effect = "";

        const multiplier = hasBadOmen ? 1.5 : 1;

        if (roll * multiplier > 0.95)
            effect = "invisibility";
        if (roll * multiplier > 0.8)
            effect = "speed"
        
        if(effect){
            loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run effect @n[type=spider] ${effect} infinite 0 false`)
        }
    }, 1);  // 1 tick delay to allow spider to initialize before applying effects
}

function equipCaveSpider(enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean): void {
    system.runTimeout(() => {
        const {x, y, z} = enemy.location;
        const roll = Math.random();
        let effect = "";

        const multiplier = hasBadOmen ? 1.5 : 1;

        if (roll * multiplier > 0.95)
            effect = "invisibility";
        if (roll * multiplier > 0.8)
            effect = "speed"
        
        if(effect){
            loc.dimension.runCommand(`execute positioned ${x} ${y} ${z} run effect @n[type=cave_spider] ${effect} infinite 0 false`)
        }
    }, 1);  // 1 tick delay to allow spider to initialize before applying effects
}

//wraith needn't be equipped but we define this function anyways to allow for easy integration with recursive
//spawning function.
function equipWraith(enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean): void {};

function equipSlime(enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean): void {}
function equipStray(enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean): void {}

/* ============================================================
   Spawn WAVE
============================================================ */


function isValidSpawnPosition(loc: DimensionLocation, x: number, y: number, z: number): boolean {
    try {
        const feet = loc.getBlock({x, y, z});
        const head = loc.getBlock({x, y: y + 1, z});

        // Feet and head space must be clear
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

function spawnWave(loc: DimensionLocation, hasBadOmen: boolean): void {
    const block = loc.dimension.getBlock(loc);
    
    if (block.permutation.getState("relleks_dungeons:spawner_type") === "drowned") {
        const count = Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1));
        setPending(loc, count);
        spawnWaveRecursive(loc, Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:drowned", equipDrowned, hasBadOmen, 0);
    } 
    else if (block.permutation.getState("relleks_dungeons:spawner_type") === "bogged") {
        const count = Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1));
        setPending(loc, count);
        spawnWaveRecursive(loc, Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:bogged", equipBogged, hasBadOmen, 0);
    } 
    else if(block.permutation.getState("relleks_dungeons:spawner_type") === "zombie"){
        const count = Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1));
        setPending(loc, count);
        spawnWaveRecursive(loc, Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:zombie", equipZombie, hasBadOmen, 0);
    } 
    else if(block.permutation.getState("relleks_dungeons:spawner_type") === "skeleton"){
        const count = Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1));
        setPending(loc, count);
        spawnWaveRecursive(loc, Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:skeleton", equipSkeleton, hasBadOmen, 0);
    } 
    else if(block.permutation.getState("relleks_dungeons:spawner_type") === "husk"){
        const count = Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1));
        setPending(loc, count);
        spawnWaveRecursive(loc, Math.floor(ZOMBIE_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:husk", equipHusk, hasBadOmen, 0);
    } 
    else if(block.permutation.getState("relleks_dungeons:spawner_type") === "parched"){
        const count = Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1));
        setPending(loc, count);
        spawnWaveRecursive(loc, Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:parched", equipParched, hasBadOmen, 0);
    } 
    else if(block.permutation.getState("relleks_dungeons:spawner_type") === "spider"){
        const count = Math.floor(SPIDER_COUNT * (hasBadOmen ? 1.5 : 1));
        setPending(loc, count);
        spawnWaveRecursive(loc, Math.floor(SPIDER_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:spider", equipSpider, hasBadOmen, 0);
    } 
    else if(block.permutation.getState("relleks_dungeons:spawner_type") === "cave_spider"){
        const count = Math.floor(SILVERFISH_COUNT * (hasBadOmen ? 1.5 : 1));
        setPending(loc, count);
        spawnWaveRecursive(loc, Math.floor(SILVERFISH_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:cave_spider", equipCaveSpider, hasBadOmen, 0);
    } 
    else if(block.permutation.getState("relleks_dungeons:spawner_type") === "slime"){
        const count = Math.floor(SLIME_COUNT * (hasBadOmen ? 1.5 : 1));
        setPending(loc, count);
        spawnWaveRecursive(loc, Math.floor(SLIME_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:slime", equipSlime, hasBadOmen, 0);
    } 
    else if(block.permutation.getState("relleks_dungeons:spawner_type") === "stray"){
        const count = Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1));
        setPending(loc, count);
        spawnWaveRecursive(loc, Math.floor(SKELETON_COUNT * (hasBadOmen ? 1.5 : 1)), "minecraft:stray", equipStray, hasBadOmen, 0);
    }
    else if(block.permutation.getState("relleks_dungeons:spawner_type") === "wraith"){
        const count = Math.floor(WRAITH_COUNT * (hasBadOmen ? 1.5 : 1));
        setPending(loc, count);
        spawnWaveRecursive(loc, Math.floor(WRAITH_COUNT * (hasBadOmen ? 1.5 : 1)), "relleks_dungeons:wraith", equipWraith, hasBadOmen, 0);
    }
}

function spawnWaveRecursive(loc: DimensionLocation, count: number, type: string, equip: (enemy: Entity, loc: DimensionLocation, hasBadOmen: boolean) => void, hasBadOmen: boolean, iterations: number): void {
    if (iterations > 35 || count <= 0) {
        setPending(loc, 0); // wave fully dispatched — clear pending regardless of how many actually spawned
        return;
    }

    system.runTimeout(() => {
        const block = loc.dimension.getBlock(loc);
        if (!block || block.typeId !== SPAWNER_BLOCK_ID) {
            setPending(loc, 0); // spawner gone — clear pending so completion check can run
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
                setPending(loc, getPending(loc) - 1); // one more mob is now in the world
                break;
            } catch (e) {
                console.warn(`Spawner Error: ${e}`);
            }
        }

        spawnWaveRecursive(loc, count - 1, type, equip, hasBadOmen, iterations + 1);
    }, 40); // 2 second delay before spawning next mob
}

/* ============================================================
   REWARD
============================================================ */

function getNearbyPlayers(loc: DimensionLocation): number {
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

function giveReward(loc: DimensionLocation, players: number): void {
    system.runTimeout(() => {
        if (players > 0) {
            loc.dimension.runCommand(`loot spawn ${loc.x} ${loc.y + 1.3} ${loc.z} loot "spawners/swamp_crypt_spawners"`);
            loc.dimension.runCommand(`playsound trial_spawner.eject_item @a ${loc.x} ${loc.y} ${loc.z}`);
        }
    }, 20); // Delay next reward by 1 second 
}

/* ============================================================
   SPAWNER TICK
============================================================ */

function tickSpawner(loc: DimensionLocation): void {
    if(cleanupSpawner(loc)){
        return; // Spawner no longer exists, so stop processing
    }

    const now = system.currentTick;

    // Resync block visual state with the stored active flag on every tick.
    // This corrects any mismatch caused by the block being unloaded mid-wave.
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

/* ============================================================
   DISCOVERY SCAN
============================================================ */

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
                        const block = dim.getBlock({x, y, z,});

                        if (block?.typeId === SPAWNER_BLOCK_ID) {
                            registerSpawner({dimension:dim, x, y, z,});
                        }
                    } catch {}
                }
            }
        }
    }
}

/* ============================================================
   CLEANUP — remove spawners that no longer exist
============================================================ */

// Returns true if the spawner was cleaned up, false if it still exists
function cleanupSpawner(loc: DimensionLocation): boolean {
    const block = loc.dimension.getBlock(loc);
    const key = posKey(loc);

    if (!block) {
        // Chunk not loaded — can't verify, don't treat as broken
        return false;
    }

    if (block.typeId !== SPAWNER_BLOCK_ID) {
        activeSpawners.delete(key);
        world.setDynamicProperty(PROP_COOLDOWN + key, undefined);
        world.setDynamicProperty(PROP_ACTIVE + key, undefined);
        world.setDynamicProperty(PROP_PENDING + key, undefined);

        const tag = getSpawnerTag(loc);
        for (const entity of loc.dimension.getEntities({ tags: [tag] })) {
            try { entity.removeTag(tag); } catch {}
        }
        return true;
    }
    return false;
}

function despawnMobs(loc: DimensionLocation): void {
    const tag = getSpawnerTag(loc);
    for (const entity of loc.dimension.getEntities({ tags: [tag] })) {
        try { entity.remove(); } catch {}
    }
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
    const blockId = event.brokenBlockPermutation.type.id;
    if (blockId !== SPAWNER_BLOCK_ID){
        return;
    }

    const loc = {   // the block location
        dimension: event.dimension,
        x: event.block.x,
        y: event.block.y,
        z: event.block.z
    };

    cleanupSpawner(loc);
});

/* ============================================================
   INTERVALS
============================================================ */

system.runInterval(
    discoverSpawners,
    DISCOVERY_INTERVAL
);

system.runInterval(() => {
        for (const loc of activeSpawners.values()) {
            try {
                tickSpawner(loc);
            } catch {
                // The chunk is likely unloaded — we can't access the block to call
                // setActive(), but we CAN still write dynamic properties since those
                // are world-level and don't require the chunk to be loaded.
                // Reset state directly so the spawner recovers when the chunk reloads.
                const now = system.currentTick;
                world.setDynamicProperty(PROP_ACTIVE + posKey(loc), false);
                setCooldown(loc, now + COOLDOWN_TICKS);
                world.setDynamicProperty(PROP_PENDING + posKey(loc), 0);
            }
        }
    },
    CHECK_INTERVAL
);

/* ============================================================
   BLOCK COMPONENT
============================================================ */

export default class
DrownedspawnerActions
implements BlockCustomComponent {
    onStepOn(_event:BlockComponentStepOnEvent): void {}
}

/* ============================================================
   INIT
============================================================ */

export function initDrownedspawnerActions() {
    system.beforeEvents.startup.subscribe(event => {
        event.blockComponentRegistry.registerCustomComponent("relleks_dungeons:drownedspawner_actions", new DrownedspawnerActions());
    });
}