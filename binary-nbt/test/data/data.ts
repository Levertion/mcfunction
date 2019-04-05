import { readFileSync, readdir } from "fs";
import { extname, join, basename } from "path";
import { promisify } from "util";

export async function runTests(
    test: (name: string, contents: Buffer) => Promise<void>
) {
    const files = (await promisify(readdir)(__dirname)).filter(
        path => extname(path) === ".nbt"
    );
    for (const file of files) {
        const contents = readFileSync(join(__dirname, file));
        await test(basename(file, ".nbt"), contents);
    }
}
