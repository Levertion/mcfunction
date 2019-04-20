import { deepStrictEqual, strictEqual } from "assert";
import { ID } from "../src";

describe("ID", () => {
    it("should have the namespace and path set to the specified value in the constructor", () => {
        function testConstructor(path: string, namespace?: string) {
            const id = new ID(path, namespace);
            strictEqual(id.namespace, namespace);
            strictEqual(id.path, path);
        }
        testConstructor("onlypath");
        testConstructor("path", "andnamespace");
        testConstructor("CAPS", "andLowercase");
        testConstructor("CAPSTOO");
        testConstructor("path", "minecraft");
    });
    it("should be correctly parsed from a string", () => {
        function testFromString(
            toParse: string,
            path: string,
            namespace?: string,
            sep?: string
        ) {
            deepStrictEqual(
                ID.fromString(toParse, sep),
                new ID(path, namespace)
            );
        }
        testFromString("path", "path");
        testFromString("stone", "stone");
        testFromString("path", "path", undefined, ".");
        testFromString(":path", "path");
        testFromString(":granite", "granite");
        testFromString(".path", "path", undefined, ".");

        testFromString("namespace:path", "path", "namespace");
        testFromString("namespace.path", "path", "namespace", ".");
        testFromString("namespace:functionname", "functionname", "namespace");
        testFromString("minecraft:path", "path", "minecraft");
        testFromString("minecraft:advancement", "advancement", "minecraft");
        testFromString("minecraft.path", "path", "minecraft", ".");

        // Longer seperator. Never used in Vanilla.
        testFromString("##path", "path", undefined, "##");
        testFromString("namespace##path", "path", "namespace", "##");
        testFromString("minecraft##path", "path", "minecraft", "##");
    });
    it("should be correctly stringified", () => {
        function testToString(
            expected: string,
            path: string,
            namespace?: string
        ) {
            strictEqual(new ID(path, namespace).toString(), expected);
        }
        testToString("minecraft:path", "path");
        testToString("minecraft:path", "path", "minecraft");
        testToString("namespace:path", "path", "namespace");
        testToString("namespace:different", "different", "namespace");
    });
    it("should give the correct output from isNamespaceDefault", () => {
        function testDefault(
            expected: boolean,
            namespace?: string,
            path: string = "path"
        ) {
            strictEqual(new ID(path, namespace).isNamespaceDefault(), expected);
        }
        testDefault(true);
        testDefault(true, "minecraft");
        testDefault(true, "minecraft", "otherpath");
        testDefault(true, undefined, "otherpath");

        testDefault(false, "namespace");
        testDefault(false, "namespace", "otherpath");
    });
    it("should give the correct output for sameNamespace", () => {
        function testSame(
            expected: boolean,
            namespace1?: string,
            namespace2?: string,
            path1: string = "PATH",
            path2: string = "PATH2"
        ) {
            const first = new ID(path1, namespace1);
            const second = new ID(path2, namespace2);
            strictEqual(first.sameNamespace(second), expected);
            // And the other way around
            strictEqual(second.sameNamespace(first), expected);
        }
        testSame(true);
        testSame(true, "minecraft");
        testSame(true, "minecraft", "minecraft");
        testSame(true, "minecraft", "minecraft", "otherpath1", "otherpath2");
        testSame(true, undefined, "minecraft", "otherpath1", "otherpath2");
        testSame(true, undefined, undefined, "otherpath1", "otherpath2");

        testSame(false, "namespace");
        testSame(false, "namespace", undefined, "otherpath1", "otherpath2");
        testSame(false, "namespace", "minecraft");
        testSame(false, "namespace", "othernamespace");
    });
    it("should give the correct output for equals", () => {
        function testEqual(
            expected: boolean,
            path1: string,
            path2: string,
            namespace1?: string,
            namespace2?: string
        ) {
            const first = new ID(path1, namespace1);
            const second = new ID(path2, namespace2);
            strictEqual(first.equals(second), expected);
            // And the other way around
            strictEqual(second.equals(first), expected);
        }
        testEqual(true, "path", "path");
        testEqual(true, "path", "path", "minecraft");
        testEqual(true, "path", "path", "minecraft", "minecraft");
        testEqual(false, "path", "path", "namespace");
        testEqual(true, "path", "path", "namespace", "namespace");
        testEqual(false, "path", "otherpath");
        testEqual(false, "path", "otherpath", "minecraft");
        testEqual(false, "yetanotherpath", "otherpath", "minecraft");
        testEqual(
            false,
            "yetanotherpath",
            "otherpath",
            "namespace",
            "namespace2"
        );
    });
});
