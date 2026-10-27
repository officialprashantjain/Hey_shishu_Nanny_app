const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const realAxios = require('axios');
const root = path.resolve(__dirname, '..');

function harness({ saved = new Map(), platform = 'android', native = false, adapter = async () => ({ status: 200, data: {} }), storageError = false } = {}) {
  const modules = new Map();
  const calls = [], notifications = [], nativeEvents = {}, cancelled = [];
  let backgroundMessage, backgroundEvent, foregroundEvent;
  const secure = {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'after-first-unlock',
    getItemAsync: async (key) => { if (storageError) throw new Error('Keychain unavailable'); return saved.get(key) || null; },
    setItemAsync: async (key, value) => { if (storageError) throw new Error('Keychain unavailable'); saved.set(key, value); },
    deleteItemAsync: async (key) => saved.delete(key),
  };
  const axios = { create: (config) => realAxios.create({ ...config, baseURL: 'https://example.test/api', adapter: async (request) => {
    const body = typeof request.data === 'string' ? JSON.parse(request.data) : request.data;
    calls.push({ url: request.url, authorization: request.headers.Authorization, body });
    const result = await adapter(request, body);
    if (result.status >= 400) throw new realAxios.AxiosError('Request failed', 'ERR_BAD_REQUEST', request, null, { ...result, config: request });
    return { ...result, config: request, headers: {} };
  } }) };
  const notifee = { createChannel: async () => {}, requestPermission: async () => {}, displayNotification: async (data) => { notifications.push(data); },
    cancelNotification: async (id) => cancelled.push(id), stopForegroundService: async () => {},
    onBackgroundEvent: (listener) => { backgroundEvent = listener; }, onForegroundEvent: (listener) => { foregroundEvent = listener; },
    registerForegroundService: () => {}, getInitialNotification: async () => null };
  const messagingObject = { setBackgroundMessageHandler: (listener) => { backgroundMessage = listener; }, onMessage: () => {},
    requestPermission: async () => {}, getToken: async () => 'real-fcm-device-token', onTokenRefresh: () => () => {}, isDeviceRegisteredForRemoteMessages: true };
  const callKeep = { addEventListener: (name, listener) => { nativeEvents[name] = listener; }, clearInitialEvents: () => {},
    reportEndCallWithUUID: (id, reason) => cancelled.push({ id, reason }), answerIncomingCall: () => {}, startCall: () => {}, reportConnectedOutgoingCallWithUUID: () => {}, displayIncomingCall: () => {} };
  const voip = { addEventListener: (name, listener) => { nativeEvents[`voip:${name}`] = listener; } };
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} }; modules.set(filename, module);
    const requireMock = (name) => {
      if (name === 'expo-camera') return { Camera: { requestMicrophonePermissionsAsync: async () => ({ granted: true }) } };
      if (name === 'expo-av') return { Audio: { setAudioModeAsync: async () => {} } };
      if (name === 'expo-secure-store') return secure;
      if (name === 'axios') return axios;
      if (name === 'react-native') return { PermissionsAndroid: { PERMISSIONS: { RECORD_AUDIO: 'mic', CAMERA: 'camera' }, RESULTS: { GRANTED: 'granted' }, requestMultiple: async (permissions) => Object.fromEntries(permissions.map((value) => [value, 'granted'])) }, Alert: { alert: () => {} }, NativeModules: {}, Platform: { OS: platform }, AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) }, StyleSheet: { create: (s) => s } };
      if (name === 'expo-constants') return { __esModule: true, default: { executionEnvironment: native ? 'bare' : 'storeClient' } };
      if (name === '@notifee/react-native') return { __esModule: true, default: notifee, EventType: { ACTION_PRESS: 1, PRESS: 2 }, AndroidImportance: { HIGH: 4, LOW: 2 }, AndroidCategory: { CALL: 'call' }, AndroidVisibility: { PUBLIC: 1 }, AndroidForegroundServiceType: { FOREGROUND_SERVICE_TYPE_MICROPHONE: 128 } };
      if (name === '@react-native-firebase/messaging') return { default: () => messagingObject };
      if (name === 'react-native-callkeep') return { default: callKeep };
      if (name === 'react-native-voip-push-notification') return { default: voip };
      if (name === 'react-native-agora') return load('src/utils/agora-mock.js');
      if (name.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), name.endsWith('.js') ? name : `${name}.js`)));
      return require(name);
    };
    const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { atob: (value) => Buffer.from(value, 'base64').toString('utf8'), process: { env: {} }, console: { warn: () => {}, log: () => {} }, setInterval: () => 1, clearInterval: () => {}, setTimeout, Date })(requireMock, module, module.exports);
    return module.exports;
  }
  return { load, saved, calls, notifications, cancelled, nativeEvents, backgroundMessage: () => backgroundMessage, backgroundEvent: () => backgroundEvent, foregroundEvent: () => foregroundEvent };
}
const initial = { token: 'old-access', refreshToken: 'valid-refresh', user: { _id: 'parent', fullName: 'Parent' } };
const response = { token: 'new-access', refreshToken: 'rotated-refresh', data: { _id: 'parent', fullName: 'Parent' } };

