# Minecraft ID

[ ![npm](https://img.shields.io/npm/v/minecraft-id.svg?style=flat-square) ![npm (tag)](https://img.shields.io/npm/v/minecraft-id/next.svg?style=flat-square) ![npm](https://img.shields.io/npm/dt/minecraft-id.svg?style=flat-square) ](http://npm.im/minecraft-id)
[![docs](https://img.shields.io/badge/docs-TypeDoc-blueviolet.svg?style=flat-square)](http://levertion.github.io/mcfunction/id)

Collections and definition of IDs from Minecraft.

In Minecraft, many resources can be referenced by an (optional) namespace and a
path, such as blocks and items (e.g. `minecraft:stone`/`stone`). This library
provides an `ID` class, which represents one of these references.

Additionally, it exposes two collections for `ID`s:

-   `IDMap<T>` is a simple mapping from `ID` to `T`;
-   `IDSet` is a `Set` of `ID`s;

This package is part of the
[`mcfunction-langserver`](https://github.com/Levertion/mcfunction) project.

## Examples

```ts
import { ID } from "minecraft-id";
import * as assert from "assert";

const myID = new ID("stone");
assert.strictEqual(`This is ${myID}`, "This is minecraft:stone");
assert.strictEqual(`This is ${myID}`, "This is minecraft:stone");
```
