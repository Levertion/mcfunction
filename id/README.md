# Minecraft ID

[ ![npm](https://img.shields.io/npm/v/minecraft-id.svg?style=flat-square) ![npm (tag)](https://img.shields.io/npm/v/minecraft-id/next.svg?style=flat-square) ![npm](https://img.shields.io/npm/dt/minecraft-id.svg?style=flat-square) ](http://npm.im/minecraft-id)
[![docs](https://img.shields.io/badge/docs-TypeDoc-blueviolet.svg?style=flat-square)](http://levertion.github.io/mcfunction/id)

Collections and definition of IDs from Minecraft.

In Minecraft, many resources can be referenced by an (optional) namespace and a
path, such as blocks and items (e.g. `minecraft:stone`/`stone`). This library
provides an `ID` class, which represents one of these references.

Additionally, it exposes three collections for `ID`s:

-   `IDMap<T>` is a simple mapping from `ID` to `T`;
-   `IDSet` is a `Set` of `ID`s;
-   `ResolvedIDMap<T, R>` is a mapping from `ID` to `T`, but with support for
    lazy, cached 'resolving' from that value of `T` to an `R`. For example, this
    could be used to resolve a tag such as `#minecraft:skeletons` into its
    actual values, even if it contains references to other tags.

N.B. In most cases it is likely to be more useful to perform this resolving
stage when the `T` values are first submitted, for cases such as error
reporting. However, `ResolvedIDMap` may still be useful in these cases as it
tracks dependents, so if an item is later modified only its dependents need to
be re-resolved. `ResolvedIDMap::resolveDeps` should be called.

## Examples

```ts
import { ID } from "minecraft-id";
import * as assert from "assert";

const myID = new ID("stone");
assert.strictEqual(`This is ${myID}`, "This is minecraft:stone");
assert.strictEqual(`This is ${myID}`, "This is minecraft:stone");
```
