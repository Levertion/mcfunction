# Binary NBT

[ ![npm](https://img.shields.io/npm/v/binary-nbt.svg?style=flat-square) ![npm (tag)](https://img.shields.io/npm/v/binary-nbt/master.svg?style=flat-square) ![npm](https://img.shields.io/npm/dt/binary-nbt.svg?style=flat-square) ](http://npm.im/binary-nbt)
[![docs](https://img.shields.io/badge/docs-TypeDoc-blueviolet.svg?style=flat-square)](https://levertion.github.io/mcfunction/binary-nbt)

<!-- Force update -->

A serializer and deserializer for Minecraft's [NBT](https://wiki.vg/NBT)
archives with a lossless but ergonomic output format.

This also contains a command line tool to convert an NBT file to JSON, called
`binary-nbt`

Lossless here means that a value can be deserialized from NBT and then
serialized back into exactly the same NBT value (i.e. the types from the NBT can
be recovered). Ergonomic means that the deserialized value can be treated as a
plain JavaScript object. E.g. `level.Data.allowCommands` works as expected for a
`level.dat` file. Other libraries such as
[`nbt`](https://www.npmjs.com/package/nbt) use custom objects, e.g.
`{value: <...>, type: TAG_COMPOUND}`.This is possible through the use of ES6
[`Symbol`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)s -
every deserialized object has `NBTTypeSymbol` applied to it, which is used in
serialisation (with sensible defaults for when this is not provided). This
approach
[also works for primitives](https://stackoverflow.com/questions/42560540/what-happens-when-i-object-assign-to-a-primitive-type-in-javascript).
The primary disadvantage of this approach is that the produced value cannot be
safely serialised into any form other than NBT without losing the data required
to reconstruct the NBT. However, if such serialisation is required, NBT can be
used as the format!

`TAG_LONG`s are deserialized as `Long`s from the
[`long`](https://www.npmjs.com/package/long) package.

This library currently only supports NodeJS 8 and 10. Other javascript
environments may be supported, should the need arise. Open an issue if you are
interested. We also only support big endian NBT, so the pocket edition nbt is
not yet supported

This package is part of the
[`mcfunction-langserver`](https://github.com/Levertion/mcfunction) project. It
is published automatically - see
[the publishing strategy](https://github.com/Levertion/mcfunction#publishing-strategy)

## API

### Deserialization

Basic usage:

```ts
function deserializeNBTUncompressed(buffer: Buffer): any;
```

```js
const { deserializeNBTUncompressed } = require("binary-nbt");
const fs = require("fs");

const contents = fs.readFileSync("some_nbt.nbt");
console.log(deserializeNBTUncompressed(contents));
```

Or in Typescript:

```ts
const { deserializeNBTUncompressed } = require("binary-nbt");
const fs = require("fs");

const contents = fs.readFileSync("level.dat");
const level: Level = deserializeNBTUncompressed(contents);
```

### Command line

The command line tool converts NBT values to JSON, whether compressed or not:

```
$ binary-nbt --help
binary-nbt

Usage:
  $ binary-nbt [...files]

Commands:
  [...files]  Convert files from NBT into JSON, outputting them to stdout.
If a directory is passed, it is recursively walked for files

For more info, run any command with the `--help` flag:
  $ binary-nbt --help

Options:
  -o, --out [dir]        Place the resulting files into this directory instead
  -e, --extension [ext]  Extension to output the JSON files in (default: .json)
  -h, --help             Display this message

Examples:
binary-nbt some_dir file.nbt file.nbt.gz --output .
binary-nbt some_dir -o result

```

## Comparison with alternatives

This library is yet another NBT library amongst the wide selection of existing
JavaScript NBT libraries. A comparison with a selection of the others is below.
The primary advantages of this library are the use of `Promise`s, vanilla
JavaScript classes (e.g. `Number`, `String`) which can be treated as primitives
in most cases, and Typescript type definitions. We also have full
[API documentation](https://levertion.github.io/mcfunction/binary-nbt) generated
using [TypeDoc](https://typedoc.org/).

A brief rundown of the differences between other packages and this one are
below. For example, if they don't support little endian NBT, no attention is
brought to that fact as it is not a difference from this package. These packages
are described in the order they appear in when searching for
[`nbt` on npm](https://www.npmjs.com/search?q=nbt).

### [`nbt`](https://www.npmjs.com/package/nbt):

-   Has a very desirable name on `npm`;
-   Data can be safely serialised and deserialized into formats other than NBT;
-   Supports the browser
-   Has good [API documentation](http://sjmulder.github.io/nbt-js/), although
    the following two points aren't well signposted;
-   Every value is wrapped in an unwieldy
    `{value: <actual value>, type: <type>}` object;
-   `TAG_LONGS`s are encoded as an `[upper, upper]` number array, without any
    convenience APIs;
-   Doesn't have `Typescript` type definitions available;
-   Doesn't use `Promise`s (this can be circumvented using `util.promisify`);

### [`prismarine-nbt`](https://www.npmjs.com/package/prismarine-nbt)

-   Supports little endian NBT;
-   Uses same format as `nbt` for longs and other values;
-   Has weak API documentation and no `Typescript` type definitions;
-   Doesn't use `Promise`s;

### [`nbt-ts`](https://www.npmjs.com/package/nbt-ts)

-   Uses `BigInt`s for longs, so only supports Node 10;
-   Custom classes are used for numbers, so the value must be accessed using the
    `value` property;

### Excluded packages

Some packages are not up-to-date with the latest version of NBT or are not NBT
packages and so are excluded. These are:

-   [`node-nbt`](https://www.npmjs.com/package/node-nbt),
    [`mcnbt`](https://www.npmjs.com/package/mcnbt),
    [`nbt-js`](https://www.npmjs.com/package/nbt-js),
    [minecraft-nbt](https://www.npmjs.com/package/minecraft-nbt): No support for
    `TAG_LONG_ARRAY`
-   [`mc-schematic`](https://www.npmjs.com/package/mc-schematic),
    [`minecraft-schematic`](https://www.npmjs.com/package/minecraft-schematic):
    Not packages for arbritrary NBT data - provide a APIs for schematics.
-   [`nibbit`](https://www.npmjs.com/package/nibbit),
    [`nibbit-nolong`](https://www.npmjs.com/package/nibbit-nolong): No support
    for longs or long arrays.
-   [`nbtviewer`](https://www.npmjs.com/package/nbtviewer): An NBT cli, not a
    package
-   [`mcpe-anvil`](https://www.npmjs.com/package/mcpe-anvil): Just uses
    `prismarine-nbt` internally.
-   [`@nbxx/nb-table`](https://www.npmjs.com/package/@nbxx/nb-table),
    [`nbtemplates`](https://www.npmjs.com/package/nbtemplates) and
    [`nbtc`](https://www.npmjs.com/package/nbtc): Unrelated to Minecraft NBT

## Changelog

The
[changelog](https://github.com/Levertion/mcfunction/blob/master/binary-nbt/CHANGELOG.md)
contains a list of all the changes between versions
