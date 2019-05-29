import { ID, IDMap, IDSet } from "minecraft-id";
import { DataPackID, RootID } from "./types/data";

interface HasValue<T> {
    raw: T;
}
// A value which stores the dependants - the values whose resolution (directly) requested this value
interface HasDependants {
    deps: IDSet;
}
interface IsResolved<R> {
    resolved: R;
}
// A value which is in the process of being resolved
// This allows for detecting cycles, rather than overflowing the stack
interface IsResolving {
    resolving: true;
}

function isResolving(value: any): value is IsResolving {
    return (
        value.hasOwnProperty("resolving") && (value as IsResolving).resolving
    );
}

function hasValue(value: any): value is HasValue<any> {
    return value.hasOwnProperty("raw");
}

function hasDeps(value: any): value is HasDependants {
    return value.hasOwnProperty("deps");
}

function isResolved(value: any): value is IsResolved<any> {
    return value.hasOwnProperty("resolved");
}

type GlobalStored<T, R> =
    // A global value will have a value
    | HasValue<T>
    // It might be resolved on its own, but it doesn't make sense to store deps
    // Because the base global map is immutable
    | HasValue<T> & (IsResolving | IsResolved<R>);

type LocalStored<T, R> =
    // If it has been requested even though it has no value, this stored that
    | HasDependants
    | LocalPacks<T>
    | LocalPacks<T> & HasDependants & (IsResolved<R> | IsResolving);

type LocalPacks<T> = HasValue<Map<DataPackID, T>>;

/**
 * The values for a given `ID`
 */
export interface Values<T> {
    global?: T;
    // TODO: Order these based on datapack ordering
    locals?: Array<[DataPackID, T]>;
}

/**
 * Resolve from the (ordered) list of `T` values
 * into the specific `R`.
 *
 * For example, this can be used to convert tags into the
 * `IDSet` of contained items
 */
export type Resolver<T, R> = (
    values: ValuesWithPack<T>,
    id: ID,
    root: RootID | undefined,
    resources: Resource<T, R>
) => R;

// Handling default type parameters is made more difficult than it should by Typescript,
// So we assume that all things must be resolved, and let the concrete definitions make
// otherwise work, e.g. by using undefined for R
type PerRootStored<T, R> = IDMap<LocalStored<T, R>>;

/**
 * A helper function to get a value from a map, or insert a new one if
 * not present
 */
function getFromMapOrDefault<K, V>(
    map: Map<K, V>,
    key: K,
    defaultFunction: () => V
): V {
    const value = map.get(key);
    if (value) {
        return value;
    }
    const newValue = defaultFunction();
    map.set(key, newValue);
    return newValue;
}

type ValuesWithPack<T> = Array<[T, DataPackID?]>;

/**
 * Handles the concept of a resource which may be defined in a datapack or globally
 * (i.e by minecraft itself).
 *
 * The global data is treated as immutable
 */
export class Resource<T, R = undefined> {
    public static toNaiveArray<T>(values: Values<T>): T[] {
        return this.toDatapackArray(values).map(([v]) => v);
    }
    public static toDatapackArray<T>(values: Values<T>): ValuesWithPack<T> {
        const result: ValuesWithPack<T> = [];
        if (values.locals) {
            for (const [pack, value] of values.locals) {
                result.push([value, pack]);
            }
        }
        if (values.global) {
            result.push([values.global]);
        }
        return result;
    }
    private global: IDMap<GlobalStored<T, R>> = new IDMap();
    private resolver: Resolver<T, R>;
    private locals: Map<RootID, PerRootStored<T, R>> = new Map();
    /**
     * Represents the value which was last requested and so, if set
     * should be added as a dependant of the local version.
     */
    private currentlyResolving: ID | undefined;

    /**
     * @param global The (immutable) values defined globally.
     */
    constructor(resolver: Resolver<T, R>, global: IDMap<T>) {
        this.resolver = resolver;
        for (const [id, raw] of global) {
            this.global.set(id, { raw });
        }
    }

    /**
     * @returns whether the value existed before being removed
     */
    public delete(id: ID, root: RootID): boolean {
        this.invalidateDependants(id, root);
        const rootContents = this.locals.get(root);
        return !!(rootContents && rootContents.delete(id));
    }

    public has(id: ID, root?: RootID) {
        return this.getValuesArray(id, root).length > 0;
    }

    /**
     * @returns the old value if it existed
     */
    public set(
        id: ID,
        root: RootID,
        value: T,
        datapack: DataPackID
    ): T | undefined {
        this.invalidateDependants(id, root);
        const localValue = this.getLocalUninitialized(id, root);
        if (hasValue(localValue)) {
            const old = localValue.raw.get(datapack);
            localValue.raw.set(datapack, value);
            return old;
        }
        const asLocalPacks = localValue as LocalPacks<T>;
        const newRaw = new Map();
        asLocalPacks.raw = newRaw;
        newRaw.set(datapack, value);
        return undefined;
    }

