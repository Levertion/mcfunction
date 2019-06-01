import { readJSON } from "fs-extra";
import { ID } from "minecraft-id";
import { join } from "path";
import { ErrorKind, ErrorReporter } from "../errors";
import { Resolver, Resource } from "../resource";
import {
    DataPackID,
    MaybeTagRef,
    MinecraftData,
    ResolvedTag,
    Resources,
    RootID,
    Tag,
    Validator
} from "../types/data";

/**
 * A Tag JSON file
 */
interface TagJSON {
    replace?: boolean;
    values: string[];
}

/**
 * Contains the code which is specific to the different resources.
 *
 * This handles the three stages of collection and error reporting:
 *  - Converting a file into the correct `T` for the `Resource<T, R>`.
 *    - E.g. reading a tag file, converting it into the references
 *      and the actual values. Checking that it has the right format
 *      (e.g. using a JSON schema)
 *  - Getting the `Resolver<T, R>`.
 *    - This can also have some validation, e.g. a tag file will
 *      confirm that the tags are valid on each resolution (because
 *      that can change)
 *  - Validating the values which doesn't depend on the `Resolver`.
 *    - E.g. testing that the blocks/items are valid in a tag.
 *      This only needs to be checked once.
 */
interface ResourceInfoInner<K extends keyof Resources, T, R> {
    onetime: (
        reporter: ErrorReporter,
        kind: K,
        fulldata: MinecraftData
    ) => {
        resolver: Resolver<T, R>;
        /**
         * At this point the file path has been lost, so will need to be reconstructed if required
         */
        validator?: Validator<T>;
    };
    loadFile: (path: string, reporter: ErrorReporter) => Promise<T | undefined>;
    allowUndefined?: boolean;
    folders: string[];
    extension: string;
}

type ResourceKeyInfo<K extends keyof Resources> = Resources[K] extends Resource<
    infer T,
    infer R
>
    ? ResourceInfoInner<K, T, R>
    : never;

type ResourceInfo = { [K in keyof Resources]: ResourceKeyInfo<K> };

export type ResourceKind<
    K extends keyof Resources
> = Resources[K] extends Resource<infer T, any> ? T : never;

interface AdvancementFile {
    criteria: Record<string, unknown>;
}

async function readJSONWithErrorReporting(
    reporter: ErrorReporter,
    path: string
) {
    try {
        return await readJSON(path);
    } catch (error) {
        if (error instanceof SyntaxError) {
            reporter.addError(path, {
                kind: ErrorKind.INVALID_JSON,
                message: error.message
            });
        }
        return undefined;
    }
}

function createSimpleInfo(
    extension: string,
    folders: string[]
): ResourceInfoInner<any, undefined, undefined> {
    return {
        allowUndefined: true,
        extension,
        folders,
        loadFile: async () => undefined,
        onetime: () => ({
            resolver: () => undefined
        })
    };
}

function createTagInfo(
    folder: string,
    isValid: (value: ID, data: MinecraftData, root: RootID) => boolean,
    validateLocally: boolean = false
): ResourceInfoInner<any, Tag, ResolvedTag> {
    return {
        extension: ".json",
        folders: ["tags", folder],
        loadFile: async (path, reporter) => {
            const value: TagJSON | undefined = await readJSONWithErrorReporting(
                reporter,
                path
            );
            if (value !== undefined) {
                return toTagData(value, reporter, path);
            }
            return undefined;
        },
        onetime: (reporter, resourceKind, data) => ({
            resolver: (values, id, root, tags) => {
                const result: ResolvedTag = { results: [] };
                for (const [value, pack] of values) {
                    const loops: ID[] = [];
                    const invalidReferences: ID[] = [];
                    const invalidMembers: ID[] = [];
                    for (const tagOrBlock of value.values) {
                        if (tagOrBlock.tag) {
                            const inner = tags.getCycle(tagOrBlock.id, root);
                            if (inner) {
                                let isLooping = false;
                                if (inner.resolved) {
                                    result.results.push(
                                        ...inner.resolved.results
                                    );
                                    if (
                                        inner.resolved.loopRoots &&
                                        inner.resolved.loopRoots.length > 0
                                    ) {
                                        result.loopRoots =
                                            result.loopRoots || [];
                                        result.loopRoots.push(
                                            ...inner.resolved.loopRoots
                                        );
                                        delete inner.resolved.loopRoots;
                                        isLooping = true;
                                    }
                                }
                                if (inner.isResolving) {
                                    isLooping = true;
                                    result.loopRoots = result.loopRoots || [];
                                    result.loopRoots.push(tagOrBlock.id);
                                }
                                if (isLooping && pack) {
                                    loops.push(tagOrBlock.id);
                                }
                            } else if (pack) {
                                invalidReferences.push(tagOrBlock.id);
                            }
                        } else {
                            result.results.push(tagOrBlock.id);
                            if (
                                validateLocally &&
                                root &&
                                !isValid(tagOrBlock.id, data, root)
                            ) {
                                invalidMembers.push(tagOrBlock.id);
                            }
                        }
                    }
                    if (pack) {
                        let path: string | undefined;
                        [
                            [
                                ErrorKind.INVALID_TAG_DEPENDENCY,
                                invalidReferences
                            ] as const,
                            [
                                ErrorKind.INVALID_TAG_MEMBERS,
                                invalidMembers
                            ] as const,
                            [ErrorKind.LOOPING_TAG, loops] as const
                        ].forEach(([kind, ids]) => {
                            if (ids.length > 0) {
                                path =
                                    path ||
                                    getPath(resourceKind, id, data, pack);
                                reporter.addError(path, {
                                    ids,
                                    kind,
                                    resource: resourceKind
                                });
                            }
                        });
                    }
                    if (value.replace) {
                        break;
                    }
                }
                result.loopRoots =
                    result.loopRoots &&
                    result.loopRoots.filter(filterKey => !filterKey.equals(id));
                if (result.loopRoots && result.loopRoots.length === 0) {
                    delete result.loopRoots;
                }
                return result;
            },
            validator: (value, id, pack) => {
                if (!validateLocally) {
                    const ids: ID[] = [];
                    for (const v of value.values) {
                        if (!v.tag && !isValid(v.id, data, pack)) {
                            ids.push(v.id);
                        }
                    }
                    if (ids.length > 0) {
                        reporter.addError(
                            getPath(resourceKind, id, data, pack),
                            {
                                ids,
                                kind: ErrorKind.INVALID_TAG_MEMBERS,
                                resource: resourceKind
                            }
                        );
                    }
                }
            }
        })
    };
}

