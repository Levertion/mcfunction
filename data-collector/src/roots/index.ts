import { getDataFolderResources } from "../resources/collect";
import { getDataFolder } from "../resources/resource_specific";
import { DataPackID, MinecraftData, RootID } from "../types/data";
import { findRootPath } from "./path";

export async function addRootFor(
    filePath: string,
    data: MinecraftData
): Promise<RootID | undefined> {
    const root = findRootPath(filePath);
    if (root) {
        if (data.rootPaths.has(root.path)) {
            return data.rootPaths.get(root.path);
        }
        const { type, path } = root;
        const id = data.max_root;
        data.max_root++;
        data.rootPaths.set(root.path, id);
        switch (type) {
            case "datapack":
                data.roots.set(id, { path, id, type });
                addDataForDatapack(id);
                break;
            case "functions":
                data.roots.set(id, { path, id, type });
                break;
            case "world":
                data.roots.set(id, {
                    datapacks: new Set(),
                    id,
                    nbt: {},
                    path,
                    type
                });
                break;
            default:
                break;
        }

        // Actually collect the root data
        return id;
    }
    return undefined;
}

async function addDataForDatapack(
    root: RootID,
    pack: DataPackID,
    data: MinecraftData
) {
    const dataFolder = getDataFolder(data, pack);
    await getDataFolderResources(
        dataFolder,
        (kind, id, value) =>
            data.resources[kind].set(id, root, value as any, pack),
        data.reporter
    );
}
