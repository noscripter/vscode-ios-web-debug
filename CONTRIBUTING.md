## Development setup
We welcome any quality bugfixes or contributions!

To avoid a conflict, delete the installed extension at `~/.vscode/extensions/msjsdiag.debugger-for-ios-web`.

### Windows
* In `C:/Users/<username>/.vscode/extensions/`, `git clone` this repository

### OS X/Linux
* `git clone` this repository
* Run `ln -s <path to repo> ~/.vscode/extensions/vscode-ios-web-debug`
* You could clone it to the extensions directory if you want, but working with hidden folders in OS X can be a pain.

### Then...
* `cd` to the folder you just cloned
* Run `npm install -g gulp` and `npm install`
    * You may see an error if `bufferutil` or `utf-8-validate` fail to build. These native modules required by `vscode-chrome-debug-core` are optional and the adapter should work fine without them.
* Run `gulp build`

### Getting the proxy
* You'll need to also follow the readme instructions for getting the safari -> chrome proxy installed and running before debugging

## Debugging
In VS Code, run the `launch as server` launch config - it will start the adapter as a server listening on port 4712. In your test app launch.json, include this flag at the top level: `"debugServer": "4712"`. Then you'll be able to debug the adapter in the first instance of VS Code, in its original TypeScript, using sourcemaps.

## Testing
There is a set of mocha tests which can be run with `gulp test` or with the `test` launch config. Also run `gulp tslint` to check your code against our tslint rules.

See the project under testapp/ for a bunch of test scenarios crammed onto one page.

## Naming
Client: VS Code
Target: The debuggee, which implements the Chrome Debug Protocol
Server-mode: In the normal use-case, the extension does not run in server-mode. For debugging, you can run it as a debug server - see the 'Debugging' section above.
