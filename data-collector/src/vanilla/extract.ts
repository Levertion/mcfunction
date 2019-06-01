import { readJSON } from "fs-extra";
import { ID, IDMap, IDSet } from "minecraft-id";
import { join } from "path";
import { ErrorReporter } from "../errors";
import { Resource } from "../resource";
import { getDataFolderResources } from "../resources/collect";
import { ResourceKind, resourceKinds } from "../resources/resource_specific";
import {
    MinecraftData,
    RegistryNames,
    Resources,
    Validators
} from "../types/data";
import { keys, merge, UnionToIntersection } from "../utils";

export async function getDataFromJar(
    generatedFolder: string,
    globalVersion: string,
    reporter: ErrorReporter
): Promise<MinecraftData> {
    const [values, resourceData] = await Promise.all([
        Promise.all([
            getBlocks(generatedFolder),
            getCommands(generatedFolder),
            getRegistries(generatedFolder)
        ]),
        getResources(generatedFolder)
    ]);
    const result: MinecraftData = merge(...values, {
        global_version: globalVersion,
        reporter,
        resources: ({} as any) as Resources,
        validators: ({} as any) as Validators,
        ...getDefaults()
    });
    for (const key of keys(resourceKinds)) {
        const oneTime = resourceKinds[key].onetime(
            reporter,
            // Funky type inference
            key as UnionToIntersection<keyof Resources>,
            result
        );
        const resource = new Resource(
            oneTime.resolver as any,
            resourceData[key] || new IDMap()
        );
        result.resources[key] = resource as any;
        result.validators[key] = oneTime.validator as any;
    }
    return result as MinecraftData;
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

const blankReporter: ErrorReporter = {
    addError: () => undefined,
    removeError: () => undefined
};

type VanillaResources = { [K in keyof Resources]?: IDMap<ResourceKind<K>> };
async function getResources(dataDir: string): Promise<VanillaResources> {
    const map: VanillaResources = {};
    await getDataFolderResources(
        join(dataDir, "data"),
        (kind, id, value) => {
            let inner = map[kind];
            if (!inner) {
                inner = new IDMap() as any;
                map[kind] = inner;
            }
            const innerActual = inner as IDMap<any>;
            innerActual.set(id, value);
        },
        blankReporter
    );
    return map;
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
