import { deepStrictEqual, strictEqual } from "assert";
import { ID, IDSet, ResolvedIDMap } from "../src";

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
    // TODO: Test throwing an error with cycles
});
