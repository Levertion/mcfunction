import { deepStrictEqual, equal, ok, strictEqual } from "assert";
import { ID, IDMap, IDSet } from "../src";

describe("IDMap", () => {
    it("should allow insertion", () => {
        const map = new IDMap<number>();
        map.set(new ID("somePath"), 10);
        strictEqual(map.get(new ID("somePath", "minecraft")), 10);
        map.set(new ID("secondpath", "namespace"), 30);
        strictEqual(map.get(new ID("secondpath", "namespace")), 30);
        ok(map.has(new ID("secondpath", "namespace")));
        ok(!map.has(new ID("secondpath", "differentnamespace")));
        ok(map.delete(new ID("somePath")));
        ok(!map.delete(new ID("somePath")));
        strictEqual(map.get(new ID("somePath")), undefined);
    });
    it("should allow iteration", () => {
        const map = new IDMap<number>();
        map.set(new ID("somePath"), 10);
        map.set(new ID("secondpath", "namespace"), 30);
        map.set(new ID("someotherpath", "minecraft"), 40);

        deepStrictEqual(
            [...map],
            [
                [new ID("somePath", "minecraft"), 10],
                [new ID("someotherpath", "minecraft"), 40],
                [new ID("secondpath", "namespace"), 30]
            ]
        );
    });
});

describe("IDSet", () => {
    it("should allow adding", () => {
        const set = new IDSet();
        set.add(new ID("path"));
        ok(set.has(new ID("path", "minecraft")));
        ok(!set.has(new ID("path", "namespace")));
        set.add(new ID("path", "namespace"));
        ok(set.has(new ID("path", "namespace")));
        ok(!set.delete(new ID("somePath")));
        ok(set.delete(new ID("path", "namespace")));
        ok(!set.has(new ID("path", "namespace")));
    });
});
