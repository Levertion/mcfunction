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
<!-- TODO: set this up on Github -->

The packages are currently only tested using node 10, although this could be
changed should a compelling use case arise.

### npm packages

The plan is to release these packages on npm, once they are slightly more
mature. Ideally, they will be released automatically from the master branch
under the `next` npm tag, with certain releases cherry-picked for more general
release. This however requires some engineering work.

### License

Distributed under the terms of the [MIT License](LICENSE).

### Footnotes

<a id="footnote1">1</a>: This uses `npm`'s `preinstall` script stage, which
runs on every `npm install`. This runs `lerna bootstrap` rather than
`npm install`. TODO: Determine if this is a common pattern and should be
documented or should be dropped.