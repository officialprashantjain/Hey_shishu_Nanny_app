# Validation results — 26 October 2026

The authentication/session and native calling changes are implemented locally across the backend, parent/client app and nanny app. No server deployment, store submission or production-account creation was performed.

## Automated regression tests

| Repository | Result | Command |
| --- | --- | --- |
| Backend | 17 passed, 0 failed | `npm test` |
| Client app | 18 passed, 0 failed | `npm test` |
| Nanny app | 18 passed, 0 failed | `npm test` |
| Total | **53 passed, 0 failed** | |

Backend tests use a disposable MongoDB instance and real Express endpoints, session middleware, Mongoose models and Agora token generation. They cover refresh rotation/concurrency/revocation, password/OTP/2FA flows, booking and participant authorization, simultaneous-call locks, late answers, cancellation racing with Answer, idempotent ending, device tokens and credential redaction. No configured application database was used.

Mobile tests load the actual storage/API/native-call modules with real Axios adapters and mocked native SDKs. They cover session recreation, failed secure writes, concurrent 401 recovery, offline startup, wrong-password isolation, logout races, Android notification actions/timer, queued iOS CallKit events, chat call UUIDs and voice-note microphone ownership races. They do not establish connected RTC media or real remote push delivery.

## Native compilation and JavaScript exports

| App | Android native | iOS native | Final JavaScript exports |
| --- | --- | --- | --- |
| Client | arm64 Debug APK — PASS | arm64 Simulator Debug, unsigned — PASS | Android and iOS — PASS |
| Nanny | arm64 Debug APK — PASS | arm64 Simulator Debug, unsigned — PASS | Android and iOS — PASS |

Both iOS builds compiled the real PushKit/CallKit/VoIP delegate and linked the installed native libraries. Android builds include Firebase Messaging, Notifee, Agora and the custom full-screen permissions module. These build results do not establish signed App Store/TestFlight archive readiness; signing and distribution credentials are still required. JavaScript exports were generated after the final source changes. Native calling needs a native rebuild; Expo Go and an OTA update alone are insufficient.

## Android emulator smoke checks

An isolated Android API 36.1 emulator used the actual Debug APKs, SecureStore and Redux/session initialization against a temporary local HTTP fixture.

- Nanny: invoked the native login service, force-stopped the process and reopened; the New Jobs screen appeared. Login request count remained 1 before/after reopen.
- Client: invoked the native email-login Redux thunk, force-stopped the process and reopened; the Home/Live Webinar screen appeared. Login request count remained 2 before/after reopen (two explicit test logins preceded the force-stop).
- Client incoming-call UI: injected a local incoming-call event into the actual native service while the PIN-secured keyguard was showing. Notifee woke the display and showed the full-screen incoming screen with Answer and Decline. During display, Android reported `showing=true`, `secure=true`, `inputRestricted=true`, `occluded=true`.
- Tapped Decline above the secure lock screen: the fixture received the decline request, notifications/call UI cleared, and the keyguard remained locked with `occluded=false`. Normal app content did not remain visible over the lock screen.

These checks verify native session persistence and the native Android display/decline path. Incoming events were locally injected, not delivered through FCM. Live Answer/End with connected audio/video, receiver process termination, phone restart and all iOS device behavior remain physical-device checks. Notification/microphone/full-screen permissions were granted in the disposable emulator. The fixture override, Metro servers and emulator were removed/stopped after testing; existing app environment files and user emulators were preserved.

Evidence:

- [Nanny persistence result](validation-logs/nanny-emulator-result.json)
- [Nanny after reopen](validation-logs/nanny-restored.png)
- [Client persistence and secure-lock result](../HeyShishu-ClientApp_prashant/validation-logs/client-emulator-result.json)
- [Client after reopen](../HeyShishu-ClientApp_prashant/validation-logs/client-restored.png)
- [Incoming call above PIN lock](../HeyShishu-ClientApp_prashant/validation-logs/client-secure-locked-call.png)
- [Lock screen after Decline](../HeyShishu-ClientApp_prashant/validation-logs/client-after-secure-decline.png)

## Logs and release prerequisites

`validation-logs/` in each repository contains its regression output; each mobile repository also includes native build summaries and final JavaScript export results. Build/runtime warnings include third-party Firebase namespaced API/Expo AV deprecations and large SVG transforms. They did not block the validated builds; these dependency migrations were not part of the authentication/calling repair. Existing repository-wide dependency advisories were not resolved through broad forced upgrades.

The local backend has no Firebase Admin service-account files or Apple `.p8`/Key ID/Team ID, so live FCM/APNs delivery could not be verified. Configure the matching customer/nanny Firebase projects and APNs credentials, preserve stable JWT/refresh secrets, then deploy the backend and rebuild both apps. Local Xcode uses sandbox APNs; distributed EAS device builds and TestFlight/App Store use production APNs. Both environments are configured in source.

Complete the two-physical-device checklist in [AUTH_CALLS_FIX_REPORT.md](AUTH_CALLS_FIX_REPORT.md), including locked/background calls in both directions, Answer/Decline/End, duration, audio/video/mute/Bluetooth, reconnects, access-token expiry, logout and TestFlight delivery. Explicit OS force-stop, DND, notification permissions and device battery policies can limit incoming notifications.

`git diff --check` and `git diff --cached --check` passed in all three repositories. Existing staged user changes were preserved; no commits were made.
