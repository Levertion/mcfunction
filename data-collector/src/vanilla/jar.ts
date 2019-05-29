import { strictEqual } from "assert";
import { execFile } from "child_process";
import { createHash } from "crypto";
import { createWriteStream } from "fs";
import { mkdtemp } from "fs-extra";
import fetch from "node-fetch";
import { join } from "path";
import { promisify } from "util";
import { DataCollectionOptions } from ".";
import { SingleVersionInformation } from "./manifest";

/**
 * Create a temporary folder, and download the minecraft server from
 *
 * Download the minecraft server jar into a temporary folder,
 * into the file `server.jar` within that folder.
 */
export async function downloadJarIntoTemp(
    info: SingleVersionInformation
): Promise<string> {
    // TODO: Verify that this is optimally consecutive
    const [dir, body] = await Promise.all([
        mkdtemp("minecraft-data"),
        fetch(info.downloads.server.url).then(response => response.body)
    ]);

    const written = createWriteStream(join(dir, "server.jar"));
    const hash = createHash("sha1");
    body.pipe(written);
    body.pipe(hash);
    // TODO: Switch to require("stream").pipeline (added in node 10) once we only support
    await new Promise((resolve, reject) => {
        body.on("end", () => resolve());
        // This doesn't handle all errors, but using pipeline would avoid that anyway.
        written.on("error", reject);
    });
    strictEqual(written.bytesWritten, info.downloads.server.size);
    strictEqual(hash.digest("hex"), info.downloads.server.sha1);
    return dir;
}

const execFileAsync = promisify(execFile);

export async function runGenerator(
    tempdir: string,
    options: DataCollectionOptions
): Promise<string> {
    const resultFolder = join(tempdir, "generated");
    const jarPath = join(tempdir, "server.jar");
    const javaPath = options.javaPath || "java";
    await execFileAsync(
        javaPath,
        [
            "-cp",
            jarPath,
            "net.minecraft.data.Main",
            "--output",
            resultFolder,
            "--all"
        ],
        {
            // To make sure that the logs go into the right place
            cwd: tempdir
        }
    );
    return resultFolder;
}
