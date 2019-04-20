import { ID } from "./id";

export class IDMap<T> {
    private data: Map<string, Map<string, T>> = new Map();

    public set(id: ID, value: T) {
        const innerMap = this.namespaceMapOrDefault(id.namespace);
        innerMap.set(id.path, value);
    }

    public get(id: ID): T | undefined {
        const innerMap = this.namespaceMap(id.namespace);
        return innerMap && innerMap.get(id.path);
    }

    public has(id: ID): boolean {
        const innerMap = this.namespaceMap(id.namespace);
        return !!(innerMap && innerMap.has(id.path));
    }

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

    public *[Symbol.iterator](): IterableIterator<[ID, T]> {
        for (const [namespace, map] of this.data) {
            for (const [path, value] of map) {
                yield [new ID(path, namespace), value];
            }
        }
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

export class IDSet extends IDMap<undefined> {
    public add(id: ID) {
        this.set(id, undefined);
    }
}
