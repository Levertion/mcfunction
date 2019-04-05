import { promisify } from "util";
import * as zlib from "zlib";
import * as Long from "long";

import { BufferStream } from "./buffer-stream";
import { TagType, NBTNameSymbol, NBTListSymbol, createNBTType } from "./tags";

const unzipAsync = promisify<zlib.InputType, Buffer>(zlib.unzip);

/**
 * Deserialize an NBT value from `buffer`. This returns an object which is the closest JavaScript equivalent of the input.
 * `TAG_LONG`s, which cannot be losslessly represented in a JavaScript `number`, are deserialized as `Long`s from the [`long`](https://www.npmjs.com/package/long) package.
 *
 * The resulting object can be serialized into the same NBT value. This is explained fully in the README.
 *
 * @param buffer The buffer to deserialize the NBT from
 * @param useMaps to use ES6 maps for compounds. This is useful to retain insertion order
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
    if (stream) {
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
    let unzipbuf;
    try {
        unzipbuf = await unzipAsync(buffer);
    } catch (e) {
        unzipbuf = buffer;
    }
    return deserializeNBT<T>(unzipbuf, useMaps, named);
}

function deserializeTag(
    type: TagType,
    buffer: BufferStream,
    useMaps: boolean
): any {
    switch (type) {
        case TagType.TAG_BYTE:
            return createNBTType(
                new Number(buffer.getByte()),
                TagType.TAG_BYTE
            );
        case TagType.TAG_SHORT:
            return createNBTType(
                new Number(buffer.getShort()),
                TagType.TAG_SHORT
            );
        case TagType.TAG_INT:
            return createNBTType(new Number(buffer.getInt()), TagType.TAG_INT);
        case TagType.TAG_LONG:
            return createNBTType(buffer.getLong(), TagType.TAG_LONG);
        case TagType.TAG_FLOAT:
            return createNBTType(
                new Number(buffer.getFloat()),
                TagType.TAG_FLOAT
            );
        case TagType.TAG_DOUBLE:
            return createNBTType(
                new Number(buffer.getDouble()),
                TagType.TAG_DOUBLE
            );
        case TagType.TAG_BYTE_ARRAY:
            const byte_len = buffer.getInt();
            const byte_result: number[] = createNBTType(
                [],
                TagType.TAG_BYTE_ARRAY
            );

            for (let _i = 0; _i < byte_len; _i++) {
                byte_result.push(
                    deserializeTag(TagType.TAG_BYTE, buffer, useMaps)
                );
            }
            return byte_result;
        case TagType.TAG_STRING:
            return createNBTType(buffer.getUTF8(), TagType.TAG_STRING);
        case TagType.TAG_LIST:
            const id = buffer.getByte();
            const list_len = buffer.getInt();
            const list_result: any[] = createNBTType([], TagType.TAG_LIST);
            Object.assign(list_result, { [NBTListSymbol]: id });
            for (let _i = 0; _i < list_len; _i++) {
                list_result.push(deserializeTag(id, buffer, useMaps));
            }
            return list_result;
        case TagType.TAG_COMPOUND:
            let kind: number = buffer.getByte();
            const result: Map<string, any> = createNBTType(
                new Map(),
                TagType.TAG_COMPOUND
            );
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
            const int_len = buffer.getInt();
            const int_result: number[] = createNBTType(
                [],
                TagType.TAG_INT_ARRAY
            );
            for (let _i = 0; _i < int_len; _i++) {
                int_result.push(
                    deserializeTag(TagType.TAG_INT, buffer, useMaps)
                );
            }
            return int_result;

        case TagType.TAG_LONG_ARRAY:
            const long_len = buffer.getInt();
            const long_result: Long[] = createNBTType(
                [],
                TagType.TAG_LONG_ARRAY
            );

            for (let _i = 0; _i < long_len; _i++) {
                long_result.push(
                    deserializeTag(TagType.TAG_LONG, buffer, useMaps)
                );
            }
            return long_result;
        default:
            throw new RangeError(
                `Invalid tag type around index ${buffer.index}: ${type}`
            );
    }
}

function strMapToObj<T>(strMap: Map<string, T>): Record<string, T> {
    let obj = Object.create(null);
    for (let [k, v] of strMap) {
        obj[k] = v;
    }
    return obj;
}