function toTagData(tag: TagJSON, _reporter: ErrorReporter, _file: string): Tag {
    // TODO: Use a JSON schema validator here
    const result: Tag = { replace: !!tag.replace, values: [] };
    if (tag.values && Array.isArray(tag.values)) {
        for (const value of tag.values) {
            if (typeof value === "string") {
                result.values.push(asTagValue(value));
            }
        }
    }
    return result;
}

function asTagValue(value: string): MaybeTagRef {
    if (value.startsWith("#")) {
        return { tag: true, id: new ID(value.slice(1)) };
    } else {
        return { id: new ID(value) };
    }
}

function createSimpleJSONInfo(
    ...folders: string[]
): ResourceInfoInner<any, undefined, undefined> {
    return {
        allowUndefined: true,
        extension: ".json",
        folders,
        loadFile: async (path, reporter) => {
            await readJSONWithErrorReporting(reporter, path);
            return undefined;
        },
        onetime: _ => ({
            resolver: () => undefined
        })
    };
}

export const resourceKinds: ResourceInfo = {
    advancements: {
        extension: ".json",
        folders: ["advancements"],
        loadFile: async (path, reporter) => {
            const file: AdvancementFile = await readJSONWithErrorReporting(
                reporter,
                path
            );
            // TODO: JSON schema validation
            return { criteria: new Set(Object.keys(file.criteria)) };
        },
        onetime: _ => ({
            resolver: () => undefined
        })
    },
    block_tags: createTagInfo("blocks", (id, data) => data.blocks.has(id)),
    entity_tags: createTagInfo("entities", (id, data) =>
        data.registries["minecraft:entity_type"].has(id)
    ),
    fluid_tags: createTagInfo("fluids", (id, data) =>
        data.registries["minecraft:fluid"].has(id)
    ),
    function_tags: createTagInfo("functions", (id, data, root) =>
        data.resources.functions.has(id, root)
    ),
    functions: createSimpleInfo(".mcfunction", ["functions"]),
    item_tags: createTagInfo("items", (id, data) =>
        data.registries["minecraft:item"].has(id)
    ),
    loot_tables: createSimpleJSONInfo("loot_tables"),
    recipes: createSimpleJSONInfo("recipes"),
    structures: createSimpleInfo(".nbt", ["structures"])
};

export function getPath(
    kind: keyof Resources,
    id: ID,
    data: MinecraftData,
    packid: DataPackID
): string {
    const dataFolder = getDataFolder(data, packid);
    const { folders, extension } = resourceKinds[kind];
    return join(
        dataFolder,
        id.logicalNamespace(),
        ...folders,
        id.path + "." + extension
    );
}

export function getDataFolder(data: MinecraftData, packid: DataPackID): string {
    const pack = data.datapacks.get(packid);
    if (pack) {
        const root = data.roots.get(pack.root);
        if (root) {
            switch (root.type) {
                case "datapack":
                    return join(root.path, "data");
                case "functions":
                    return join(root.path, "..");
                case "world":
                    return join(root.path, "datapacks", pack.name, "data");
            }
        }
    }
    throw new Error("Invalid datapackID passed to getDataFolder");
}
