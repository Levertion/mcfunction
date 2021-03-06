#!/usr/bin/env node

import * as cac from "cac";
import { readdir, readFile, stat, writeFile } from "fs";
import {
    dirname,
    format,
    FormatInputPathObject,
    join,
    parse,
    relative
} from "path";

import * as mkdirp from "mkdirp";
import { promisify } from "util";
import { deserializeCompressedNBT } from "./deserialize";

interface Options {
    out?: string;
    extension: string;
}

const cli = cac("binary-nbt");

cli.command(
    "[...files]",
    `Convert files from NBT into JSON, outputting them to stdout. 
If a directory is passed, it is recursively walked for files`
)
    .option(
        "-o, --out [dir]",
        "Place the resulting files into this directory instead"
    )
    .option("-e, --extension [ext]", "Extension to output the JSON files in", {
        default: ".json"
    })
    .example("binary-nbt some_dir file.nbt file.nbt.gz --output .")
    .example("binary-nbt some_dir -o result")
    .action(run);

const readAsync = promisify(readFile);
const writeAsync = promisify(writeFile);
const statAsync = promisify(stat);
const childrenAsync = promisify(readdir);
const mkdirpAsync = promisify(mkdirp);

async function run(files: string[], options: Options) {
    await Promise.all(
        files.map(file => {
            runOn(join(process.cwd(), file), options, files);
        })
    );
}

async function runOn(
    file: string,
    options: Options,
    files: string[]
): Promise<void> {
    if ((await statAsync(file)).isDirectory()) {
        await Promise.all(
            (await childrenAsync(file)).map(child =>
                runOn(join(file, child), options, files)
            )
        );
    } else {
        try {
            const contents = await readAsync(file);
            const value = await deserializeCompressedNBT(contents);
            const string = JSON.stringify(value);
            if (options.out) {
                const parsed: FormatInputPathObject = parse(file);

                if (options.extension !== "") {
                    parsed.ext = options.extension;
                    parsed.base = undefined;
                }
                const path = join(
                    process.cwd(),
                    options.out,
                    relative(
                        files.length === 1
                            ? join(process.cwd(), files[0])
                            : process.cwd(),
                        format(parsed)
                    )
                );
                await mkdirpAsync(dirname(path));
                await writeAsync(path, string, { flag: "wx" }); // Do not overwrite an existing file
            } else {
                process.stdout.write(`${file}:\n${string}\n`);
            }
        } catch (error) {
            process.stdout.write(
                `Couldn't parse ${file} as NBT: ${error}. Skipping\n`
            );
            return;
        }
    }
}

cli.help();
cli.parse();
