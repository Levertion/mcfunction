import fetch from "node-fetch";
import { DataCollectionOptions } from ".";

export function getVersionToUse(
    options: DataCollectionOptions,
    manifest: GlobalManifest
): string {
    if (options.version) {
        return options.version;
    }
    if (options.snapshots) {
        return manifest.latest.snapshot;
    }
    return manifest.latest.release;
}

function findVersion(version: string, manifest: GlobalManifest): VersionInfo {
    const result = manifest.versions.find(verInfo => verInfo.id === version);
    if (result) {
        return result;
    }
    // FIXME: Use a better error type
    throw new Error(`Version ${version} not found in Minecraft manifest.
This is probably because the version was set to an invalid value`);
}

export async function getVersionManifest(
    version: string,
    manifest: GlobalManifest
): Promise<SingleVersionInformation> {
    const versionInfo = findVersion(version, manifest);
    return fetch(versionInfo.url).then(response => response.json());
}

export interface SingleVersionInformation {
    downloads: {
        server: {
            sha1: string;
            size: number;
            url: string;
        };
    };
}

export async function getGlobalManifest(): Promise<GlobalManifest> {
    return fetch(
        "https://launchermeta.mojang.com/mc/game/version_manifest.json"
    ).then(r => r.json());
}

export interface VersionInfo {
    id: string;
    releaseTime: string;
    time: string;
    type: "snapshot" | "release";
    url: string;
}

export interface GlobalManifest {
    latest: {
        release: string;
        snapshot: string;
    };
    versions: VersionInfo[];
}
