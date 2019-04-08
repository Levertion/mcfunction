import * as Long from "long";

/**
 * The `Symbol` used to store the type of the item in a `TAG_LIST`.
 * This is attached as a property on the `Array`.
 */
export const NBTListSymbol = Symbol("NBT list type");
/**
 * The `Symbol` used to store the NBT Tag Type of a JavaScript `Object`.
 *
 * To set this for your own objects, use `createNBTType`. This can be inferred in a majority of cases.
 */
export const NBTTypeSymbol = Symbol("NBT node type");
/**
 * The `Symbol` used to store the root name property of an NBT file.
 */
export const NBTNameSymbol = Symbol("NBT node name");

/**
 * A mapping of `TAG_` names to the numbers used in the format.
 */
export enum TagType {
    TAG_BYTE = 1,
    TAG_SHORT = 2,
    TAG_INT = 3,
    TAG_LONG = 4,
    TAG_FLOAT = 5,
    TAG_DOUBLE = 6,
    TAG_BYTE_ARRAY = 7,
    TAG_STRING = 8,
    TAG_LIST = 9,
    TAG_COMPOUND = 10,
    TAG_INT_ARRAY = 11,
    TAG_LONG_ARRAY = 12
}

/**
 * Create a value which is to be serialized as a specific type.
 *
 * @param type The `TagType` which is to be serialized
 */
export function createNBTType<T>(value: T, type: TagType): T {
    // tslint:disable-next-line: prefer-object-spread `Object.assign` is used here for a reason - we need to be careful about constructors
    return Object.assign(value, { [NBTTypeSymbol]: type });
}

function tagSpecifier<T>(type: TagType): <V extends T>(value: V) => V {
    return <V extends T>(v: V) => createNBTType(v, type);
}

/**
 * Specify that a `number` should be serialized as a `TAG_BYTE`
 */
export const byte = tagSpecifier<number>(TagType.TAG_BYTE);
/**
 * Specify that a `number` should be serialized as a `TAG_SHORT`
 */
export const short = tagSpecifier<number>(TagType.TAG_SHORT);
/**
 * Specify that a `number` should be serialized as a `TAG_INT`
 */
export const int = tagSpecifier<number>(TagType.TAG_INT);
/**
 * Specify that this `number` should be serialized as a `TAG_LONG`
 *
 * This is pointless on a `Long`, which are serialized as
 * `TAG_LONG` unless specified otherwise
 */
export const long = tagSpecifier<number | Long>(TagType.TAG_LONG);
/**
 * Specify that a `number` should be serialized as a `TAG_FLOAT`
 */
export const float = tagSpecifier<number>(TagType.TAG_FLOAT);
/**
 * Specify that a `number` should be serialized as a `TAG_DOUBLE`
 *
 * This is pointless as `number`s, are serialized as
 * `TAG_DOUBLE` unless specified otherwise
 */
export const double = tagSpecifier<number>(TagType.TAG_DOUBLE);
/**
 * Specify that a `number[]` should be serialized as a `TAG_BYTE_ARRAY`.
 *
 * All the numbers must be integers between -128 and 127, otherwise an
 * error is thrown upon serialization.
 */
export const byteArray = tagSpecifier<number[]>(TagType.TAG_BYTE_ARRAY); // | Int8Array (TODO;
/**
 * Specify that a `string` should be serialized as a `TAG_STRING`
 */
export const string = tagSpecifier<string>(TagType.TAG_STRING);
/**
 * Specify that an array should be serialized as a `TAG_LIST`.
 *
 * All the items must have the same `TAG_` type, otherwise an error
 * will be thrown upon serialisation. Where possible, this is automatically extracted.
 */
export const list = tagSpecifier<any[]>(TagType.TAG_LIST);
/**
 * Specify that a value `any` should be serialized as a `TAG_COMPOUND`.
 *
 * This has no effect on any resulting NBT, and is only included for consistency
 */
export const compound = tagSpecifier<any>(TagType.TAG_COMPOUND);
/**
 * Specify that a `number[]` should be serialized as a `TAG_INT_ARRAY`.
 *
 * All the numbers must be integers between -2,147,483,648 and 2,147,483,647, otherwise an
 * error will be thrown upon serialization.
 */
export const intArray = tagSpecifier<number[]>(TagType.TAG_INT_ARRAY); // | Int32Array (TODO;
/**
 * Specify that a given `Long[]` should be serialized as a `TAG_LONG_ARRAY`
 */
export const longArray = tagSpecifier<Long[]>(TagType.TAG_LONG_ARRAY);
