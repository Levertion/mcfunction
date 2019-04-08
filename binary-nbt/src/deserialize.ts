import * as Long from "long";
import { promisify } from "util";
import * as zlib from "zlib";

import { BufferStream } from "./buffer-stream";
import {
    byte,
    byteArray,
    compound,
    double,
    float,
    int,
    intArray,
    list,
    long,
    longArray,
    NBTListSymbol,
    NBTNameSymbol,
    short,
    string,
    TagType
} from "./tags";

const unzipAsync = promisify<zlib.InputType, Buffer>(zlib.unzip);

/**
 * Deserialize an NBT value from `buffer`. This returns an object which is
 * the closest JavaScript equivalent of the input.
 * `TAG_LONG`s, which cannot be losslessly represented in a JavaScript
 * `number`, are deserialized as `Long`s from the
 * [`long`](https://www.npmjs.com/package/long) package.
 *
 * Deserialize an NBT value from `buffer`. This returns an object which is the closest JavaScript equivalent of the input.
 * `TAG_LONG`s, which cannot be losslessly represented in a JavaScript `number`, are deserialized as `Long`s from the [`long`](https://www.npmjs.com/package/long) package.
 *
 * The resulting object can be serialized into the same NBT value. This is explained fully in the `README`.
 *
 * @param buffer The buffer to deserialize the NBT from
 * @param useMaps Whether to use ES6 `Map`s for compounds. This is useful to retain insertion order
 * @param named Whether or not the root is named. For example, a typical structure is {"":<data>}. (Reasoning for this required)
 *
 * @throws If the NBT is malformed. E.g. an invalid tag type is specified or the NBT is truncated.
 */
export function deserializeNBT<T = unknown>(
    buffer: Buffer,
    useMaps: boolean = false,
    named: boolean = true
): T {
    const stream = new BufferStream(buffer);
    const id = stream.getByte();
    const name: string | undefined = named ? stream.getUTF8() : undefined;
    const result = deserializeTag(id, stream, useMaps);
    if (name) {
        Object.assign(result, { [NBTNameSymbol]: name });
    }
    return result as T;
}

/**
 * Same as `deserializeNBT`, but if `buffer` contains compressed data, it will be uncompressed automatically. If this behaviour is not required, use the synchronous `deserializeNBT` function instead.
 *
 * @param buffer The buffer to deserialize the NBT from.
 * @param useMaps to use ES6 maps for compounds. This is useful to retain insertion order
 * @param named Whether or not the root is named. For example, a typical structure is {"":<data>}.
 *
 * @throws If the NBT is malformed. E.g. an invalid tag type is specified or the NBT is truncated.
 * @throws If the compression is invalid
 */
export async function deserializeCompressedNBT<T = unknown>(
    buffer: Buffer,
    useMaps: boolean = false,
    named: boolean = true
): Promise<T> {
    return deserializeNBT<T>(await decompressIfNeeded(buffer), useMaps, named);
}

/**
 * Decompress a `Buffer` if required, returning the original Buffer otherwise
 *
 * Only exposed for tests
 */
export async function decompressIfNeeded(buffer: Buffer): Promise<Buffer> {
    try {
        return await unzipAsync(buffer);
    } catch (e) {
        return buffer;
    }
}

function deserializeTag(
    type: TagType,
    buffer: BufferStream,
    useMaps: boolean
): any {
    switch (type) {
        case TagType.TAG_BYTE:
            return byte(Number(buffer.getByte()));
        case TagType.TAG_SHORT:
            return short(Number(buffer.getShort()));
        case TagType.TAG_INT:
            return int(Number(buffer.getInt()));
        case TagType.TAG_LONG:
            return long(buffer.getLong());
        case TagType.TAG_FLOAT:
            return float(Number(buffer.getFloat()));
        case TagType.TAG_DOUBLE:
            return double(Number(buffer.getDouble()));
        case TagType.TAG_BYTE_ARRAY:
            const byteLen = buffer.getInt();
            const byteResult: number[] = byteArray([]);
            for (let _i = 0; _i < byteLen; _i++) {
                byteResult.push(
                    deserializeTag(TagType.TAG_BYTE, buffer, useMaps)
                );
            }
            return byteResult;
        case TagType.TAG_STRING:
            return string(buffer.getUTF8());
        case TagType.TAG_LIST:
            const id = buffer.getByte();
            const listLen = buffer.getInt();
            const listResult: any[] = list([]);
            Object.assign(listResult, { [NBTListSymbol]: id });
            for (let _i = 0; _i < listLen; _i++) {
                listResult.push(deserializeTag(id, buffer, useMaps));
            }
            return listResult;
        case TagType.TAG_COMPOUND:
            let kind: number = buffer.getByte();
            const result: Map<string, any> = compound(new Map());
            while (kind !== 0) {
                const name = buffer.getUTF8();
                result.set(name, deserializeTag(kind, buffer, useMaps));
                kind = buffer.getByte();
            }
            if (useMaps) {
                return result;
            } else {
                return strMapToObj(result);
            }
        case TagType.TAG_INT_ARRAY:
            const intLen = buffer.getInt();
            const intResult: number[] = intArray([]);
            for (let _i = 0; _i < intLen; _i++) {
                intResult.push(
                    deserializeTag(TagType.TAG_INT, buffer, useMaps)
                );
            }
            return intResult;

        case TagType.TAG_LONG_ARRAY:
            const longLen = buffer.getInt();
            const longResult: Long[] = longArray([]);

            for (let _i = 0; _i < longLen; _i++) {
                longResult.push(
                    deserializeTag(TagType.TAG_LONG, buffer, useMaps)
                );
            }
            return longResult;
        default:
            throw new RangeError(
                `Invalid tag type around index ${buffer.index}: ${type}`
            );
    }
}

function strMapToObj<T>(strMap: Map<string, T>): Record<string, T> {
    const obj = Object.create(null);
    for (const [k, v] of strMap) {
        obj[k] = v;
    }
    return obj;
}
