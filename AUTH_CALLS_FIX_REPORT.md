# Authentication and mobile calls — 26 October 2026

## What changed

Both React Native / Expo SDK 54 apps now restore their secure session before routing. Previously both splash screens always navigated through onboarding/login, the nanny Redux store was never restored, and every HTTP 401 erased the token, including incorrect login credentials. There was no refresh endpoint.

- Access tokens last 15 minutes. Opaque refresh tokens are stored in SecureStore; only their hashes are stored in MongoDB. Refresh sessions have a sliding 90-day inactivity expiry and a one-year absolute maximum. An active user can reopen the app without entering credentials within these limits.
- Fresh access tokens restore immediately without a network round trip. Refresh requests rotate tokens. Concurrent requests share a single refresh in each app. The backend atomically rotates and tolerates a 30-second duplicate retry after a lost response. Offline/timeouts/5xx retain credentials. Invalid/expired/revoked refresh sessions return to login.
- Both OTP and email login, parent registration, 2FA login, and parent password changes return refresh credentials. Existing saved 7-day tokens are restored; they require one new login when they expire because old tokens have no corresponding refresh secret.
- Auth reducers are pure. Tokens are written successfully before login completes. Parent tokens and 2FA challenges are no longer persisted to unencrypted Redux storage. Logging out immediately resets all user-specific Redux state and clears SecureStore before making a network request; server logout revokes all sessions and removes push registrations for that account. If logout happens offline, local credentials are removed but server revocation cannot be delivered until connectivity returns.
- A phone registration requires a signed, expiring, single-use proof from OTP verification. Password reset/2FA verify stored hashes, expiry and attempt counts. Production codes use cryptographic randomness and SMS/configured SMTP; tester codes require the explicit tester flag and an exact allowlisted number. Password reset/change invalidates old sessions. Credentials/codes are redacted from request/response logging. Removed the committed MSG91 credential fallback; configure the provider through environment variables and rotate any previously committed provider key.
- Removed conflicting duplicate customer/profile indexes discovered by integration tests.

## Calls

Android uses high-priority data-only FCM, Notifee full-screen call notifications with Answer/Decline, and a microphone foreground service with an ongoing End call action and a duration chronometer. Android 14+ full-screen access is checked and the app offers the corresponding settings page. The main activity supports waking the screen; native call cleanup removes its lock-screen visibility. Normal app screens clear lock-screen visibility during session bootstrap. The OS still controls permission, heads-up vs full-screen presentation, DND and force-stop behavior.

iOS uses PushKit VoIP tokens and native CallKit reporting before the JS bridge starts. Answer/end events received during startup are replayed after secure session restoration. iOS ordinary FCM tokens are obtained through Firebase Messaging and are never confused with APNs/Expo/PushKit tokens. VoIP calls use APNs HTTP/2; cancellations use silent FCM plus status checks. Only incoming calls use VoIP pushes, as Apple requires. The system call UI supplies Answer/Decline, End, mute and duration. Camera publishing pauses while backgrounded/locked; audio continues. Microphone permission is requested while the app is visible so a later locked-screen answer can connect.

Both chat call buttons now use the shared launcher and preserve the server CallKit UUID. Starting or answering a call first releases voice-note microphones and chat playback, including recordings that are still acquiring or releasing audio. Invalid navigator entries and a data file incorrectly treated as a client screen were corrected.

Call signaling now validates booking relationships, restricts call state/RTC credentials to participants, limits answers/declines to receivers, atomically changes status, reserves participants across concurrent server instances, expires ringing after 45 seconds, makes end/answer retries idempotent, safely ends a call when Answer races with caller cancellation, and keeps completed duration stable. RTC tokens use the relative expiry required by `agora-token` v2; the same correction applies to meeting tokens. Call screens check permissions, use actual elapsed time, poll terminal state throughout the call, release Agora on exits and stop ringing/notifications after cancellation. Native UI and push handling require rebuilt native apps, not Expo Go or an OTA-only update.

## Required deployment configuration

Keep `JWT_SECRET` stable across backend restarts and replicas. Optionally set an independent strong `REFRESH_TOKEN_SECRET`; keep that stable too. Existing sessions must be invalidated if these keys are changed intentionally. MongoDB must allow the `authsessions` and `calllocks` collections and indexes to be created.

Existing Agora and Firebase service-account configuration remains required. Each app's Firebase project must have Cloud Messaging enabled; iOS Firebase also needs its Apple APNs credentials. Both checked-in client Firebase configuration files match the app identifiers. Backend customer/nurse Firebase service accounts must match the corresponding projects.

For native iOS incoming calls configure these **backend** environment variables:

