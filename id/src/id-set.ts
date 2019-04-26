import { ID } from "./id";

/**
 * A simple `Set` of `ID`s.
 *
 * Internally, this is stored as a `Map<(namespace) string, Set<(path)string>>`
 */
export class IDSet
// implements Set<ID>
{
    private data: Map<string, Set<string>> = new Map();

    /**
     * Get the total number of `ID`s in this map.
     */
    public get size(): number {
        let count = 0;
        this.data.forEach(v => (count += v.size));
        return count;
    }

    /**
     * Remove all data from this `IDSet`.
     */
    public clear() {
        this.data.clear();
    }

    /**
     * Remove `id` from this set
     *
     * @returns whether `id` was in the set
     */
    public delete(id: ID): boolean {
        const set = this.namespaceSet(id.namespace);
        if (set) {
            const result = set.delete(id.path);
            if (set.size === 0) {
                this.data.delete(id.namespace || ID.DEFAULT_NAMESPACE);
            }
            return result;
        }
        return false;
    }

    /**
     * Test if the set includes `id`.
     */
    public has(id: ID): boolean {
        const set = this.namespaceSet(id.namespace);
        return !!(set && set.has(id.path));
    }
    /**
     * Add `id` to this set.
     *
     * See also, IDMap::set.
     */
    public add(id: ID): this {
        const map = this.namespaceSetOrDefault(id.namespace);
        map.add(id.path);
        return this;
    }

    /**
     * Iterate through the `ID`s of this map
     */
    public *[Symbol.iterator](): IterableIterator<ID> {
        for (const [namespace, set] of this.data) {
            for (const path of set) {
                yield new ID(path, namespace);
            }
        }
    }

    private namespaceSetOrDefault(
        namespace: string = ID.DEFAULT_NAMESPACE
    ): Set<string> {
        const result = this.namespaceSet(namespace);
        if (typeof result !== "undefined") {
            return result;
        }
        const newSet = new Set();
        this.data.set(namespace, newSet);
        return newSet;
    }

    private namespaceSet(
        namespace: string = ID.DEFAULT_NAMESPACE
    ): Set<string> | undefined {
        return this.data.get(namespace);
    }
}
