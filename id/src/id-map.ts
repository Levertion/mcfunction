import { ID } from "./id";

/**
 * A mapping from `ID` to `T`.
 *
 * Internally, this is stored as a `Map<(namespace) string, Map<(path)string, T>>`
 */
export class IDMap<T>
// implements Map<ID, T>
{
    private data: Map<
        /* namespace */ string,
        Map</* path */ string, T>
    > = new Map();

    /**
     * Remove all data from this `IDMap`.
     */
    public clear(): void {
        this.data.clear();
    }

    /**
     * Get the total number of `ID=>T` mappings in this map.
     */
    public get size(): number {
        let size = 0;
        this.data.forEach(v => (size += v.size));
        return size;
    }

    /**
     * Add a mapping from `id=>value`.
     *
     * This will use the default namespace if not specified,
     * i.e `IDMap::set(new ID("stone"), ...)` and `IDMap::set(new ID("minecraft:stone"), ...)`
     * are equivalent and indistinguishable.
     */
    public set(id: ID, value: T): this {
        const innerMap = this.namespaceMapOrDefault(id.namespace);
        innerMap.set(id.path, value);
        return this;
    }

    /**
     * Get the value of `id` from the map, if it exists.
     */
    public get(id: ID): T | undefined {
        const innerMap = this.namespaceMap(id.namespace);
        return innerMap && innerMap.get(id.path);
    }

    /**
     * Test if the map has a value for `id`.
     */
    public has(id: ID): boolean {
        const innerMap = this.namespaceMap(id.namespace);
        return !!(innerMap && innerMap.has(id.path));
    }

    /**
     * Remove `id` from this map
     *
     * @returns whether `id` was in the map
     */
    public delete(id: ID): boolean {
        const innerMap = this.namespaceMap(id.namespace);
        if (innerMap) {
            const result = innerMap.delete(id.path);
            if (innerMap.size === 0) {
                this.data.delete(id.namespace || ID.DEFAULT_NAMESPACE);
            }
            return result;
        }
        return false;
    }

    /**
     * Iterate through the `[ID, T]` pairs of this map
     */
    public *[Symbol.iterator](): IterableIterator<[ID, T]> {
        for (const [namespace, map] of this.data) {
            for (const [path, value] of map) {
                yield [new ID(path, namespace), value];
            }
        }
    }

    /**
     * Get the value of `id` from this map, or create a
     * value using `defaultFunction` and return it.
     */
    public getOrElse(id: ID, defaultFunction: () => T): T {
        const v = this.get(id);
        if (v) {
            return v;
        }
        const newValue = defaultFunction();
        this.namespaceMapOrDefault(id.namespace).set(id.path, newValue);
        return newValue;
    }

    private namespaceMap(
        namespace: string = ID.DEFAULT_NAMESPACE
    ): Map<string, T> | undefined {
        return this.data.get(namespace);
    }

    private namespaceMapOrDefault(
        namespace: string = ID.DEFAULT_NAMESPACE
    ): Map<string, T> {
        const result = this.data.get(namespace);
        if (typeof result !== "undefined") {
            return result;
        }
        const newMap = new Map();
        this.data.set(namespace, newMap);
        return newMap;
    }
}
