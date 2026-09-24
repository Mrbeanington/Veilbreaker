# Building the Android app

The native project lives at `apps/web/android` (Capacitor, ADR-061). It wraps the same
static build everything else ships — no server, no change to the client-only rule.

## One-time setup

1. Install Android Studio (bundles the JDK it uses for its own UI, but see the JDK note
   below — you need a *second*, older JDK just for command-line Gradle builds).
2. Either open `apps/web/android` in Android Studio once and let its setup wizard install
   the SDK, or install it headlessly:
   ```bash
   sdkmanager --sdk_root=<sdk path> --licenses
   sdkmanager --sdk_root=<sdk path> "platform-tools" "platforms;android-36" "build-tools;36.0.0"
   ```
   Then create `apps/web/android/local.properties` (gitignored) with:
   ```
   sdk.dir=<sdk path>
   ```
3. **JDK note:** Gradle 8.14.3 (the version Capacitor 8 pins) cannot run on a JDK newer
   than it supports — the very latest Android Studio bundles JDK 25, which fails with
   `Unsupported class file major version 69`. Install a JDK 21 (e.g. Eclipse Temurin)
   separately and point `JAVA_HOME` at it for Gradle specifically; Android Studio's own
   bundled JDK is unaffected and can stay whatever it is.

## Building

```bash
pnpm --filter @veilbreak/web build        # produces apps/web/dist
cd apps/web
npx cap sync android                      # copies dist into the native project
cd android
JAVA_HOME=<path to a JDK 21> ./gradlew assembleDebug
```

The debug APK lands at `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`.
It's debug-signed, so a device needs "install from unknown sources" allowed to sideload it.

Re-run from `pnpm --filter @veilbreak/web build` every time the web app changes —
`cap sync` does not rebuild it for you, only re-copies whatever is already in `dist`.

## Release builds

Not set up yet: a release build needs a real signing keystore (`android/app/build.gradle`'s
`signingConfigs`) and, for the Play Store specifically, an `.aab` (`assembleRelease` builds
an APK; `bundleRelease` builds the AAB the Store wants) plus a developer account.
