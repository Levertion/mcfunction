import { readdir, stat } from "fs-extra";
import { basename, extname, join } from "path";

import { ErrorKind, ErrorReporter } from "../errors";
import { Resources } from "../types/data";

import { ID } from "minecraft-id";
import { keys } from "../utils";
import { ResourceKind, resourceKinds } from "./resource_specific";

export async function getDataFolderResources(
    folder: string,
    add: <K extends keyof Resources>(
        kind: K,
        id: ID,
        value: ResourceKind<K>
    ) => void,
    reporter: ErrorReporter
): Promise<void> {
    const namespaces = await readdir(folder);
    await Promise.all(
        namespaces.map(async namespace =>
            Promise.all(
                keys(resourceKinds).map(async type => {
                    const typeFolder = join(
                        folder,
                        namespace,
                        ...resourceKinds[type].folders
                    );
                    try {
                        const result = await collectFolderResources(
                            typeFolder,
                            type,
                            reporter
                        );
                        for (const [path, value] of result) {
                            add(type, new ID(namespace, path), value);
                        }
                    } catch (e) {
                        // Folder probably doesn't exist. Not an issue
                    }
                })
            )
        )
    );
}

type ResourcesMap<K extends keyof Resources> = Map<string, ResourceKind<K>>;

async function collectFolderResources<K extends keyof Resources>(
    path: string,
    kind: K,
    reporter: ErrorReporter
): Promise<ResourcesMap<K>> {
    const results: ResourcesMap<K> = new Map();
    await runInFolder(results, kind, path, [], reporter);
    return results;
}

async function runInFolder<K extends keyof Resources>(
    map: ResourcesMap<K>,
    kind: K,
    realPath: string,
    folder: string[],
    reporter: ErrorReporter
) {
    const folders = await readdir(realPath);
    await Promise.all(
        folders.map(async item => {
            const newPath = join(realPath, item);
            const stats = await stat(newPath);
            if (stats.isDirectory()) {
                await runInFolder(
                    map,
                    kind,
                    newPath,
                    [...folder, item],
                    reporter
                );
            } else {
                const info = resourceKinds[kind];
                const ext = extname(newPath);
                if (ext === info.extension) {
                    const value = await info.loadFile(newPath, reporter);
                    if (typeof value !== undefined || info.allowUndefined) {
                        map.set(
                            [...folder, basename(newPath, ext)].join("/"),
                            (value as unknown) as ResourceKind<K>
                        );
                    }
                } else {
                    //  Give an error if the filename contains the extension but doesn't use the extension.
                    //  E.g. the common `.mcfunction.txt`
                    if (newPath.indexOf(info.extension) !== -1) {
                        reporter.addError(newPath, {
                            actual: ext,
                            expected: info.extension,
                            kind: ErrorKind.WRONG_EXTENSION
                        });
                    }
                }
            }
        })
    );
}
