/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import {Utilities} from 'debugger-for-chrome';
import * as path from 'path';

export function getProxyPath(): string {
    const platform = Utilities.getPlatform();
    if (platform === Utilities.Platform.Windows) {
        var proxy = path.resolve(__dirname, "../../node_modules/vs-libimobile/lib/ios_webkit_debug_proxy.exe");
        if (Utilities.existsSync(proxy)) {
            return proxy;
        }
    }
    return null;
}