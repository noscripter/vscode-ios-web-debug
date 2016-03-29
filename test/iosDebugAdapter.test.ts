/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as mockery from 'mockery';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {Utilities, WebKitDebugAdapter} from 'debugger-for-chrome';

/** Not mocked - use for type only */
import {IOSDebugAdapter as _IOSDebugAdapter} from '../src/iosDebugAdapter';

const MODULE_UNDER_TEST = '../src/iosDebugAdapter';
suite('IOSDebugAdapter', () => {
    function createAdapter(): _IOSDebugAdapter {
        const IOSDebugAdapter: typeof _IOSDebugAdapter = require(MODULE_UNDER_TEST).IOSDebugAdapter;
        return new IOSDebugAdapter();
    };

    setup(() => {
        mockery.enable({ useCleanCache: true, warnOnReplace: false });
        mockery.registerAllowables([MODULE_UNDER_TEST, './utilities', 'path', 'child_process']);

        // Stub wrapMethod to create a function if it doesn's already exist
        let originalWrap = (<any>sinon).wrapMethod;
        sinon.stub(sinon, 'wrapMethod', function(...args) {
            if (!args[0][args[1]]) {
                args[0][args[1]] = () => { };
            }
            return originalWrap.apply(this, args);
        });
    });

    teardown(() => {
        (<any>sinon).wrapMethod.restore();

        mockery.deregisterAll();
        mockery.disable();
    });

    suite('attach()', () => {
        suite('no port', () => {
            test('if no port, rejects the attach promise', done => {
                mockery.registerMock('debugger-for-chrome', {
                    WebKitDebugAdapter: () => { },
                    Utilities: Utilities
                });

                const adapter = createAdapter();
                return adapter.attach({}).then(
                    () => assert.fail('Expecting promise to be rejected'),
                    e => done()
                );
            });
        });

        suite('valid port', () => {
            let adapterMock;
            let utilitiesMock;
            let cpMock;
            let MockUtilities;
            setup(() => {
                class MockAdapter { };
                class MockChildProcess { };
                MockUtilities = {
                    Platform: { Windows: 0, OSX: 1, Linux: 2 },
                    Logger: { log: () => { } }
                };

                mockery.registerMock('debugger-for-chrome', {
                    WebKitDebugAdapter: MockAdapter,
                    Utilities: MockUtilities
                });
                mockery.registerMock('child_process', MockChildProcess);

                adapterMock = sinon.mock(MockAdapter.prototype);
                adapterMock.expects('initializeLogging').once();

                utilitiesMock = sinon.mock(MockUtilities);
                sinon.stub(MockUtilities, 'errP', () => Promise.reject(''));

                cpMock = sinon.mock(MockChildProcess);
            });

            teardown(() => {
                adapterMock.verify();
                utilitiesMock.verify();
                cpMock.verify();
            });

            test('if no proxy, returns error on osx', done => {
                sinon.stub(MockUtilities, 'getPlatform', () => MockUtilities.Platform.OSX);

                const adapter = createAdapter();
                return adapter.attach({ port: 1234 }).then(
                    () => assert.fail('Expecting promise to be rejected'),
                    e => {
                        adapterMock.verify();
                        return done();
                    }
                );
            });

            test('if no proxy, returns error on linux', done => {
                sinon.stub(MockUtilities, 'getPlatform', () => MockUtilities.Platform.Linux);

                const adapter = createAdapter();
                return adapter.attach({ port: 1234 }).then(
                    () => assert.fail('Expecting promise to be rejected'),
                    e => {
                        adapterMock.verify();
                        return done();
                    }
                );
            });

            test('if no proxy, returns error on windows', done => {
                sinon.stub(MockUtilities, 'getPlatform', () => MockUtilities.Platform.Windows);
                sinon.stub(MockUtilities, 'existsSync', () => false);

                const adapter = createAdapter();
                return adapter.attach({ port: 1234 }).then(
                    () => assert.fail('Expecting promise to be rejected'),
                    e => {
                        adapterMock.verify();
                        return done();
                    }
                );
            });

            test('if valid port and proxy path, spawns the proxy', done => {
                sinon.stub(MockUtilities, 'getPlatform', () => MockUtilities.Platform.Windows);
                sinon.stub(MockUtilities, 'existsSync', () => true);
                utilitiesMock.expects('getURL').returns(Promise.reject(''));

                cpMock.expects('spawn').once().returns({ unref: () => { }, on: () => { } });

                const adapter = createAdapter();
                return adapter.attach({ port: 1234 }).then(
                    () => assert.fail('Expecting promise to be rejected'),
                    e => {
                        adapterMock.verify();
                        utilitiesMock.verify();
                        cpMock.verify();
                        return done();
                    }
                );
            });
        });

        suite('device', () => {
            let adapterMock;
            let utilitiesMock;
            let cpMock;
            setup(() => {
                class MockAdapter { };
                class MockChildProcess { };
                var MockUtilities = {
                    Platform: { Windows: 0, OSX: 1, Linux: 2 },
                    Logger: { log: () => { } }
                };

                mockery.registerMock('debugger-for-chrome', {
                    WebKitDebugAdapter: MockAdapter,
                    Utilities: MockUtilities
                });
                mockery.registerMock('child_process', MockChildProcess);

                adapterMock = sinon.mock(MockAdapter.prototype);
                adapterMock.expects('initializeLogging').once();

                utilitiesMock = sinon.mock(MockUtilities);

                cpMock = sinon.mock(MockChildProcess);
                cpMock.expects('spawn').once().returns({ unref: () => { }, on: () => { } });
            });

            teardown(() => {
                adapterMock.verify();
                utilitiesMock.verify();
                cpMock.verify();
            });

            test('if no proxy data, returns the proxy port', done => {
                let proxyPort = 1234;
                let deviceInfo = [];
                utilitiesMock.expects('getURL').returns(Promise.resolve(JSON.stringify(deviceInfo)));

                adapterMock.expects('attach').withArgs({
                    port: proxyPort,
                    cwd: ''
                }).returns(Promise.resolve(''));

                const adapter = createAdapter();
                return adapter.attach({ port: proxyPort, proxyExecutable: 'test.exe' }).then(
                    done(),
                    e => assert.fail('Expecting promise to succeed')
                );
            });

            test('if valid proxy data, returns the first device port', done => {
                let proxyPort = 1234;
                let devicePort = 9999;
                let deviceInfo = [
                    {
                        url: 'localhost:' + devicePort,
                        deviceName: 'iphone1'
                    },
                    {
                        url: 'localhost:' + (devicePort + 1),
                        deviceName: 'iphone2'
                    }
                ];
                utilitiesMock.expects('getURL').returns(Promise.resolve(JSON.stringify(deviceInfo)));

                adapterMock.expects('attach').withArgs({
                    port: devicePort,
                    cwd: ''
                }).returns(Promise.resolve(''));

                const adapter = createAdapter();
                return adapter.attach({ port: proxyPort, proxyExecutable: 'test.exe' }).then(
                    done(),
                    e => assert.fail('Expecting promise to succeed')
                );
            });

            test('if valid proxy data and unknown deviceName, returns the first device port', done => {
                let proxyPort = 1234;
                let devicePort = 9999;
                let deviceInfo = [
                    {
                        url: 'localhost:' + devicePort,
                        deviceName: 'iphone1'
                    },
                    {
                        url: 'localhost:' + (devicePort + 1),
                        deviceName: 'iphone2'
                    }
                ];
                utilitiesMock.expects('getURL').returns(Promise.resolve(JSON.stringify(deviceInfo)));

                adapterMock.expects('attach').withArgs({
                    port: devicePort,
                    cwd: ''
                }).returns(Promise.resolve(''));

                const adapter = createAdapter();
                return adapter.attach({ port: proxyPort, proxyExecutable: 'test.exe', deviceName: 'nophone' }).then(
                    done(),
                    e => assert.fail('Expecting promise to succeed')
                );
            });

            test('if valid proxy data and * deviceName, returns the first device port', done => {
                let proxyPort = 1234;
                let devicePort = 9999;
                let deviceInfo = [
                    {
                        url: 'localhost:' + devicePort,
                        deviceName: 'iphone1'
                    },
                    {
                        url: 'localhost:' + (devicePort + 1),
                        deviceName: 'iphone2'
                    }
                ];
                utilitiesMock.expects('getURL').returns(Promise.resolve(JSON.stringify(deviceInfo)));

                adapterMock.expects('attach').withArgs({
                    port: devicePort,
                    cwd: ''
                }).returns(Promise.resolve(''));

                const adapter = createAdapter();
                return adapter.attach({ port: proxyPort, proxyExecutable: 'test.exe', deviceName: '*' }).then(
                    done(),
                    e => assert.fail('Expecting promise to succeed')
                );
            });

            test('if valid proxy data and valid deviceName, returns the matching device port', done => {
                let proxyPort = 1234;
                let devicePort = 9999;
                let deviceInfo = [
                    {
                        url: 'localhost:' + devicePort,
                        deviceName: 'iphone1'
                    },
                    {
                        url: 'localhost:' + (devicePort + 1),
                        deviceName: 'iphone2'
                    }
                ];
                utilitiesMock.expects('getURL').returns(Promise.resolve(JSON.stringify(deviceInfo)));

                adapterMock.expects('attach').withArgs({
                    port: devicePort + 1,
                    cwd: ''
                }).returns(Promise.resolve(''));

                const adapter = createAdapter();
                return adapter.attach({ port: proxyPort, proxyExecutable: 'test.exe', deviceName: 'IPHonE2' }).then(
                    done(),
                    e => assert.fail('Expecting promise to succeed')
                );
            });
        });
    });
});
