const { withMainActivity, withMainApplication, withProjectBuildGradle, withDangerousMod, withAndroidManifest, withInfoPlist, withEntitlementsPlist, withAppDelegate } = require('@expo/config-plugins');

module.exports = function withNativeCalls(config) {
  config = withProjectBuildGradle(config, (mod) => {
    const repo = "maven { url(new File(rootProject.projectDir, '../node_modules/@notifee/react-native/android/libs')) }";
    if (!mod.modResults.contents.includes('@notifee/react-native/android/libs')) {
      mod.modResults.contents = mod.modResults.contents.replace(/allprojects\s*\{\s*repositories\s*\{/, (match) => `${match}\n    ${repo}`);
    }
    return mod;
  });
  config = withDangerousMod(config, ['android', async (mod) => {
    const fs = require('node:fs/promises');
    const path = require('node:path');
    const dir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/drawable');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'ic_stat_call.xml'), '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24"><path android:fillColor="#FFFFFF" android:pathData="M6.62,10.79a15.05,15.05 0,0 0,6.59 6.59l2.2,-2.2a1,1 0,0 1,1.02 -0.24c1.12,0.37 2.33,0.57 3.57,0.57a1,1 0,0 1,1 1V20a1,1 0,0 1,-1 1C10.61,21 3,13.39 3,4a1,1 0,0 1,1 -1h3.5a1,1 0,0 1,1 1c0,1.25 0.2,2.45 0.57,3.57a1,1 0,0 1,-0.25 1.02z"/></vector>');
    const javaDir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/java/com/heyshishu/nativecalls');
    await fs.mkdir(javaDir, { recursive: true });
    for (const filename of ['CallPermissionsModule.kt', 'CallPermissionsPackage.kt']) {
      await fs.copyFile(path.join(__dirname, 'android', filename), path.join(javaDir, filename));
    }
    return mod;
  }]);
  config = withMainActivity(config, (mod) => {
    const marker = '// HeyShishu pre-Android-8.1 call wake-up';
    if (!mod.modResults.contents.includes(marker)) {
      mod.modResults.contents = mod.modResults.contents.replace('super.onCreate(null)', `super.onCreate(null)
    ${marker}
    if (android.os.Build.VERSION.SDK_INT < 27) {
      window.addFlags(android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }`);
    }
    return mod;
  });
  config = withMainApplication(config, (mod) => {
    const statement = 'add(com.heyshishu.nativecalls.CallPermissionsPackage())';
    if (!mod.modResults.contents.includes(statement)) {
      mod.modResults.contents = mod.modResults.contents.replace('PackageList(this).packages.apply {', `PackageList(this).packages.apply {\n              ${statement}`);
    }
    return mod;
  });
  config = withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application[0];
    const activity = app.activity.find((item) => item.$['android:name'] === '.MainActivity');
    if (activity) {
      activity.$['android:showWhenLocked'] = 'true';
      activity.$['android:turnScreenOn'] = 'true';
    }
    app.service = app.service || [];
    const serviceName = 'app.notifee.core.ForegroundService';
    let service = app.service.find((item) => item.$['android:name'] === serviceName);
    if (!service) { service = { $: { 'android:name': serviceName } }; app.service.push(service); }
    service.$['android:foregroundServiceType'] = 'microphone';
    return mod;
  });
  config = withInfoPlist(config, (mod) => {
    mod.modResults.UIBackgroundModes = [...new Set([...(mod.modResults.UIBackgroundModes || []), 'audio', 'voip', 'remote-notification'])];
    mod.modResults.NSMicrophoneUsageDescription = 'Allow HeyShishu to use your microphone for audio and video calls.';
    mod.modResults.NSCameraUsageDescription = 'Allow HeyShishu to use your camera for video calls.';
    return mod;
  });
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults['aps-environment'] = config.extra?.callPushEnvironment === 'sandbox' ? 'development' : 'production';
    return mod;
  });
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') throw new Error('withNativeCalls requires an Expo Swift AppDelegate');
    let source = mod.modResults.contents;
    if (source.includes('// HeyShishu native calling')) return mod;
    source = source.replace('import Expo', 'import Expo\nimport PushKit\nimport RNCallKeep\nimport RNVoipPushNotification');
    source = source.replace('public class AppDelegate: ExpoAppDelegate {', 'public class AppDelegate: ExpoAppDelegate, PKPushRegistryDelegate {\n  // HeyShishu native calling\n  private var shishuVoipRegistry: PKPushRegistry?');
    source = source.replace('    let delegate = ReactNativeDelegate()', `    RNCallKeep.setup([
      "appName": "HeyShishu", "supportsVideo": true,
      "maximumCallGroups": 1, "maximumCallsPerCallGroup": 1,
      "includesCallsInRecents": false
    ])
    let voipRegistry = PKPushRegistry(queue: .main)
    voipRegistry.delegate = self
    voipRegistry.desiredPushTypes = [.voIP]
    shishuVoipRegistry = voipRegistry
    let delegate = ReactNativeDelegate()`);
    const methods = `
  public func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
    RNVoipPushNotificationManager.didUpdate(pushCredentials, forType: type.rawValue)
  }

  public func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    // PushKit provides a replacement through didUpdate; never use the old token as FCM.
  }

  public func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
    let data = payload.dictionaryPayload
    let uuid = data["uuid"] as? String ?? UUID().uuidString
    let name = data["callerName"] as? String ?? "HeyShishu caller"
    // Report synchronously from native code, before waiting for the JS bridge.
    RNCallKeep.reportNewIncomingCall(uuid, handle: name, handleType: "generic",
      hasVideo: data["callType"] as? String == "video", localizedCallerName: name,
      supportsHolding: false, supportsDTMF: false, supportsGrouping: false,
      supportsUngrouping: false, fromPushKit: true, payload: data,
      withCompletionHandler: completion)
    let expiresAt = (data["expiresAt"] as? String).flatMap(Double.init) ?? Date().timeIntervalSince1970 * 1000 + 45000
    let delay = max(1, expiresAt / 1000 - Date().timeIntervalSince1970)
    DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
      if !RNCallKeep.isCallActive(uuid) { RNCallKeep.endCall(withUUID: uuid, reason: 3) }
    }
    RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType: type.rawValue)
  }
`;
    source = source.replace('  // Linking API', methods + '\n  // Linking API');
    if (!source.includes('private var shishuVoipRegistry') || !source.includes('RNCallKeep.reportNewIncomingCall')) throw new Error('Could not configure native incoming calls');
    mod.modResults.contents = source;
    return mod;
  });
};
