import { ok } from "assert";
import { Err, isErr, isOk, Ok } from "../src";

describe("isErr", () => {
    it("should return true for any Ok value", () => {
        function testErr(value: any): void {
            ok(isErr(Err(value)), `isErr returned false for Err(${value})`);
        }
        // No reason to think any of these would fail, but it's always best to check.
        testErr(true);
        testErr(false);
        testErr(undefined);
        testErr(null);
        testErr(0);
        testErr(1);
        testErr("");
        testErr("non-empty string");
        testErr([]);
        testErr([true, "non-empty-array"]);
        testErr({});
        testErr({ key: "value" });

        testErr(0.1);
        testErr(Infinity);
        testErr(-Infinity);
    });
    it("should return false for any Err value", () => {
        function testOk(value: any): void {
            ok(!isErr(Ok(value)), `isErr returned true for Ok(${value})`);
        }
        // No reason to think any of these would fail, but it's always best to check.
        testOk(true);
        testOk(false);
        testOk(undefined);
        testOk(null);
        testOk(0);
        testOk(1);
        testOk("");
        testOk("non-empty string");
        testOk([]);
        testOk([true, "non-empty-array"]);
        testOk({});
        testOk({ key: "value" });

        testOk(0.1);
        testOk(Infinity);
        testOk(-Infinity);
    });
});
