# Mcfunction (Tools for working with Minecraft commands)

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg?style=flat-square)](https://lernajs.io/)

This a refactored version of
[mcfunction-langserver](https://github.com/Levertion/mcfunction-langserver).

Tools for working with Minecraft commands. Current packages:

<!-- TODO: Make these packages -->
<!-- - minecraft-command-parser: A parser for Minecraft commands. -->
<!-- - mcfunction-server: A language server frontend to command-parser -->
<!-- - mcfunction-verifier: A command line frontend to command-parser, which tests -->
<!-- - editors/vscode: A vscode extension using mcfunction-langserver.
    TODO: Determine if this should be in this repository -->
<!-- mc-nbt-paths: TODO: Check if @MrYurihi will allow us to move this into this repository -->
<!-- minecraft-json-schemas: JSON schemas for the JSON files used by minecraft -->

-   binary-nbt: A serializer and deserializer for (binary) NBT data
-   minecraft-nbt-types: Typescript types for (some) Vanilla NBT files

### Development

This repository is developed as a monorepo using [lerna](https://lernajs.io/).
This is all managed transparently using npm scripts in the root package. For
example, `npm install` installs each packages's
dependencies<sup>[1](#footnote1)</sup>.

`npm run format:write` runs the [prettier](https://github.com/prettier/prettier)
formatter.

<!-- TODO: Consider whether it is worthwhile installing a pre-commit hook
using [husky](https://github.com/typicode/husky). -->

`npm test` runs the comprehensive <!-- TODO: Make this true :P --> test suite.
Any new additions must be tested where this is possible. More detail about each
package's testing strategy can be found in their respective `README.md`s

We use [bors](https://bors.tech/) to manage merging pull requests.

The packages are tested using node 10 and 8.

### Publishing strategy

The packages are automatically released on `npm` once the tests pass on the
master branch, under the `master` npm tag using lerna's
[conventional prerelease](https://github.com/lerna/lerna/blob/master/commands/version/README.md#--conventional-prerelease).
This are then
['graduated'](https://github.com/lerna/lerna/blob/master/commands/version/README.md#--conventional-graduate)
on a weekly Travis cron job. This may fail in a given week if a PR is merged at
the wrong time (i.e just before the cron job)

### License

Distributed under the terms of the [MIT License](LICENSE).

<!-- json-schemas and nbt-paths are instead licensed under creative commons licenses -->

### Footnotes

<a id="footnote1">1</a>: This uses `npm`'s `preinstall` script stage, which runs
on every `npm install`. This runs `lerna bootstrap` rather than `npm install`.
TODO: Determine if this is a common pattern and should be documented or should
be dropped.