for (const authPath of ['parent', 'nanny'].filter((role) => (root.includes('Nanny') ? role === 'nanny' : role === 'parent'))) {
  test('saved secure session survives a new JavaScript process and supports legacy token migration', async () => {
    const first = harness(); await first.load('src/utils/storage.js').saveSession(initial);
    const second = harness({ saved: first.saved });
    assert.equal((await second.load('src/utils/storage.js').getSession()).refreshToken, initial.refreshToken);
    const legacy = harness({ saved: new Map([['authToken', 'legacy-access']]) });
    assert.equal(await legacy.load('src/utils/storage.js').getToken(), 'legacy-access');
  });
  test('failed secure storage writes reject login instead of pretending it was persisted', async () => {
    const fixture = harness({ storageError: true });
    await assert.rejects(fixture.load('src/utils/storage.js').saveSession(initial), /Keychain unavailable/);
    assert.equal(fixture.saved.size, 0);
  });
  test('a wrong password does not erase an existing session or trigger refresh', async () => {
    const fixture = harness({ adapter: async () => ({ status: 401, data: { message: 'Wrong password' } }) });
    await fixture.load('src/utils/storage.js').saveSession(initial);
    await assert.rejects(fixture.load('src/services/api.js').default.post(`/auth/${authPath}/login`, { password: 'wrong' }));
    assert.equal((await fixture.load('src/utils/storage.js').getSession()).token, initial.token);
    assert.equal(fixture.calls.length, 1); assert.equal(fixture.calls[0].authorization, undefined);
  });
  test('concurrent 401s refresh once, persist rotation and retry every original request', async () => {
    let refreshed = 0;
    const fixture = harness({ adapter: async (request) => {
      if (request.url.endsWith('/refresh')) { refreshed++; await new Promise((resolve) => setTimeout(resolve, 15)); return { status: 200, data: response }; }
      return { status: request.headers.Authorization === 'Bearer new-access' ? 200 : 401, data: { ok: true } };
    } });
    await fixture.load('src/utils/storage.js').saveSession(initial);
    const api = fixture.load('src/services/api.js').default;
    const results = await Promise.all(Array.from({ length: 5 }, () => api.get('/private')));
    assert.equal(refreshed, 1); assert.ok(results.every((result) => result.ok));
    assert.equal((await fixture.load('src/utils/storage.js').getSession()).refreshToken, response.refreshToken);
  });
  test('offline refresh keeps credentials and cold-start restoration can retry later', async () => {
    const fixture = harness({ adapter: async () => { throw new realAxios.AxiosError('Offline', 'ERR_NETWORK'); } });
    await fixture.load('src/utils/storage.js').saveSession(initial);
    const restored = await fixture.load('src/services/api.js').restoreSession();
    assert.equal(restored.token, initial.token); assert.equal(restored.refreshToken, initial.refreshToken);
  });
  test('revoked refresh clears credentials and does not enter an infinite retry loop', async () => {
    const fixture = harness({ adapter: async () => ({ status: 401, data: { message: 'Revoked' } }) });
    await fixture.load('src/utils/storage.js').saveSession(initial);
    assert.equal(await fixture.load('src/services/api.js').restoreSession(), null);
    assert.equal(fixture.calls.length, 1);
  });
  test('logout during a refresh cannot recreate the logged-out session', async () => {
    let release; const gate = new Promise((resolve) => { release = resolve; });
    const fixture = harness({ adapter: async () => { await gate; return { status: 200, data: response }; } });
    const storage = fixture.load('src/utils/storage.js'); await storage.saveSession(initial);
    const refreshing = fixture.load('src/services/api.js').refreshAccessToken();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await storage.removeToken(); release(); await refreshing;
    assert.equal(await storage.getSession(), null);
  });
}

