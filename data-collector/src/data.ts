import { IDMap, IDSet, ResolvedIDMap } from "minecraft-id";
import { Level, Scoreboard } from "./nbt-data";

/**
 * An ID used to reference a Datapack.
 *
 * This is a single datapack within a world. They are
 * unique across worlds, even though if they could reused
 */
export type DataPackID = number;

/**
 * The main type produced and updated by this library. Provides all
 * of the data produced and used by Minecraft.
 */
export interface MinecraftData {
    roots: Map<RootID, Root>;
    rootPaths: Map<string, RootID>;
    datapacks: Map<DataPackID, Datapack>;
    /**
     *  The current highest `DataSourceID`. Incremented if a new datasource is added
     */
    max_source: DataPackID;
    /**
     * The current highest `RootID`. Incremented if a new root is added
     */
    max_root: RootID;

    /**
     * The resources from datapacks. This includes both local and global resources.
     */
    resources: Resources;

    /**
     * The Minecraft version of the global data
     */
    global_version: string;
    /**
     * The tree of commands
     */
    commands: RootNode;
    /**
     * The set of blocks.
     */
    blocks: Blocks;
    // This library does not need to know about NBT
    // nbt_docs: NBTDocs; // This will be included in a dependent package.
    /**
     * Data from the registries
     */
    registries: RegistryData;
}

//#region Resource data
/**
 * A Tag JSON file
 */
export interface Tag {
    replace?: boolean;
    values: string[];
}

/**
 * Information about an advancement.
 *
 * FIXME: Change to use the full structure of the file
 */
export interface Advancement {
    criteria: Set<string>;
}

/**
 * A (datapack's) pack.mcmeta file
 */
export interface McmetaFile {
    pack?: { description?: string; pack_format?: number };
}

export interface ResolvedTag {
    results: string[];
}

/**
 * A value which is defined in Vanilla and may also be defined in user code.
 *
 * FIXME: Make this a class with support for getting the set of enabled values
 */
export interface VanillaOrUser<T> {
    global: T;
    locals: Map<
        RootID,
        // If the root is not a world type root
        | T
        // If the root is not a "world" type root, so has more than one Datapack
        // FIXME: Consider unifying this and the T
        | Map<DataPackID, T>
    >;
}

type TagMap = ResolvedResourceMap<Tag, ResolvedTag>;

type ResourceSet = VanillaOrUser<IDSet>;
type ResourceMap<T> = VanillaOrUser<IDMap<T>>;
type ResolvedResourceMap<T, R> = VanillaOrUser<ResolvedIDMap<T, R>>;

/**
 * The resources which are supported.
 */
export interface Resources {
    advancements: ResourceMap<Advancement>;
    block_tags: TagMap;
    entity_tags: TagMap;
    fluid_tags: TagMap;
    functions: ResourceSet;
    function_tags: TagMap;
    item_tags: TagMap;
    loot_tables: ResourceSet;
    recipes: ResourceSet;
    structures: ResourceSet;
}

//#endregion

//#region Root data

/**
 * An ID given to a `Root`
 */
export type RootID = number;

export interface WorldData {
    datapacks: Set<DataPackID>;
    nbt: WorldNBT;
    type: "world";
}

export interface RootShared {
    id: RootID;
    path: string;
}

export type Root = RootShared &
    (
        | WorldData
        // A datapack created from a root
        | { type: "datapack" }
        // A datapack created from a functions folder.
        // This only reads function resources
        | { type: "functions" });

/**
 * Information about a datapack
 */
export interface Datapack {
    id: DataPackID;
    mcmeta?: McmetaFile;
    name: string;
    root: RootID;
}

export interface WorldNBT {
    level?: Level;
    scoreboard?: Scoreboard;
}

//#endregion

//#region Global data
export type RegistryNames =
    | "minecraft:sound_event"
    | "minecraft:fluid"
    | "minecraft:mob_effect"
    | "minecraft:block"
    | "minecraft:enchantment"
    | "minecraft:entity_type"
    | "minecraft:item"
    | "minecraft:potion"
    | "minecraft:carver"
    | "minecraft:surface_builder"
    | "minecraft:feature"
    | "minecraft:decorator"
    | "minecraft:biome"
    | "minecraft:particle_type"
    | "minecraft:biome_source_type"
    | "minecraft:block_entity_type"
    | "minecraft:chunk_generator_type"
    | "minecraft:dimension_type"
    | "minecraft:motive"
    | "minecraft:custom_stat"
    | "minecraft:chunk_status"
    | "minecraft:structure_feature"
    | "minecraft:structure_piece"
    | "minecraft:rule_test"
    | "minecraft:structure_processor"
    | "minecraft:structure_pool_element"
    | "minecraft:menu"
    | "minecraft:recipe_type"
    | "minecraft:recipe_serializer"
    | "minecraft:stat_type"
    | "minecraft:villager_type"
    | "minecraft:villager_profession";

export type RegistryData = Record<RegistryNames, IDSet>;

export type Blocks = IDMap<Map<string, Set<string>>>;

export type CommandNode = LiteralNode | ArgumentNode | RootNode;

interface CommandNodeBase {
    children?: Record<string, CommandNode>;
    executable?: boolean;
    redirect?: string[];
}

export interface LiteralNode extends CommandNodeBase {
    type: "literal";
}
export interface ArgumentNode extends CommandNodeBase {
    type: "argument";
    parser: string;
    properties?: Record<string, any>;
}
export interface RootNode {
    type: "root";
    children?: Record<string, CommandNode>;
}

//#endregion
