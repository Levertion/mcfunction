import { AssertionError, deepStrictEqual, strictEqual } from "assert";
import * as Long from "long";
import {
    decompressIfNeeded,
    deserializeNBT,
    NBTNameSymbol,
    serializeNBT,
    serializeNBTDebug
} from "../src";

describe("serialization of nbt value", () => {
    it("should serialise values with sensible defaults", () => {
        const noTypes: any = {
            double: 10,
            long: new Long(100, 100),
            [NBTNameSymbol]: "Root"
        };
        const expected = Buffer.from([
            10, // `TAG_COMPOUND`
            0, // Length of "Root"
            4,
            82, // "R"
            111, // "o"
            111, // "o"
            116, // "t"
            6, // `TAG_DOUBLE`
            0, // Length of "double"
            6,
            100, // "d"
            111, // "o"
            117, //  "u"
            98, // "b"
            108, // "l"
            101, // "e"
            0x40, // Double for 10, according to:
            0x24, // const buf = Buffer.allocUnsafe(8);
            0x0, // buf.writeDoubleBE(10, 0);
            0x0, // console.log(buf);
            0x0,
            0x0,
            0x0,
            0x0,
            4, // `TAG_LONG`
            0, // Length of "long",
            4,
            108, // "l"
            111, // "o"
            110, // "n"
            103, // "g",
            0, // Long value
            0,
            0,
            100,
            0,
            0,
            0,
            100,
            0 // End of the compound
        ]);
        const result = serializeNBTDebug(noTypes, expected);
        deepStrictEqual(result, expected);
    });
});
