/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import {Utils} from 'vscode-chrome-debug-core';
import * as path from 'path';

export function getProxyPath(): string {
    const platform = Utils.getPlatform();
    if (platform === Utils.Platform.Windows) {
        var proxy = path.resolve(__dirname, "../../node_modules/vs-libimobile/lib/ios_webkit_debug_proxy.exe");
        if (Utils.existsSync(proxy)) {
            return proxy;
        }
    }
    return null;
}