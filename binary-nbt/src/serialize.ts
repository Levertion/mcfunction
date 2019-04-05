import { BufferStream } from "./buffer-stream";
import { NBTTypeSymbol, TagType, NBTListSymbol, NBTNameSymbol } from "./tags";
import * as Long from "long";
import { ok } from "assert";

/**
 * Serialize from a value into an equivalent NBT value
 */
export function SerializeNBT(value: unknown) {
    const buffer = new BufferStream(Buffer.alloc(1024)); // Size is doubled on every write past end

    serializeInto({ value, stream: buffer, serializeName: true });
    return buffer.getData();
}

function serializeInto({
    value,
    stream,
    returnTagType,
    serializeName,
    tagTypeHint
}: {
    value: unknown;
    stream: BufferStream;
    returnTagType?: boolean;
    serializeName?: boolean;
    tagTypeHint?: TagType;
}): TagType | undefined {
    if (typeof value === "object" && value) {
        if (serializeName) {
            const name = Reflect.get(value, NBTNameSymbol);
            if (name) {
                stream.setUTF8(name);
            }
        }
        return serializeObjectAsTagType(
            tagTypeHint || Reflect.get(value as object, NBTTypeSymbol),
            value,
            stream,
            returnTagType
        );
    } else {
        switch (typeof value) {
            case "boolean":
                if (returnTagType === true) {
                    return TagType.TAG_BYTE;
                }
                if (returnTagType === undefined) {
                    stream.setByte(TagType.TAG_BYTE);
                }
                if (value) {
                    stream.setByte(1);
                } else {
                    stream.setByte(0);
                }
                break;
            case "number":
                // TODO: Possibly better default if value is integer
                stream.setByte(TagType.TAG_DOUBLE);
                stream.setDouble(value);
                break;
            case "string":
                stream.setByte(TagType.TAG_STRING);
                stream.setUTF8(value);
                break;
            default:
                throw new TypeError(`Cannot serialize ${value} into NBT`);
        }
    }
    return undefined;
}
const ensureInt = (value: number) =>
    ok(
        Number.isInteger(value),
        `${value} should be an integer with an integer type`
    );

const numberSerialisations: Partial<
    Record<
        keyof typeof TagType,
        (buffer: BufferStream, num: number, value: Long | Number) => void
    >
> = {
    ["TAG_BYTE"]: (stream, num) => {
        ensureInt(num);
        stream.setByte(num);
    },
    ["TAG_SHORT"]: (stream, num) => {
        ensureInt(num);
        stream.setShort(num);
    },
    ["TAG_INT"]: (stream, num) => {
        ensureInt(num);
        stream.setInt(num);
    },
    ["TAG_LONG"]: (stream, num, value) => {
        if (value instanceof Long) {
            stream.setLong(value);
        } else {
            ensureInt(num);
            stream.setLong(Long.fromNumber(num));
        }
    },
    ["TAG_DOUBLE"]: (stream, num) => {
        stream.setDouble(num);
    },
    ["TAG_FLOAT"]: (stream, num) => {
        stream.setFloat(num);
    }
};

function serializeObjectAsTagType(
    type: TagType | undefined,
    value: object,
    stream: BufferStream,
    returnTagType?: boolean
): TagType | undefined {
    if (Array.isArray(value)) {
        serializeArray(stream, type, value);
    } else if (value instanceof String) {
        if (type === undefined || type === TagType.TAG_STRING) {
            if (returnTagType === true) {
                return TagType.TAG_STRING;
            } else if (returnTagType === false) {
                stream.setUTF8(value.valueOf());
            } else {
                stream.setByte(TagType.TAG_STRING);
                serializeInto({ value: value.valueOf(), stream });
                stream.setUTF8(value.valueOf());
            }
        } else {
            throw new TypeError(
                `Cannot serialize string "${value}" as a ${TagType[type]}`
            );
        }
    } else if (value instanceof Number || value instanceof Long) {
        serializeNumber(type, value, stream, returnTagType);
    } else {
        const entries =
            value instanceof Map ? [...value] : Object.entries(value);
        stream.setByte(TagType.TAG_COMPOUND);
        for (const [name, val] of entries) {
            const tagType = serializeInto({
                value: val,
                stream,
                returnTagType: true
            });
            if (tagType) {
                stream.setByte(tagType);
                stream.setUTF8(name);
                serializeInto({ value: val, stream, returnTagType: false });
            } else {
                ok(false, `Internal error serializing ${val}`);
            }
        }
        stream.setByte(0);
    }
    return undefined;
}

function serializeNumber(
    type: TagType | undefined,
    value: Number | Long,
    stream: BufferStream,
    returnTagType?: boolean
): TagType | undefined {
    // Bounds checks are handled by `Buffer`
    const num = value instanceof Number ? value.valueOf() : value.toNumber();
    switch (type) {
        case undefined:
            if (value instanceof Long) {
                if (returnTagType === true) {
                    return TagType.TAG_LONG;
                } else if (returnTagType === false) {
                    stream.setLong(value);
                } else {
                    stream.setByte(TagType.TAG_LONG);
                    stream.setLong(value);
                }
            } else {
                if (returnTagType === true) {
                    return TagType.TAG_DOUBLE;
                } else if (returnTagType === false) {
                    stream.setDouble(num);
                } else {
                    stream.setByte(TagType.TAG_DOUBLE);
                    stream.setDouble(num);
                }
            }
            break;
        default:
            const numberSerializer =
                numberSerialisations[
                    TagType[type] as keyof typeof numberSerialisations
                ];
            if (numberSerializer) {
                if (returnTagType === true) {
                    return type;
                } else if (returnTagType === undefined) {
                    stream.setByte(type);
                }
                numberSerializer(stream, num, value);
            } else {
                throw new TypeError(
                    `Cannot serialize number '${value}' as a ${TagType[type]}`
                );
            }
    }
    return undefined;
}

function serializeArray(
    stream: BufferStream,
    type: TagType | undefined,
    value: any[]
) {
    switch (type) {
        case undefined:
        case TagType.TAG_LIST:
            let itemType: TagType = Reflect.get(value, NBTListSymbol);
            if (!itemType && value.length > 0) {
                const arrayType = serializeInto({
                    value: value[0],
                    stream,
                    returnTagType: true
                });
                if (arrayType) {
                    itemType = arrayType;
                } else {
                    ok(false, `Internal error serializing ${value[0]}`);
                }
            } else {
                throw new TypeError(
                    "Cannot serialize an empty list without a type hint"
                );
            }
            if (itemType) {
                stream.setByte(itemType);
                serializeArrayContents(stream, itemType, value);
            }
            break;
        case TagType.TAG_BYTE_ARRAY:
            serializeArrayContents(stream, TagType.TAG_BYTE, value);
            break;
        case TagType.TAG_INT_ARRAY:
            serializeArrayContents(stream, TagType.TAG_INT, value);
            break;
        case TagType.TAG_LONG_ARRAY:
            serializeArrayContents(stream, TagType.TAG_LONG, value);
            break;
        default:
            throw new TypeError(
                `Cannot serialize array ${value} as a ${TagType[type]}`
            );
    }
}

function serializeArrayContents(
    stream: BufferStream,
    itemType: TagType,
    value: any[]
) {
    stream.setInt(value.length);
    for (const item of value) {
        const thisItemType = serializeInto({
            stream,
            value: item,
            returnTagType: true,
            tagTypeHint: itemType
        });
        if (thisItemType !== itemType) {
            throw new TypeError(
                `Cannot serialize ${item} as ${
                    TagType[itemType]
                } in array of that type`
            );
        }
    }
}
