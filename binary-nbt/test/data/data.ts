import { readdir, readFileSync } from "fs";
import { basename, extname, join } from "path";
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
