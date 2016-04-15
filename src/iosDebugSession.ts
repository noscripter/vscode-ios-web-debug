/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import {ChromeDebugSession} from 'vscode-chrome-debug-core';
import {IOSDebugAdapter} from './iosDebugAdapter';

export class IOSDebugSession extends ChromeDebugSession {

    public constructor(targetLinesStartAt1: boolean, isServer: boolean = false) {
        let version = "iOS." + require('../../package.json').version;
        super(targetLinesStartAt1, isServer, new IOSDebugAdapter(), version);
    }
}
