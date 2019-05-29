/**
 * An ID from Minecraft, which will have a path and may have a namespace.
 */
export class ID {
    public static readonly DEFAULT_NAMESPACE = "minecraft";
    public static readonly SEP = ":";
    public static readonly SEGMENT_REGEX = /[0-9a-z_/\.-]/;

    /**
     * Convert a string into an `ID`, with an optional seperator parameter.
     * This has the same behaviour as the constructor called with a single
     * argument if the seperator is not defined.
     *
     * If the seperator is defined, it is used to overwrite the seperator
     * between the namespace and the tag, instead of using the default `:`.
     *
     * ## Examples
     *
     * - `ID.fromString("stone")` is equivalent to `new ID("stone")`.
     * - `ID.fromString("minecraft:stone")` is equivalent to `new ID("minecraft:stone")`
     *   and `new ID("stone", "minecraft")`
     * - `ID.fromString("minecraft.stone", ".")` is equivalent to `new ID("stone", "minecraft")`
     *
     * ## Validation
     *
     * This does not validate the input, and instead naïvely splits
     * based on the first occurance of `sep`. If validation is required is
     * should be implemented manually, using `ID.SEGMENT_REGEX` to ensure
     * that the segments (path and namespace) are valid
     *
     * @param sep The seperator to use (defaults to `:`)
     */
    public static parseString(input: string, sep: string = ID.SEP): ID {
        const value = this.parseSegmentsFromString(input, sep);
        return new ID(value.path, value.namespace);
    }

    private static parseSegmentsFromString(
        input: string,
        sep: string = ID.SEP
    ): { namespace?: string; path: string } {
        const index = input.indexOf(sep);
        if (index >= 0) {
            const path = input.substring(index + sep.length, input.length);
            // Path contents should not have a splitChar in the contents, however this is unchecked
            // This simplifies using the parsed result when parsing known statics
            if (index >= sep.length) {
                return { path, namespace: input.substring(0, index) };
            } else {
                return { path };
            }
        } else {
            return { path: input };
        }
    }

    /**
     * The namespace of this ID, such as `minecraft` in `minecraft:stone`. If undefined, e.g. when parsed from `stone`,
     * it will be treated as if it was specified as "minecraft" (`ID.DEFAULT_NAMESPACE`)
     * in most cases.
     */
    public readonly namespace?: string;
    public readonly path: string;
    /**
     * Create a new ID.
     *
     * ## Examples
     *
     * These are all equivalent (mostly):
     *
     * - `new ID("stone")`
     * - `new ID("minecraft:stone")`
     * - `new ID("stone", "minecraft")`
     *
     *
     * @param path The path of the ID. If `namespace` is not passed this will be parsed (see `ID.parseString`).
     * @param namespace The namespace of the `ID`. If this is included, `path` will be used as-is.
     */
    public constructor(path: string, namespace?: string) {
        if (!namespace && path.indexOf(ID.SEP) !== -1) {
            const result = ID.parseSegmentsFromString(path);
            this.path = result.path;
            this.namespace = result.namespace;
        } else {
            this.path = path;
            this.namespace = namespace;
        }
    }

    public logicalNamespace() {
        return this.namespace || ID.DEFAULT_NAMESPACE;
    }

    /**
     * Convert this ID into a string. This also allows IDs to be used in
     * certain places where strings are expected, most notably in template literals.
     *
     * ## Example
     * ```ts
     * import * as assert from "assert";
     * import {ID} from "minecraft-id";
     *
     * assert.strictEqual(`This is an ID - ${new ID("stone")}`, "This is an ID - minecraft:stone");
     * ```
     */
    public toString(): string {
        return `${this.logicalNamespace()}${ID.SEP}${this.path}`;
    }
    /**
     * Test if this is the same ID as `other`. This treats a missing namespace as if
     * it was `minecraft`.
     *
     * ## Example
     * ```ts
     * import { ID } from "minecraft-id";
     * import * as assert from "assert";
     *
     * assert.ok(new ID("stone").equals(new ID("minecraft:stone")));
     * assert.ok(!(new ID("dirt").equals(new ID("minecraft:stone"))));
     * assert.ok(!(new ID("minecraft:stone").equals(new ID("namespace:stone"))));
     * ```
     */
    public equals(other: ID) {
        return this.sameNamespace(other) && this.path === other.path;
    }

    /**
     * Test if this has the same namespace as `other`.
     * This ignores a missing namespace
     *
     * ## Example
     * ```ts
     * import { ID } from "minecraft-id";
     * import * as assert from "assert";
     *
     * assert.ok(new ID("stone").sameNamespace(new ID("minecraft:stone")));
     * assert.ok(new ID("dirt").sameNamespace(new ID("minecraft:stone")));
     * assert.ok(!(new ID("minecraft:stone").sameNamespace(new ID("namespace:stone"))));
     * assert.ok(new ID("namespace:stone").sameNamespace(new ID("namespace:dirt")));
     * ```
     */
    public sameNamespace(other: ID) {
        return (
            this.namespace === other.namespace ||
            (this.isNamespaceDefault() && other.isNamespaceDefault())
        );
    }

    /**
     * Test if this has the `DEFAULT_NAMESPACE`. If the namespace is unspecified, this returns true
     */
    public isNamespaceDefault(): boolean {
        return (
            this.namespace === undefined ||
            this.namespace === ID.DEFAULT_NAMESPACE
        );
    }
}
