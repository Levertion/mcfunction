import { deepStrictEqual } from "assert";
import { decompressIfNeeded, deserializeNBT, serializeNBTDebug } from "../src";
import { runTests } from "./data/data";

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
