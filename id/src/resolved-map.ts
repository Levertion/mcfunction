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
function isResolved(value: any): value is IsResolved<any> {
    return value.hasOwnProperty("resolved");
}

export type Resolving<T> = HasDeps & HasValue<T>;
export type Resolved<T, R> = IsResolved<R> & HasValue<T> & HasDeps;
export type MaybeResolving<T, R> = Resolving<T> | Resolved<T, R>;
type ResolvingOrDeps<T, R> = MaybeResolving<T, R> | HasDeps;

type Unresolved<T> = HasValue<T>;
type Requested = HasDeps;
type Stored<T, R> = Resolving<T> | Resolved<T, R> | Unresolved<T> | Requested;

type Resolver<T, R> = (map: ResolvedIDMap<T, R>, id: ID, value: T) => R;

export class ResolvedIDMap<T, R> {
    private inner: IDMap<Stored<T, R>> = new IDMap();
    private resolver: Resolver<T, R>;
    private resolving?: ID;

    public constructor(resolver: ResolvedIDMap<T, R>["resolver"]) {
        this.resolver = resolver;
    }

    public set(id: ID, raw: T) {
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
            return value;
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
                return result;
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
            for (const [dep] of value.deps) {
                this.reset(dep);
            }
            delete value.deps;
            if (isResolved(value)) {
                delete value.resolved;
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
        if (hasDeps(value)) {
            if (previousResolving) {
                value.deps.add(previousResolving);
            }
        }
        if (!hasValue(value)) {
            return value;
        }
        if (isResolved(value)) {
            return value;
        }
        const asserted = value as Resolved<T, R>;
        this.resolving = id;
        asserted.deps = new IDSet();
        if (previousResolving) {
            asserted.deps.add(previousResolving);
        }
        asserted.resolved = this.resolver(this, id, value.raw);
        this.resolving = previousResolving;
        return asserted;
    }
}
