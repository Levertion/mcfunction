import { MinecraftData, RootID } from "../types/data";
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
