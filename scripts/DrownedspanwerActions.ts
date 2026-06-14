import {
    world,
    system,
    BlockCustomComponent,
    BlockComponentStepOnEvent,
    DimensionLocation,
    ItemStack,
} from "@minecraft/server";

/* ============================================================
   CONFIG
============================================================ */

const SPAWNER_BLOCK_ID =
    "relleks_dungeons:drowned_spawner";

const TRIGGER_RADIUS = 8;

const ZOMBIE_COUNT = 5;

const COOLDOWN_TICKS = 36000; //36000 = 30 minutes

const CHECK_INTERVAL = 60;

const DISCOVERY_INTERVAL = 200;

const DISCOVERY_RADIUS = 16;

const DISCOVERY_HEIGHT = 8;

/* ============================================================
   DYNAMIC PROPERTY KEYS
============================================================ */

const PROP_COOLDOWN =
    "relleks_dungeons:cooldown_";

const PROP_ACTIVE =
    "relleks_dungeons:active_";

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

function setActive(loc: DimensionLocation, value: boolean): void {
    world.setDynamicProperty(PROP_ACTIVE + posKey(loc), value);

    // Retrieve the Block object from the dimension, then update its state
    const block = loc.dimension.getBlock(loc);
    if (block) {
        block.setPermutation(block.permutation.withState("relleks_dungeons:is_lit", value));
    }
}

/* ============================================================
   PLAYER CHECK
============================================================ */

function playerNearby(loc: DimensionLocation): boolean {
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

/* ============================================================
   ENEMY TAG
============================================================ */

function getSpawnerTag(loc: DimensionLocation): string {
    return `crypt_${posKey(loc)}`;
}

/* ============================================================
   SPAWN WAVE
============================================================ */

function spawnWave(loc: DimensionLocation): void {
    const tag = getSpawnerTag(loc);

    let spawned = 0;

    for (let i = 0; i < ZOMBIE_COUNT; i++) {
        try {
            
            const drowned = loc.dimension.spawnEntity("minecraft:drowned",
                    {
                        x: loc.x +(Math.random() * 4 - 2),
                        y: loc.y + 1,
                        z: loc.z + (Math.random() * 4 - 2),
                    }
                );

            drowned.addTag(tag);
            spawned++;

        } catch {}
    }

    if (spawned > 0) {
        setActive(loc, true);
    }
}

/* ============================================================
   REWARD
============================================================ */

function giveReward(loc: DimensionLocation): void {
    try{
        loc.dimension.runCommand(`loot spawn ${loc.x} ${loc.y + 1.1} ${loc.z} loot "chests/swamp_crypt_pots"`);
    } catch (e) {

        console.warn(
            `Reward command failed: ${e}`
        );}
}

/* ============================================================
   SPAWNER TICK
============================================================ */

function tickSpawner(loc: DimensionLocation): void {
    const now = system.currentTick;

    // Resync block visual state with the stored active flag on every tick.
    // This corrects any mismatch caused by the block being unloaded mid-wave.
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
        const remaining = loc.dimension.getEntities({ tags: [tag]});

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

export function
initDrownedspawnerActions() {

    system.beforeEvents
        .startup
        .subscribe(
            event => {

                event
                    .blockComponentRegistry
                    .registerCustomComponent(
                        "relleks_dungeons:drownedspawner_actions",
                        new DrownedspawnerActions()
                    );
            }
        );
}
