/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
 
import {ChromeDebugAdapter, Utils} from 'vscode-chrome-debug-core';
import * as iosUtils from './utilities';
import {spawn, ChildProcess} from 'child_process';

export class IOSDebugAdapter extends ChromeDebugAdapter {
    private _proxyProc: ChildProcess;
    
    public constructor() {
        super();
    }
    
    public attach(args: any): Promise<void> {
        if (args.port == null) {
            return Utils.errP('The "port" field is required in the attach config.');
        }

        this.initializeLogging('attach-ios', args);
        
        // Check exists?
        const proxyPath = args.proxyExecutable || iosUtils.getProxyPath();
        if (!proxyPath) {
            if (Utils.getPlatform() != Utils.Platform.Windows) {
                return Utils.errP(`No iOS proxy was found. Install an iOS proxy (https://github.com/google/ios-webkit-debug-proxy) and specify a valid 'proxyExecutable' path`);
            } else {
                return Utils.errP(`No iOS proxy was found. Run 'npm install -g vs-libimobile' and specify a valid 'proxyExecutable' path`);
            }
        }

        // Grab the specified device name, or default to * (which means first)
        const optionalDeviceName = args.deviceName || "*";

        // Start with remote debugging enabled
        const proxyPort = args.port || 9222;
        const proxyArgs: string[] = [];

        // Use default parameters for the ios_webkit_debug_proxy executable
        if (!args.proxyExecutable) {
            proxyArgs.push('--no-frontend');

            // Set the ports available for devices
            proxyArgs.push('--config=null:' + proxyPort + ',:' + (proxyPort + 1) + '-' + (proxyPort + 101));
        }

        if (args.proxyArgs) {
            // Add additional parameters
            proxyArgs.push(...args.proxyArgs);
        }

        Utils.Logger.log(`spawn('${proxyPath}', ${JSON.stringify(proxyArgs) })`);
        this._proxyProc = spawn(proxyPath, proxyArgs, {
            detached: true,
            stdio: ['ignore']
        });
        (<any>this._proxyProc).unref();
        this._proxyProc.on('error', (err) => {
            Utils.Logger.log('device proxy error: ' + err);
            Utils.Logger.log('Do you have the iTunes drivers installed?');
            this.terminateSession();
        });
              
        return this._attachToDevice(proxyPort, optionalDeviceName).then((devicePort: number) => {
            let attachArgs = {
                port: devicePort,
                cwd: ""
            };
            return super.attach(attachArgs);
        });
    }
    
    public clearEverything(): void {
        if (this._proxyProc) {  
            this._proxyProc.kill('SIGINT');  
            this._proxyProc = null;  
        }  

        super.clearEverything();
    }
    
    private _attachToDevice(proxyPort: number, deviceName: string): Promise<number> {
        // Attach to a device over the proxy
        return Utils.getURL(`http://localhost:${proxyPort}/json`).then(jsonResponse => {
            let devicePort = proxyPort;
            
            try {
                const responseArray = JSON.parse(jsonResponse);
                if (Array.isArray(responseArray)) {
                    let devices = responseArray.filter(deviceInfo => deviceInfo && deviceInfo.url && deviceInfo.deviceName);

                    // If a device name was specified find the matching one
                    if (deviceName !== "*") {
                        const matchingDevices = devices.filter(deviceInfo => deviceInfo.deviceName && deviceInfo.deviceName.toLowerCase() === deviceName.toLowerCase());
                        if (!matchingDevices.length) {
                            Utilities.Logger.log(`Warning: Can't find a device with deviceName: ${deviceName}. Available devices: ${JSON.stringify(devices.map(d => d.deviceName))}`, true);
                        } else {
                            devices = matchingDevices;
                        }
                    }

                    if (devices.length) {
                        if (devices.length > 1 && deviceName !== "*") {
                            Utilities.Logger.log(`Warning: Found more than one valid target device. Attaching to the first one. Available devices: ${JSON.stringify(devices.map(d => d.deviceName))}`, true);
                        }

                        // Get the port for the actual device endpoint
                        const deviceUrl: string = devices[0].url;
                        if (deviceUrl) {
                            const portIndex = deviceUrl.indexOf(':');
                            if (portIndex > -1) {
                                devicePort = parseInt(deviceUrl.substr(portIndex + 1), 10);
                            }
                        }
                    }
                }
            }
            catch (e) {
                // JSON.parse can throw
            }
            
            return devicePort;
        },
        e => {
            return Utilities.errP('Cannot connect to the proxy: ' + e.message);
        });
    }
}
