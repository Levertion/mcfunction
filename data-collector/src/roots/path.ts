import * as path from "path";
import { Root } from "../types/data";

const types: Array<[Root["type"], string]> = [
    ["world", "datapacks"],
    ["datapack", "data"],
    ["functions", "functions"]
];

export function findRootPath(
    fileLocation: string
): Pick<Root, Exclude<keyof Root, "id">> | undefined {
    const parsed = path.parse(path.normalize(fileLocation));
    const dirs = parsed.dir.split(path.sep);
    for (const [type, folder] of types) {
        const folderIndex = dirs.findIndex(v => v.toLowerCase() === folder);
        if (folderIndex !== -1) {
            return {
                path: path.format({
                    dir: path.join(...dirs.slice(0, folderIndex)),
                    root: parsed.root
                }),
                type
            };
        }
    }
    return undefined;
}
