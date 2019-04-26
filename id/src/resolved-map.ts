import { ID } from "./id";
import { IDMap } from "./id-map";
import { IDSet } from "./id-set";

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

type InternalResolving<T> = HasDeps & HasValue<T>;
type InternalResolved<T, R> = IsResolved<R> & HasValue<T> & HasDeps;
type InternalMaybeResolving<T, R> =
    | InternalResolving<T>
    | InternalResolved<T, R>;

type ResolvingOrDeps<T, R> = InternalMaybeResolving<T, R> | HasDeps;

type Unresolved<T> = HasValue<T>;
type Requested = HasDeps;
type Stored<T, R> =
    | InternalResolving<T>
    | InternalResolved<T, R>
    | Unresolved<T>
    | Requested;

/**
 * A resolver from `T` to `R`
 */
export type Resolver<T, R> = (value: T, id: ID, map: ResolvedIDMap<T, R>) => R;
/**
 * A resolved value
 */
export type Resolved<T, R> = IsResolved<R> & HasValue<T>;
/**
 * A value which might be resolved or might not be
 */
export type MaybeResolving<T, R> = HasValue<T> | Resolved<T, R>;

/**
 * `ResolvedIDMap<T, R>` is a mapping from `ID` to `T`, but with support for
 * lazy, cached 'resolving' from that value of `T` to an `R`.
 *
 * For more detail, see the README.
 */
export class ResolvedIDMap<T, R> {
    public static isResolved = isResolved;
    private static removeDeps(value: any): any {
        const copy = { ...value };
        delete copy.deps;
        return copy;
    }
    private inner: IDMap<Stored<T, R>> = new IDMap();
    private resolver: Resolver<T, R>;
    private resolving?: ID;

    /**
     * Create a new `ResolvedIDMap`
     */
    public constructor(resolver: ResolvedIDMap<T, R>["resolver"]) {
        this.resolver = resolver;
    }

    /**
     * Create a new mapping from `id=>raw`
     */
    public set(id: ID, raw: T) {
        this.reset(id);
        this.inner.set(id, { raw });
    }

    /**
     * Test if this map has a value for `id`
     */
    public has(id: ID): boolean {
        const value = this.inner.get(id);
        return !!(value && hasValue(value));
    }

    /**
     * Get the raw, unresolved `T` value for `id`
     */
    public getRaw(id: ID): T | undefined {
        const inner = this.inner.get(id);
        return inner && (inner as HasValue<T>).raw;
    }

    /**
     * Get the value for `id`, handling loops. This should only be called within the resolver.
     * If it is currently being resolved, this returns `Resolving`, otherwise acts as `get` does.
     *
     * This can be tested for using ResolvedIDMap::isResolved
     */
    public getCycle(id: ID): MaybeResolving<T, R> | undefined {
        const value = this.resolve(id);
        if (value && hasValue(value)) {
            return ResolvedIDMap.removeDeps(value);
        }
        return undefined;
    }

    /**
     * Iterate through all the `[ID, T]` pairs
     */
    public *[Symbol.iterator](): IterableIterator<[ID, T]> {
        for (const [namespace, value] of this.inner) {
            if (hasValue(value)) {
                yield [namespace, value.raw];
            }
        }
    }

    /**
     * Get the value for `id`.
     *
     * @throws if this is called from within the resolver and a loop is met.
     */
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

    /**
     * Remove the mapping from `id` to a value.
     *
     * @returns whether the map contained a value for `id`
     */
    public delete(id: ID): boolean {
        this.reset(id);
        return this.inner.delete(id);
    }

    /**
     * Call the resolver for all of the dependents of `id`.
     *
     * This is useful for the error-reporting use case mentioned in the README.
     */
    public resolveDeps(id: ID): void {
        this.forEachDep(id, (_, innerID) => {
            this.resolve(innerID);
        });
    }

    private forEachDep(id: ID, func: (stored: Stored<T, R>, id: ID) => void) {
        const value = this.inner.get(id);
        if (value) {
            const deps = hasDeps(value) && value.deps;
            func(value, id);
            if (deps) {
                for (const dep of deps) {
                    this.forEachDep(dep, func);
                }
            }
        }
    }

    private reset(id: ID): void {
        this.forEachDep(id, value => {
            if (hasDeps(value)) {
                delete value.deps;
            }
            if (isResolved(value)) {
                delete value.resolved;
            }
        });
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
            // No value, only requested dependents
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
