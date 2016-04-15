/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
 
import {ChromeDebugSession} from 'vscode-chrome-debug-core';
import {IOSDebugSession} from './iosDebugSession';

ChromeDebugSession.run(IOSDebugSession);