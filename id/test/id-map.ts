import { deepStrictEqual, ok, strictEqual } from "assert";
import { ID, IDMap } from "../src";

describe("IDMap", () => {
    it("should allow insertion", () => {
        const map = new IDMap<number>();
        map.set(new ID("somePath"), 10);
        strictEqual(map.get(new ID("minecraft:somePath")), 10);
        map.set(new ID("namespace:secondpath"), 30);
        strictEqual(map.get(new ID("namespace:secondpath")), 30);
        ok(map.has(new ID("namespace:secondpath")));
        ok(!map.has(new ID("differentnamespace:secondpath")));
        ok(map.delete(new ID("somePath")));
        ok(!map.delete(new ID("somePath")));
        strictEqual(map.get(new ID("somePath")), undefined);
    });
    it("should allow iteration", () => {
        const map = new IDMap<number>();
        map.set(new ID("somePath"), 10);
        map.set(new ID("namespace:secondpath"), 30);
        map.set(new ID("minecraft:someotherpath"), 40);

        deepStrictEqual(
            [...map],
            [
                [new ID("minecraft:somePath"), 10],
                [new ID("minecraft:someotherpath"), 40],
                [new ID("namespace:secondpath"), 30]
            ]
        );
    });
});
