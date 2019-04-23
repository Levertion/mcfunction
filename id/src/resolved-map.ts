import { ID } from "./id";
import { IDMap, IDSet } from "./id-map";

interface HasValue<T> {
    raw: T;
}
interface HasDeps {
    deps: IDSet;
}
interface IsResolved<R> {
    resolved: R;
}

function hasValue(value: any): value is HasValue<any> {
    return value.hasOwnProperty("raw");
}
function hasDeps(value: any): value is HasDeps {
    return value.hasOwnProperty("deps");
}
export function isResolved(value: any): value is IsResolved<any> {
    return value.hasOwnProperty("resolved");
}

type InternalResolving<T> = HasDeps & HasValue<T>;
type InternalResolved<T, R> = IsResolved<R> & HasValue<T> & HasDeps;
type InternalMaybeResolving<T, R> =
    | InternalResolving<T>
    | InternalResolved<T, R>;

export type Resolved<T, R> = IsResolved<R> & HasValue<T>;
export type MaybeResolving<T, R> = HasValue<T> | Resolved<T, R>;
type ResolvingOrDeps<T, R> = InternalMaybeResolving<T, R> | HasDeps;

type Unresolved<T> = HasValue<T>;
type Requested = HasDeps;
type Stored<T, R> =
    | InternalResolving<T>
    | InternalResolved<T, R>
    | Unresolved<T>
    | Requested;

type Resolver<T, R> = (value: T, id: ID, map: ResolvedIDMap<T, R>) => R;

export class ResolvedIDMap<T, R> {
    private static removeDeps(value: any): any {
        const copy = { ...value };
        delete copy.deps;
        return copy;
    }
    private inner: IDMap<Stored<T, R>> = new IDMap();
    private resolver: Resolver<T, R>;
    private resolving?: ID;

    public constructor(resolver: ResolvedIDMap<T, R>["resolver"]) {
        this.resolver = resolver;
    }

    public set(id: ID, raw: T) {
        this.reset(id);
        this.inner.set(id, { raw });
    }

    public has(id: ID): boolean {
        const value = this.inner.get(id);
        return !!(value && hasValue(value));
    }

    public getRaw(id: ID): T | undefined {
        const inner = this.inner.get(id);
        return inner && (inner as HasValue<T>).raw;
    }

    public getCycle(id: ID): MaybeResolving<T, R> | undefined {
        const value = this.resolve(id);
        if (value && hasValue(value)) {
            return ResolvedIDMap.removeDeps(value);
        }
        return undefined;
    }

    public *[Symbol.iterator](): IterableIterator<[ID, T]> {
        for (const [namespace, value] of this.inner) {
            if (hasValue(value)) {
                yield [namespace, value.raw];
            }
        }
    }

    public get(id: ID): Resolved<T, R> | undefined {
        const result = this.getCycle(id);
        if (result) {
            if (isResolved(result)) {
                return ResolvedIDMap.removeDeps(result);
            }
            throw new Error(
                `Value for ${id} requested during its own resolution. To avoid this error being thrown, use \`getCycle\` instead`
            );
        }
        return undefined;
    }

    public delete(id: ID): boolean {
        this.reset(id);
        return this.inner.delete(id);
    }

    private reset(id: ID): void {
        const value = this.inner.get(id);
        if (value && hasDeps(value)) {
            const { deps } = value;
            delete value.deps;
            if (isResolved(value)) {
                delete value.resolved;
            }
            for (const [dep] of deps) {
                this.reset(dep);
            }
        }
    }

    private resolve(id: ID): ResolvingOrDeps<T, R> | undefined {
        const value = this.inner.get(id);
        const previousResolving = this.resolving;
        if (typeof value === "undefined") {
            if (previousResolving) {
                const newSet = new IDSet();
                const newValue = { deps: newSet };
                newSet.add(previousResolving);
                this.inner.set(id, newValue);
                return newValue;
            }
            return undefined;
        }
        if (hasDeps(value) && previousResolving) {
            value.deps.add(previousResolving);
        }
        if (
            // No value, only requested dependencies
            !hasValue(value) ||
            // Resolved
            isResolved(value) ||
            // Resolving
            hasDeps(value)
        ) {
            return value;
        }
        // Unresolved and no deps.
        const asserted = value as InternalResolved<T, R>;
        this.resolving = id;
        asserted.deps = new IDSet();
        if (previousResolving) {
            asserted.deps.add(previousResolving);
        }
        asserted.resolved = this.resolver(value.raw, id, this);
        this.resolving = previousResolving;
        return asserted;
    }
}