    /**
     * Get the values of T for this root. This is returned in order,
     * with global at the end (and, in future, the correct datapack order).
     */
    public getValuesArray(id: ID, root?: RootID): T[] {
        const values = this.getValues(id, root);
        const result: T[] = [];
        if (values.locals) {
            for (const [, value] of values.locals) {
                result.push(value);
            }
        }
        if (values.global) {
            result.push(values.global);
        }
        return result;
    }

    public getValues(id: ID, root?: RootID): Values<T> {
        const globalRaw = this.global.get(id);
        const global = hasValue(globalRaw) ? globalRaw.raw : undefined;
        const local = this.getLocal(id, root);
        if (local && hasValue(local)) {
            return { locals: [...local.raw], global };
        }
        return { global };
    }

    /**
     * @throws if there is a cycle
     */
    public getResolved(id: ID, root?: RootID): R | undefined {
        const resolved = this.resolve(id, root);
        if (resolved) {
            if (resolved.isResolving) {
                throw new Error(
                    `Value for ${id} in ${root} requested during its own resolution. To avoid this error being thrown, use \`getCycle\` instead`
                );
            }
            return resolved.resolved;
        }
        return undefined;
    }

    /**
     * Get the resolved value for `id`, returning early if
     * the value is in the process of resolving
     */
    public getCycle(
        id: ID,
        root?: RootID
    ): { resolved?: R; isResolving: boolean } | undefined {
        const resolved = this.resolve(id, root);
        return (
            resolved && {
                isResolving: resolved.isResolving || false,
                resolved: resolved.resolved
            }
        );
    }

    /**
     * Reresolve all of the dependants of this value.
     */
    public reresolve(id: ID, root: RootID) {
        this.forEachDep(id, root, (value, dep) => {
            if (isResolved(value)) {
                delete value.resolved;
            }
            this.resolve(dep, root);
        });
    }

    private invalidateDependants(id: ID, root: RootID) {
        this.forEachDep(id, root, value => {
            if (isResolved(value)) {
                delete value.resolved;
            }
        });
    }

    private forEachDep(
        id: ID,
        root: RootID,
        func: (value: LocalStored<T, R>, id: ID) => void
    ) {
        const localMap = this.locals.get(root);
        if (localMap) {
            for (const innerID of this.collectDeps(id, root)) {
                const stored = localMap.get(innerID);
                if (stored) {
                    func(stored, innerID);
                }
            }
        }
    }

    private collectDeps(
        id: ID,
        root: RootID,
        collected: IDSet = new IDSet()
    ): IDSet {
        collected.add(id);
        const value = this.getLocal(id, root);
        if (value && hasDeps(value)) {
            for (const dep of value.deps) {
                if (!collected.has(dep)) {
                    this.collectDeps(dep, root, collected);
                }
            }
        }
        return collected;
    }

    private getLocalUninitialized(
        id: ID,
        root: RootID
    ): LocalStored<T, R> | {} {
        const local = getFromMapOrDefault(this.locals, root, () => new IDMap());
        const datapacks = local.getOrElse(id, () => ({} as any));
        return datapacks;
    }

    private getResolving(
        id: ID,
        root?: RootID
    ): [LocalStored<T, R> | GlobalStored<T, R> | {}, boolean] {
        if (root) {
            const local = this.getLocalUninitialized(id, root);
            return [local, true];
        } else {
            const uninitGlobal = this.global.getOrElse(
                id,
                () => ({} as any)
            ) as GlobalStored<T, R> | {};
            return [uninitGlobal, false];
        }
    }
    private resolve(
        id: ID,
        root?: RootID
    ): { resolved?: R; isResolving?: true } | undefined {
        const [raw, shouldHaveDeps] = this.getResolving(id, root);
        const previousResolving = this.currentlyResolving;

        if (shouldHaveDeps && previousResolving) {
            const asHasDeps = raw as HasDependants;
            asHasDeps.deps = asHasDeps.deps || new IDSet();
            asHasDeps.deps.add(previousResolving);
        }
        const values = this.getValues(id, root);
        const asArray = Resource.toDatapackArray(values);
        if (asArray.length === 0) {
            return undefined;
        }
        if (isResolved(shouldHaveDeps)) {
            return { resolved: shouldHaveDeps.resolved };
        }
        if (isResolving(shouldHaveDeps)) {
            return {
                isResolving: true
            };
        }
        this.currentlyResolving = id;
        // Unfortunate assertions to change the type of the stored.
        (raw as IsResolving).resolving = true;
        const resolved = this.resolver(asArray, id, root, this);
        (raw as IsResolved<R>).resolved = resolved;
        delete (raw as IsResolving).resolving;
        this.currentlyResolving = previousResolving;
        return { resolved };
    }

    private getLocal(id: ID, root?: RootID): LocalStored<T, R> | undefined {
        if (!root) {
            return undefined;
        }
        const rootPacks = this.locals.get(root);
        if (rootPacks) {
            const local = rootPacks.get(id);
            return local;
        }
        return undefined;
    }
}
