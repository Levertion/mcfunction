import { runTests } from "./data/data";
import { equal, strictEqual, deepStrictEqual } from "assert";
import {
    serializeNBT,
    deserializeCompressedNBT,
    decompressIfNeeded
} from "../src";

describe("roundtrip tests", () => {
    it("should roundtrip", async () => {
        await runTests(async (name, buffer) => {
            deepStrictEqual(
                serializeNBT(await deserializeCompressedNBT(buffer)),
                await decompressIfNeeded(buffer),
                `Roundtrip failed for ${name}`
            );
        });
    });
});
