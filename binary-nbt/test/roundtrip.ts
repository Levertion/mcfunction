import { runTests } from "./data/data";
import { equal, strictEqual, deepStrictEqual } from "assert";
import {
    serializeNBT,
    deserializeCompressedNBT,
    decompressIfNeeded,
    deserializeNBT,
    serializeNBTDebug
} from "../src";

describe("roundtrip tests", () => {
    it("should roundtrip", async () => {
        await runTests(async (name, buffer) => {
            const uncompressed = await decompressIfNeeded(buffer);
            deepStrictEqual(
                serializeNBTDebug(
                    deserializeNBT(uncompressed, true),
                    uncompressed
                ),
                uncompressed,
                `Roundtrip failed for ${name}`
            );
        });
    });
});