```dotenv
APNS_KEY_PATH=/run/secrets/AuthKey_YOUR_KEY_ID.p8
APNS_KEY_ID=YOUR_APPLE_KEY_ID
APNS_TEAM_ID=YOUR_APPLE_TEAM_ID
APNS_CUSTOMER_BUNDLE_ID=com.prakhar9129.heyshishu-mobileApp
APNS_NANNY_BUNDLE_ID=com.prakhar9129.heyshishu-nannyapp
```

Never put the `.p8` key or Apple/Firebase server credentials in either mobile app. PushKit/APNs credentials and physical phones were not supplied for end-to-end push verification. The sender logs missing configuration and delivery errors without token values.

Production password reset and 2FA need MSG91 settings for phone accounts; email-only accounts need SMTP configuration (`HOST` or `SERVICE`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, optional `EMAIL_FROM`). Keep `ALLOW_TESTER_LOGIN=false` in production unless an explicitly approved review account is needed.

## Local and distributed iOS builds

Both apps have EAS profiles and dynamic app config. Local Xcode/`npx expo run:ios` defaults to `sandbox`, which produces the `development` APS entitlement. Set `EXPO_PUBLIC_APNS_ENVIRONMENT=production` when generating a project for production signing. EAS `development` device builds use internal/ad-hoc distribution and production APNs; `preview` and `production` also use production. `development-simulator` uses sandbox, but a simulator does not replace physical-device VoIP testing. Backend device registrations carry their environment, so sandbox and production installations can coexist.

The Firebase client files now live in each app's `config/` directory. Generated `ios/` and `android/` directories stay ignored; `plugins/withNativeCalls.js` and its Kotlin sources preserve native configuration across prebuild.

In each app, install dependencies and rebuild:

```sh
npm ci
npx expo prebuild
npx expo run:android
# or, on macOS with signing configured:
npx expo run:ios
```

Use `eas build --profile development` or `eas build --profile production` for distributed builds after linking the project and configuring signing. Production app versions/build numbers must be increased before store submission. Android full-screen intent and microphone foreground-service declarations must be included in the Play Console submission.

## Automated validation and remaining device checks

Regression commands: `npm test` in all three repositories. Backend tests run against an isolated MongoDB instance through `mongodb-memory-server`, never the configured application database. The first run downloads a MongoDB binary; `MONGOMS_SYSTEM_BINARY=/path/to/mongod MONGOMS_SYSTEM_BINARY_VERSION_CHECK=false npm test` can use an existing local binary.

The backend suite covers access/refresh rotation, concurrent refresh, expiry/revocation/role boundaries, blocking/password changes, booking authorization, call ownership, retry safety, simultaneous call prevention, ringing timeout, token registration, log redaction, registration proof, 2FA and password reset. Each mobile suite covers secure storage after process recreation, write failures, wrong-password isolation, concurrent 401 recovery, offline restoration, revoked sessions, logout during refresh, notification actions, expired pushes, ongoing timer/End, iOS queued CallKit events and voice-note/call audio ownership races. Native modules are mocked in mobile unit tests; these are not proof of live audio/video or push delivery.

All 53 regression tests passed (17 backend, 18 client, 18 nanny). Both Android arm64 Debug APK builds, both unsigned iOS arm64 Simulator Debug builds, and Android/iOS production JavaScript exports passed. Both apps survived Android force-stop/reopen without another login. A local incoming-call fixture also woke the client above a PIN-secured Android lock screen; Decline removed the call UI and restored the lock screen. These fixture checks do not verify live FCM/APNs or connected RTC media.

Before release, use two physical devices (Android↔Android, iOS↔iOS and mixed pairs):

1. Log in once; swipe away/reopen, restart the phone, expire an access token and reopen offline. Reconnect and verify refresh. Explicitly log out and verify reopening stays logged out.
2. Call in both directions with the receiver foregrounded, backgrounded and screen locked. Test Answer, Decline, caller cancellation, missed calls and two simultaneous callers.
3. Check connected audio/video, mute, earpiece/speaker/Bluetooth routing, camera switching, camera pause while locked and accurate duration after returning to foreground.
4. End from both native notification/system UI and app UI; verify no lingering microphone/camera/notification and both users can make a new call.
5. Test notification/microphone/camera/full-screen permissions denied and later re-enabled, poor connectivity, process death, and App Store/TestFlight delivery. Explicit OS force-stop, DND, revoked notification permission and vendor battery restrictions can prevent or limit incoming UI.

See `VALIDATION_RESULTS.md` for the actual results obtained in this workspace. Device-only cases remain pending until credentials and physical phones are available.

## Platform references

Native incoming-call behavior follows [Apple PushKit/CallKit guidance](https://developer.apple.com/documentation/pushkit/responding-to-voip-notifications-from-pushkit), [Android full-screen intent limits](https://source.android.com/docs/core/permissions/fsi-limits), [Firebase background message handling](https://rnfirebase.io/messaging/usage), and [Notifee call notification behavior](https://notifee.app/react-native/docs/android/behaviour/).