test('Android background call has full-screen intent, caller details and Answer/Decline actions', async () => {
  const fixture = harness({ native: true }); await fixture.load('src/utils/storage.js').saveSession(initial);
  const service = fixture.load('src/services/nativeCallService.js');
  const data = { type: 'CALL_INCOMING', callId: 'call-a', uuid: 'uuid-a', callerName: 'Parent', callType: 'audio', expiresAt: String(Date.now() + 45000) };
  await fixture.backgroundMessage()({ data });
  const notification = fixture.notifications[0];
  assert.equal(notification.title, 'Parent'); assert.equal(notification.android.fullScreenAction.launchActivity, 'default');
  assert.deepEqual(Array.from(notification.android.actions, (action) => action.pressAction.id), ['decline', 'answer']);
  await fixture.backgroundEvent()({ type: 1, detail: { notification, pressAction: { id: 'answer' } } });
  assert.equal((await service.getPendingCall()).action, 'answer');
  assert.equal(fixture.calls.filter((call) => call.url.endsWith('/accept')).length, 0, 'cold-start answer must wait for Router/session restoration');
});

test('expired pushes never ring and active notification has timer and End action', async () => {
  const fixture = harness({ native: true }); await fixture.load('src/utils/storage.js').saveSession(initial);
  const service = fixture.load('src/services/nativeCallService.js');
  await service.showIncomingCall({ callId: 'expired', expiresAt: String(Date.now() - 1) });
  assert.equal(fixture.notifications.length, 0);
  await service.showOngoingCall({ callId: 'active', uuid: 'uuid', remoteName: 'Nanny', callType: 'video' }, 12345);
  const notification = fixture.notifications[0];
  assert.equal(notification.android.showChronometer, true); assert.equal(notification.android.timestamp, 12345);
  assert.equal(notification.android.actions[0].pressAction.id, 'end');
  assert.equal(notification.android.asForegroundService, true);
});

test('Android decline notification calls backend and dismisses native UI', async () => {
  const fixture = harness({ native: true, adapter: async (request) => ({ status: 200, data: { data: { status: request.url.endsWith('/status') ? 'ringing' : 'declined' } } }) });
  await fixture.load('src/utils/storage.js').saveSession(initial);
  const service = fixture.load('src/services/nativeCallService.js');
  const data = { callId: 'declining', uuid: 'uuid', expiresAt: String(Date.now() + 45000) };
  await service.showIncomingCall(data);
  await fixture.backgroundEvent()({ type: 1, detail: { notification: { data }, pressAction: { id: 'decline' } } });
  assert.ok(fixture.calls.some((call) => call.url === '/calls/declining/decline'));
  assert.equal(await service.getPendingCall(), null);
  assert.ok(fixture.cancelled.includes('call-declining'));
});

test('iOS queued CallKit display then Answer is replayed before navigation', async () => {
  const fixture = harness({ native: true, platform: 'ios' }); await fixture.load('src/utils/storage.js').saveSession(initial);
  const service = fixture.load('src/services/nativeCallService.js');
  const data = { callId: 'ios-call', uuid: 'aa-bb', callerName: 'Nanny', expiresAt: String(Date.now() + 45000) };
  await fixture.nativeEvents.didLoadWithEvents([
    { name: 'RNCallKeepDidDisplayIncomingCall', data: { payload: data } },
    { name: 'RNCallKeepPerformAnswerCallAction', data: { callUUID: 'AA-BB' } },
  ]);
  assert.equal((await service.getPendingCall()).action, 'answer');
});

test('an offline End action removes call UI immediately while its request is pending', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const fixture = harness({ native: true, adapter: async () => { await gate; throw new realAxios.AxiosError('Offline', 'ERR_NETWORK'); } });
  await fixture.load('src/utils/storage.js').saveSession(initial);
  const service = fixture.load('src/services/nativeCallService.js');
  const data = { callId: 'offline-end', uuid: 'uuid', expiresAt: String(Date.now() + 45000) };
  await service.showIncomingCall(data);
  const action = fixture.backgroundEvent()({ type: 1, detail: { notification: { data }, pressAction: { id: 'end' } } });
  const rejected = assert.rejects(action);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(await service.getPendingCall(), null);
  assert.ok(fixture.cancelled.includes('call-offline-end'));
  release(); await rejected;
});


test('reopening with a fresh access token restores immediately without a refresh round trip', async () => {
  const fixture = harness({ adapter: async () => { throw new Error('Unexpected network request'); } });
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 900 })).toString('base64url');
  const session = { ...initial, token: `header.${payload}.signature` };
  await fixture.load('src/utils/storage.js').saveSession(session);
  assert.equal((await fixture.load('src/services/api.js').restoreSession()).token, session.token);
  assert.equal(fixture.calls.length, 0);
});


