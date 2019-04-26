import { deepStrictEqual, strictEqual, throws } from "assert";
import { ID, ResolvedIDMap } from "../src";

describe("previousResolving", () => {
    it("should work with a simple resolver", () => {
        let count = 0;
        const map = new ResolvedIDMap<string, string>((value, id) => {
            count++;
            return `${value} resolved from ${id}`;
        });
        map.set(new ID("path"), "test1");
        strictEqual(count, 0);
        deepStrictEqual(map.get(new ID("path", "minecraft")), {
            raw: "test1",
            resolved: "test1 resolved from minecraft:path"
        });
        map.get(new ID("path"));
        strictEqual(count, 1);
        map.set(new ID("path"), "test2");
        deepStrictEqual(map.get(new ID("path", "minecraft")), {
            raw: "test2",
            resolved: "test2 resolved from minecraft:path"
        });
        strictEqual(count, 2);
    });
    it("should work with a simple recursive resolver", () => {
        let count = 0;
        const map = new ResolvedIDMap<string, string>((value, id, innermap) => {
            count++;
            let result: string;
            if (!id.isNamespaceDefault()) {
                const newID = new ID(id.path);
                const newResult = innermap.get(newID);
                result = newResult
                    ? newResult.resolved
                    : `no value for ${newID}`;
            } else {
                result = "namespace is already default";
            }
            return `${value} resolved from ${id} and ${result}`;
        });
        map.set(new ID("first"), "inminecraft");
        strictEqual(count, 0);
        map.set(new ID("first", "namespace"), "notminecraft");
        strictEqual(count, 0);
        deepStrictEqual(map.get(new ID("first")), {
            raw: "inminecraft",
            resolved:
                "inminecraft resolved from minecraft:first and namespace is already default"
        });
        strictEqual(count, 1);
        deepStrictEqual(map.get(new ID("first", "namespace")), {
            raw: "notminecraft",
            resolved:
                "notminecraft resolved from namespace:first and inminecraft resolved from minecraft:first and namespace is already default"
        });
        strictEqual(count, 2);
        map.set(new ID("first"), "inminecraft2");
        deepStrictEqual(map.get(new ID("first", "namespace")), {
            raw: "notminecraft",
            resolved:
                "notminecraft resolved from namespace:first and inminecraft2 resolved from minecraft:first and namespace is already default"
        });
        strictEqual(count, 4);
        deepStrictEqual(map.get(new ID("first")), {
            raw: "inminecraft2",
            resolved:
                "inminecraft2 resolved from minecraft:first and namespace is already default"
        });
        strictEqual(count, 4);
    });
    interface Tag {
        refs: string[];
        values: string[];
    }

    function setupRecursive(
        resolver: ResolvedIDMap<Tag, string[]>["resolver"]
    ): ResolvedIDMap<Tag, string[]> {
        const map = new ResolvedIDMap(resolver);
        map.set(new ID("unrelated1"), {
            refs: [],
            values: ["unrelated1value"]
        });
        map.set(new ID("unrelated2"), {
            refs: [],
            values: ["unrelated2value"]
        });
        map.set(new ID("first"), {
            refs: ["second", "unrelated1"],
            values: ["firstvalue"]
        });
        map.set(new ID("second"), {
            refs: ["minecraft:first", "unrelated2"],
            values: ["secondvalue"]
        });
        return map;
    }
    it("should throw an error for recursion using get", () => {
        let count = 0;
        const map = setupRecursive((value, _id, thisMap) => {
            count++;
            const values = [...value.values];
            for (const path of value.refs) {
                const id = new ID(path);
                const result = thisMap.get(id);
                values.push(...result.resolved);
            }
            return values;
        });
        strictEqual(count, 0);
        deepStrictEqual(map.get(new ID("unrelated1")), {
            raw: {
                refs: [],
                values: ["unrelated1value"]
            },
            resolved: ["unrelated1value"]
        });
        strictEqual(count, 1);
        throws(() => map.get(new ID("first")));
        // "first", "second", <throws>
        strictEqual(count, 3);
    });
    it("should not throw an error for recursion using getCycle", () => {
        let count = 0;
        const map = setupRecursive((value, _id, thisMap) => {
            count++;
            const values = [...value.values];
            for (const path of value.refs) {
                const id = new ID(path);
                const result = thisMap.getCycle(id);
                if (ResolvedIDMap.isResolved(result)) {
                    values.push(...result.resolved);
                }
            }
            return values;
        });
        strictEqual(count, 0);
        deepStrictEqual(map.get(new ID("unrelated1")), {
            raw: {
                refs: [],
                values: ["unrelated1value"]
            },
            resolved: ["unrelated1value"]
        });
        strictEqual(count, 1);
        deepStrictEqual(map.get(new ID("unrelated1")), {
            raw: {
                refs: [],
                values: ["unrelated1value"]
            },
            resolved: ["unrelated1value"]
        });
        deepStrictEqual(map.get(new ID("first")), {
            raw: {
                refs: ["second", "unrelated1"],
                values: ["firstvalue"]
            },
            resolved: [
                "firstvalue",
                "secondvalue",
                "unrelated2value",
                "unrelated1value"
            ]
        });
        // "unrelated1 (from above)", "first", "second", "unrelated2", "unrelated1"
        strictEqual(count, 4);
        map.get(new ID("first"));
        strictEqual(count, 4);
    });
});
