import { ErrorReporter } from "../errors";
import { MinecraftData } from "../types/data";
import { getDataFromJar } from "./extract";
import { downloadJarIntoTemp, runGenerator } from "./jar";
import {
    getGlobalManifest,
    getVersionManifest,
    getVersionToUse
} from "./manifest";

export interface DataCollectionOptions {
    cacheDir?: string;
    version?: string;
    javaPath?: string;
    snapshots?: boolean;
}

/**
 * Steps:
 * - Check versions manifest. Compare with current if available ✓
 * - Download and extract from the jar:
 * - Run the exposed data generator. ✓
 * - Collect the data exposed
 * - Cache that data
 * - Return the data
 */
export async function downloadVanillaData(
    reporter: ErrorReporter,
    options: DataCollectionOptions = {},
    current?: MinecraftData
): Promise<MinecraftData> {
    const manifest = await getGlobalManifest();
    const versionToUse = getVersionToUse(options, manifest);
    if (current && current.global_version === versionToUse) {
        return current;
    }
    const version = await getVersionManifest(versionToUse, manifest);
    const tempFolder = await downloadJarIntoTemp(version);
    const result = await runGenerator(tempFolder, options);
    return getDataFromJar(result, versionToUse, reporter);
}

/**
 * Steps:
 * - Load caches if available. First from local cache (only created if different
 *   version than npm cache), then from npm cache.
 * - Call downloadVanillaData otherwise
 */
export async function getVanillaData(
    reporter: ErrorReporter,
    options?: DataCollectionOptions
): Promise<MinecraftData> {
    // TODO
    return downloadVanillaData(reporter, options);
}