test('explicit logout clears secure storage before a slow server revocation completes', async () => {
  let release; const gate = new Promise((resolve) => { release = resolve; });
  const fixture = harness({ adapter: async () => { await gate; return { status: 200, data: {} }; } });
  const storage = fixture.load('src/utils/storage.js'); await storage.saveSession(initial);
  const loggingOut = fixture.load('src/services/api.js').logoutSession();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(await storage.getSession(), null);
  release(); await loggingOut;
});


test('call audio preparation waits for every registered microphone/playback cleanup', async () => {
  const fixture = harness();
  const media = fixture.load('src/utils/callMedia.js');
  let finished = false;
  const unregister = media.registerCallMediaCleanup(async () => { await new Promise((resolve) => setTimeout(resolve, 5)); finished = true; });
  await media.prepareCallMedia();
  assert.equal(finished, true); unregister();
  finished = false; await media.prepareCallMedia(); assert.equal(finished, false);
});

test('the shared chat call launcher releases media and forwards the server UUID', async () => {
  let released = false;
  const fixture = harness({ native: true, adapter: async (request) => {
    assert.equal(released, true);
    return { status: 201, data: { status: 'success', data: { callId: 'chat-call', uuid: 'native-call-uuid', channelName: 'isolated-call', token: 'rtc-test', uid: 123, agoraAppId: 'test-app', receiver: { name: 'Contact' } } } };
  } });
  await fixture.load('src/utils/storage.js').saveSession(initial);
  // Permissions are already covered by native build/device checks; this isolates launch sequencing.
  const media = fixture.load('src/utils/callMedia.js');
  media.registerCallMediaCleanup(async () => { released = true; });
  let route;
  await fixture.load('src/utils/callLauncher.js').initiateOutgoingCall({ router: { push: (value) => { route = value; } }, receiverId: 'receiver', receiverName: 'Contact', callType: 'audio' });
  assert.equal(route?.params.uuid, 'native-call-uuid');
  assert.equal(route?.params.callId, 'chat-call');
});


test('incoming call waits for a voice note that is still acquiring its microphone', async () => {
  const fixture = harness(); const mediaApi = fixture.load('src/utils/callMedia.js');
  let release; let stopped = 0;
  const media = { recording: null, sound: { unloadAsync: async () => {} } };
  const recording = { stopAndUnloadAsync: async () => { stopped++; } };
  media.pendingRecording = new Promise((resolve) => { release = resolve; }).then(() => { media.recording = recording; });
  const releasing = mediaApi.releaseChatMedia(media);
  assert.equal(media.cancelled, true); assert.equal(stopped, 0);
  release(); await releasing;
  assert.equal(stopped, 1); assert.equal(media.recording, null); assert.equal(media.sound, null);
});

test('incoming call does not stop a voice note twice while Send is finishing', async () => {
  const fixture = harness(); const mediaApi = fixture.load('src/utils/callMedia.js');
  let release; let duplicateStops = 0;
  const media = { recording: { stopAndUnloadAsync: async () => { duplicateStops++; } } };
  media.pendingRecordingStop = new Promise((resolve) => { release = resolve; }).then(() => { media.recording = null; });
  const releasing = mediaApi.releaseChatMedia(media);
  release(); await releasing;
  assert.equal(duplicateStops, 0);
});

test('callSessionManager keeps call running when screen is detached (minimized)', async () => {
  const fixture = harness({ native: true });
  await fixture.load('src/utils/storage.js').saveSession(initial);
  const manager = fixture.load('src/services/callSessionManager.js').callSessionManager;
  await manager.startOrAttachCall({
    callId: 'bg-call', uuid: 'bg-uuid', channelName: 'ch-bg', token: 'token-bg',
    agoraAppId: 'app-bg', uid: 101, callType: 'audio', mode: 'outgoing', remoteName: 'Parent'
  });
  const state = manager.getState();
  assert.equal(state.callId, 'bg-call');
  assert.equal(state.isScreenAttached, true);
  assert.equal(state.isMinimized, false);

  // Screen detaches (e.g. user pressed back button or navigated to another screen)
  manager.detachScreen();
  const detached = manager.getState();
  assert.equal(detached.callId, 'bg-call', 'Call must stay active when screen detaches');
  assert.equal(detached.isScreenAttached, false);
  assert.equal(detached.isMinimized, true);

  // Reattaching screen (e.g. user tapped top banner or notification)
  await manager.startOrAttachCall({ callId: 'bg-call' });
  const reattached = manager.getState();
  assert.equal(reattached.isScreenAttached, true);
  assert.equal(reattached.isMinimized, false);

  // End call explicitly
  await manager.endCall('caller_hangup');
  assert.equal(manager.getState(), null);
});

