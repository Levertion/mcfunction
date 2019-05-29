import { readJSON } from "fs-extra";
import { ID, IDMap, IDSet } from "minecraft-id";
import { join } from "path";
import { MinecraftData, RegistryNames } from "../types/data";
import { merge } from "../utils";

export const keys = Object.keys as <T>(o: T) => Array<Extract<keyof T, string>>;

export async function getDataFromJar(
    generatedFolder: string,
    globalVersion: string
): Promise<MinecraftData> {
    const values = await Promise.all([
        getBlocks(generatedFolder),
        getCommands(generatedFolder),
        getRegistries(generatedFolder),
        getResources(generatedFolder)
    ]);
    const result: MinecraftData = merge(...values, {
        global_version: globalVersion,
        ...getDefaults()
    });
    return result;
}

async function getRegistries(
    dataDir: string
): Promise<Pick<MinecraftData, "registries">> {
    interface ProtocolID {
        protocol_id: number;
    }

    interface Registries extends Record<RegistryNames, Registry> {}
    interface Registry<T = {}> extends ProtocolID {
        entries: {
            [key: string]: T & ProtocolID;
        };
    }

    const registriesData: Registries = await readJSON(
        join(dataDir, "reports", "registries.json")
    );
    const registries: MinecraftData["registries"] = {} as any;
    for (const key of keys(registriesData)) {
        const registry = registriesData[key];
        if (registry.entries) {
            const set = new IDSet();
            for (const entry of Object.keys(registry.entries)) {
                set.add(new ID(entry));
            }
            registries[key] = set;
        }
    }
    return { registries };
}

async function getResources(
    dataDir: string
): Promise<Pick<MinecraftData, "resources">> {
    return { resources: {} };
}

// TODO: Expose this for caches too
function getDefaults() {
    return {
        datapacks: new Map(),
        max_pack: 0,
        max_root: 0,
        rootPaths: new Map(),
        roots: new Map()
    };
}

async function getBlocks(
    generatedFolder: string
): Promise<Pick<MinecraftData, "blocks">> {
    interface BlocksJson {
        [id: string]: {
            properties?: {
                [id: string]: string[];
            };
        };
    }
    const blocksData: BlocksJson = await readJSON(
        join(generatedFolder, "reports", "blocks.json")
    );
    const blocks: MinecraftData["blocks"] = new IDMap();
    for (const blockName of Object.keys(blocksData)) {
        const elem = blocksData[blockName];
        const blockResult = new Map();
        if (elem.properties) {
            for (const prop of Object.keys(elem.properties)) {
                blockResult.set(prop, new Set(elem.properties[prop]));
            }
        }

        blocks.set(new ID(blockName), blockResult);
    }
    return { blocks };
}

async function getCommands(
    dataDir: string
): Promise<Pick<MinecraftData, "commands">> {
    return {
        commands: await readJSON(join(dataDir, "reports", "commands.json"))
    };
}
