# Development setup
This project uses Yarn 3.x, so requires some additional setup for usage with certain IDEs.

For VSCode, run
```
yarn dlx @yarnpkg/sdks vscode
```

And make sure to switch to the workspace typescript version:

1.Press `ctrl+shift+p` in a TypeScript file
2. Choose "Select TypeScript Version"
3. Pick "Use Workspace Version"

For more information and instructions on configuring other editors, see [https://yarnpkg.com/getting-started/editor-sdks]().

## Install packages
```
yarn
```

## Run tests
```
yarn test
```
