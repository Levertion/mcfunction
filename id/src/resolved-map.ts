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
interface IsResolving {
    resolving: true;
}

function isResolving(value: any): value is IsResolving {
    return value.hasOwnProperty("resolving");
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

// Is being resolved
type InternalResolving<T> = HasDeps & HasValue<T> & IsResolving;
// Has been resolved
type InternalResolved<T, R> = IsResolved<R> & HasValue<T> & HasDeps;
// Might be resolving
type InternalMaybeResolving<T, R> =
    | InternalResolving<T>
    | InternalResolved<T, R>;

type ResolvingOrRequested<T, R> = InternalMaybeResolving<T, R> | Requested;

type Unresolved<T> = HasValue<T> & Partial<HasDeps>;
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
    private static cleanUp(value: any): any {
        const copy = { ...value };
        delete copy.deps;
        delete copy.resolving;
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
        const value = this.inner.get(id);
        if (value) {
            this.inner.set(id, { ...value, raw });
        } else {
            this.inner.set(id, { raw });
        }
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
            return ResolvedIDMap.cleanUp(value);
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
                return ResolvedIDMap.cleanUp(result);
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
        this.forEachDep(id, innerID => this.resolve(innerID));
    }

    private forEachDep(id: ID, func: (id: ID) => void) {
        for (const innerID of this.collectDeps(id)) {
            func(innerID);
        }
    }
    private collectDeps(id: ID, collected: IDSet = new IDSet()): IDSet {
        collected.add(id);
        const value = this.inner.get(id);
        if (value && hasDeps(value)) {
            for (const dep of value.deps) {
                if (!collected.has(dep)) {
                    this.collectDeps(dep, collected);
                }
            }
        }
        return collected;
    }

    private reset(id: ID): void {
        this.forEachDep(id, innerID => {
            const value = this.inner.get(innerID);
            if (value) {
                if (isResolved(value)) {
                    delete value.resolved;
                }
            }
        });
    }

    private resolve(id: ID): ResolvingOrRequested<T, R> | undefined {
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
            isResolving(value)
        ) {
            return value;
        }
        // Unresolved and no deps.
        this.resolving = id;
        // Unfortunate assertions to change the type of the stored.
        const deps = ((value as HasDeps).deps = new IDSet());
        if (previousResolving) {
            deps.add(previousResolving);
        }
        ((value as unknown) as IsResolving).resolving = true;
        ((value as unknown) as IsResolved<R>).resolved = this.resolver(
            value.raw,
            id,
            this
        );
        delete ((value as unknown) as IsResolving).resolving;
        this.resolving = previousResolving;
        return value as InternalResolved<T, R>;
    }
}
