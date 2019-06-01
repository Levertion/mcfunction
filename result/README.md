# Simple Result

[ ![npm](https://img.shields.io/npm/v/simple-result.svg?style=flat-square) ![npm (tag)](https://img.shields.io/npm/v/simple-result/next.svg?style=flat-square) ![npm](https://img.shields.io/npm/dt/simple-result.svg?style=flat-square) ](http://npm.im/simple-result)
[![docs](https://img.shields.io/badge/docs-TypeDoc-blueviolet.svg?style=flat-square)](http://levertion.github.io/mcfunction/result)

Yet another `Result` type, inspired by Rust. This type allows you to encode a
logical success or failure when it still may be useful to return a value.

For example, in some string parsing situations, it is useful to be able to parse
from a list of options. In this case, a success would mean that the parsed
string was one of the options, whereas a failure would imply that it wasn't. In
this case, the parsed string could still be returned, such as to construct a
more specific error message.

This package is part of the
[`mcfunction-langserver`](https://github.com/Levertion/mcfunction) project. It
is published automatically - see
[the publishing strategy](https://github.com/Levertion/mcfunction/tree/lerna-prerelease#publishing-strategy)

## Example

```ts
import { Ok, Err, Result } from "simple-result";
import * as assert from "assert";

const value = Ok("Hello");
assert(isOk(value));
assert(!isErr(value));

function parse_from_option(
    parser: Parser,
    options: string[]
): Result<string, string | undefined>;
```
