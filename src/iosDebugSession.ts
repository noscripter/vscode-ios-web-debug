/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import {WebKitDebugSession} from 'debugger-for-chrome';
import {IOSDebugAdapter} from './iosDebugAdapter';

export class IOSDebugSession extends WebKitDebugSession {

    public constructor(targetLinesStartAt1: boolean, isServer: boolean = false) {
        let version = "iOS." + require('../../package.json').version;
        super(targetLinesStartAt1, isServer, new IOSDebugAdapter(), version);
    }
}
