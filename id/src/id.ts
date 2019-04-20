export class ID {
    public static readonly DEFAULT_NAMESPACE = "minecraft";
    public static readonly SEP = ":";
    public static readonly SEGMENT_REGEX = /[0-9a-z_/\.-]/;

    /**
     * Convert a string into an `ID`.
     *
     * ## Examples
     *
     * `ID.fromString("stone")` is equivalent to `new ID("stone")`
     * `ID.fromString("minecraft:stone")` is equivalent to `new ID("stone", "minecraft")`
     * `ID.fromString(":stone")` is equivalent to `new ID("stone")` (this is the behaviour of vanilla)
     *
     * ## Note on applicability
     *
     * This should only be called directly
     * on strings which are known to be valid, such as those produced by
     * the minecraft data generators, for example. This does not validate
     * the input in any way.
     *
     */
    public static fromString(input: string, sep: string = ID.SEP): ID {
        const index = input.indexOf(sep);
        if (index >= 0) {
            const pathContents = input.substring(
                index + sep.length,
                input.length
            );
            // Path contents should not have a splitChar in the contents, however this is unchecked
            // This simplifies using the parsed result when parsing known statics
            if (index >= sep.length) {
                return new ID(pathContents, input.substring(0, index));
            } else {
                return new ID(pathContents);
            }
        } else {
            return new ID(input);
        }
    }

    public namespace?: string;
    public path: string;

    public constructor(path: string, namespace?: string) {
        this.path = path;
        this.namespace = namespace;
    }

    public toString(): string {
        return `${this.namespace || ID.DEFAULT_NAMESPACE}${ID.SEP}${this.path}`;
    }

    public equals(other: ID) {
        return this.sameNamespace(other) && this.path === other.path;
    }

    public sameNamespace(other: ID) {
        return (
            this.namespace === other.namespace ||
            (this.isNamespaceDefault() && other.isNamespaceDefault())
        );
    }

    public isNamespaceDefault(): boolean {
        return (
            this.namespace === undefined ||
            this.namespace === ID.DEFAULT_NAMESPACE
        );
    }
}
