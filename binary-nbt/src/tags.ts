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
    return Object.assign(value, { [NBTTypeSymbol]: type });
}
