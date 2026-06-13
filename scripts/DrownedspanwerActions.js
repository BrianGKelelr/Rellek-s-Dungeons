import { world, system, ItemStack, } from "@minecraft/server";
/* ============================================================
   CONFIG
============================================================ */
const SPAWNER_BLOCK_ID = "relleks_dungeons:drowned_spawner";
const TRIGGER_RADIUS = 8;
const ZOMBIE_COUNT = 5;
const COOLDOWN_TICKS = 36000;
const CHECK_INTERVAL = 60;
const DISCOVERY_INTERVAL = 200;
const DISCOVERY_RADIUS = 16;
const DISCOVERY_HEIGHT = 8;
/* ============================================================
   DYNAMIC PROPERTY KEYS
============================================================ */
const PROP_COOLDOWN = "relleks_dungeons:cooldown_";
const PROP_ACTIVE = "relleks_dungeons:active_";
/* ============================================================
   ACTIVE SPAWNERS
============================================================ */
const activeSpawners = new Map();
function posKey(loc) {
    return `${loc.dimension.id}_${loc.x}_${loc.y}_${loc.z}`;
}
function registerSpawner(loc) {
    const key = posKey(loc);
    if (activeSpawners.has(key))
        return;
    activeSpawners.set(key, loc);
}
/* ============================================================
   STATE
============================================================ */
function getCooldown(loc) {
    const value = world.getDynamicProperty(PROP_COOLDOWN + posKey(loc));
    return typeof value === "number"
        ? value
        : 0;
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
}
/* ============================================================
   PLAYER CHECK
============================================================ */
function playerNearby(loc) {
    const radiusSq = TRIGGER_RADIUS * TRIGGER_RADIUS;
    for (const player of loc.dimension.getPlayers()) {
        const dx = player.location.x - loc.x;
        const dy = player.location.y - loc.y;
        const dz = player.location.z - loc.z;
        const distSq = dx * dx +
            dy * dy +
            dz * dz;
        if (distSq <= radiusSq)
            return true;
    }
    return false;
}
/* ============================================================
   ENEMY TAG
============================================================ */
function getSpawnerTag(loc) {
    return `crypt_${posKey(loc)}`;
}
/* ============================================================
   SPAWN WAVE
============================================================ */
function spawnWave(loc) {
    const tag = getSpawnerTag(loc);
    let spawned = 0;
    for (let i = 0; i < ZOMBIE_COUNT; i++) {
        try {
            const drowned = loc.dimension.spawnEntity("minecraft:drowned", {
                x: loc.x +
                    (Math.random() * 4 - 2),
                y: loc.y + 1,
                z: loc.z +
                    (Math.random() * 4 - 2),
            });
            drowned.addTag(tag);
            spawned++;
        }
        catch { }
    }
    if (spawned > 0) {
        setActive(loc, true);
    }
}
/* ============================================================
   REWARD
============================================================ */
function giveReward(loc) {
    loc.dimension.spawnItem(new ItemStack("minecraft:emerald", 3), {
        x: loc.x + 0.5,
        y: loc.y + 1,
        z: loc.z + 0.5,
    });
    loc.dimension.spawnItem(new ItemStack("minecraft:golden_apple", 1), {
        x: loc.x + 0.5,
        y: loc.y + 1,
        z: loc.z + 0.5,
    });
}
/* ============================================================
   SPAWNER TICK
============================================================ */
function tickSpawner(loc) {
    const now = system.currentTick;
    const cooldown = getCooldown(loc);
    if (cooldown > now)
        return;
    const tag = getSpawnerTag(loc);
    if (isActive(loc)) {
        const remaining = loc.dimension.getEntities({
            tags: [tag]
        });
        if (remaining.length === 0) {
            giveReward(loc);
            setActive(loc, false);
            setCooldown(loc, now +
                COOLDOWN_TICKS);
        }
        return;
    }
    if (playerNearby(loc)) {
        spawnWave(loc);
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
        for (let x = px -
            DISCOVERY_RADIUS; x <=
            px +
                DISCOVERY_RADIUS; x++) {
            for (let z = pz -
                DISCOVERY_RADIUS; z <=
                pz +
                    DISCOVERY_RADIUS; z++) {
                for (let y = py -
                    DISCOVERY_HEIGHT; y <=
                    py +
                        DISCOVERY_HEIGHT; y++) {
                    try {
                        const block = dim.getBlock({
                            x,
                            y,
                            z,
                        });
                        if (block?.typeId ===
                            SPAWNER_BLOCK_ID) {
                            registerSpawner({
                                dimension: dim,
                                x,
                                y,
                                z,
                            });
                        }
                    }
                    catch { }
                }
            }
        }
    }
}
/* ============================================================
   INTERVALS
============================================================ */
system.runInterval(discoverSpawners, DISCOVERY_INTERVAL);
system.runInterval(() => {
    for (const loc of activeSpawners.values()) {
        try {
            tickSpawner(loc);
        }
        catch (e) {
            console.warn(String(e));
        }
    }
}, CHECK_INTERVAL);
/* ============================================================
   BLOCK COMPONENT
============================================================ */
export default class DrownedspawnerActions {
    onStepOn(_event) {
        // no-op
    }
}
/* ============================================================
   INIT
============================================================ */
export function initDrownedspawnerActions() {
    system.beforeEvents
        .startup
        .subscribe(event => {
        event
            .blockComponentRegistry
            .registerCustomComponent("relleks_dungeons:drownedspawner_actions", new DrownedspawnerActions());
    });
}
