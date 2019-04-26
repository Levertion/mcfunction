import { deepStrictEqual, ok } from "assert";
import { ID, IDSet } from "../src";

describe("IDSet", () => {
    it("should allow adding", () => {
        const set = new IDSet();
        set.add(new ID("path"));
        ok(set.has(new ID("minecraft:path")));
        ok(!set.has(new ID("namespace:path")));
        set.add(new ID("namespace:path"));
        ok(set.has(new ID("namespace:path")));
        ok(!set.delete(new ID("somePath")));
        ok(set.delete(new ID("namespace:path")));
        ok(!set.has(new ID("namespace:path")));
    });
    it("should allow iteration", () => {
        const set = new IDSet();
        set.add(new ID("somePath"));
        set.add(new ID("namespace:secondpath"));
        set.add(new ID("minecraft:someotherpath"));

        deepStrictEqual(
            [...set],
            [
                new ID("minecraft:somePath"),
                new ID("minecraft:someotherpath"),
                new ID("namespace:secondpath")
            ]
        );
    });
});
