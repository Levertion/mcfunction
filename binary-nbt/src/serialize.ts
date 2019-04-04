import { BufferStream } from "./buffer-stream";
import { NBTTypeSymbol, TagType } from "./tags";

/**
 * Serialize from a value into an equivalent NBT value
 */
export function SerializeNBT(value: unknown) {
    const buffer = new BufferStream(Buffer.alloc(1024)); // Size is doubled on every write past end
    serializeInto(value, buffer);
    return buffer.getData();
}

function serializeInto(value: unknown, stream: BufferStream) {
    if (typeof value === "object" && value) {
        if (Reflect.has(value, NBTTypeSymbol)) {
            serializeAsTagType(
                Reflect.get(value as object, NBTTypeSymbol),
                value,
                stream
            );
        }
    } else {
        if (typeof value === "boolean") {
            if (value) {
                stream.setByte(1);
            } else {
                stream.setByte(0);
            }
        } else if (typeof value === "number") {
            // TODO: Better default
            stream.setDouble(value);
        } else if (typeof value === "string") {
            stream.setUTF8(value);
        } else {
            throw new TypeError(`Cannot serialize ${value} into NBT`);
        }
    }
}

function serializeAsTagType(
    type: TagType,
    value: unknown,
    stream: BufferStream
) {
    switch (type) {
        case TagType.TAG_BYTE:
            if (value instanceof Number) {
                stream.setByte(value.valueOf());
            } else {
                throw new TypeError(
                    `Cannot serialize ${value} as byte, it is not a number`
                );
            }
            break;
        case TagType.TAG_SHORT:
            if (value instanceof Number) {
                stream.setShort(value.valueOf());
            } else {
                throw new TypeError(
                    `Cannot serialize ${value} as short, it is not a number`
                );
            }
            break;
        default:
            break;
    }
}
