# Building and Publishing the Android App Locally

The Android app is a thin Kotlin WebView wrapper in [`android/`](../android). The Gradle build copies the web app from [`src/`](../src) into the APK, so there is no separate web build step.

## 1. Required tools

| Tool | Version | Notes |
| --- | --- | --- |
| JDK | 17 | Temurin or OpenJDK. Check with `java -version`. |
| Android SDK | Platform `android-34`, Build-Tools `34.0.0` | Install via Android Studio or the command-line tools (below). |
| Gradle | Not needed | The checked-in wrapper (`android/gradlew`, Gradle 9.7.1) downloads it. Gradle 9 requires JDK 17 or newer to run. |
| `adb` | Any recent | Part of the SDK `platform-tools`. Needed only to install on a device or emulator. |
| `keytool` | Ships with the JDK | Needed only to create a signing key. |
| GitHub CLI (`gh`) | Optional | Only for publishing a GitHub Release from your machine. |

Node.js is **not** required.

### Installing the Android SDK without Android Studio

1. Download the "Command line tools only" package from <https://developer.android.com/studio#command-line-tools-only> and unzip it so it ends up at `$ANDROID_HOME/cmdline-tools/latest/`.
2. Install the packages:

   ```bash
   export ANDROID_HOME="$HOME/android-sdk"
   export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

   sdkmanager --licenses
   sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   ```

If you use Android Studio, open the `android/` folder once and it will install the missing SDK pieces and write `android/local.properties` (git-ignored). Otherwise set `ANDROID_HOME` (or create `android/local.properties` containing `sdk.dir=/path/to/Sdk`).

## 2. Build a debug APK

```bash
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

The first build downloads Gradle and dependencies and takes a few minutes. Later builds are much faster.

## 3. Install and test on a device

1. Enable **Developer options** and **USB debugging** on the phone (or start an emulator from Android Studio's Device Manager).
2. Check the device is visible, then install:

   ```bash
   adb devices
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. Open **Sonic Mandala** and tap **Enable Mic**. Android shows the microphone permission dialog; after you allow it, the HUD shows "Mic Active" and the mandala reacts to sound.

To reset the permission while testing: `adb shell pm revoke com.generative.mandala android.permission.RECORD_AUDIO`.

To view WebView console output: `adb logcat chromium:I *:S`.

## 4. Create a signing key (one time)

Release builds must be signed to be installable outside of debug mode. Create a keystore and **keep it somewhere safe and out of the repository**. If you lose it you cannot ship updates under the same signature.

```bash
keytool -genkeypair -v \
  -keystore ~/sonic-mandala-release.keystore \
  -alias sonic-mandala \
  -keyalg RSA -keysize 4096 -validity 10000
```

`*.keystore` and `*.jks` are already ignored by `android/.gitignore`.

## 5. Build a signed release

[`android/app/build.gradle.kts`](../android/app/build.gradle.kts) reads the signing configuration and version from environment variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `ANDROID_KEYSTORE_PATH` | Path to the keystore. If unset, the release APK is **unsigned**. | unset |
| `KEYSTORE_PASSWORD` | Keystore password | none |
| `KEY_ALIAS` | Key alias (`sonic-mandala` above) | none |
| `KEY_PASSWORD` | Key password | none |
| `VERSION_NAME` | User-visible version, e.g. `1.2.0` | `1.0.0` |
| `VERSION_CODE` | Integer that must increase with every release | `1` |

```bash
cd android
export ANDROID_KEYSTORE_PATH="$HOME/sonic-mandala-release.keystore"
export KEYSTORE_PASSWORD='...'
export KEY_ALIAS='sonic-mandala'
export KEY_PASSWORD='...'
export VERSION_NAME=1.0.0
export VERSION_CODE=1

./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk` (signed). Without `ANDROID_KEYSTORE_PATH` the file is `app-release-unsigned.apk`, which Android will not install.

Verify the signature:

```bash
$ANDROID_HOME/build-tools/34.0.0/apksigner verify --print-certs \
  app/build/outputs/apk/release/app-release.apk
```

For Google Play, which requires an Android App Bundle, run `./gradlew bundleRelease` instead. The output is `app/build/outputs/bundle/release/app-release.aab`.

## 6. Publish

### Option A: GitHub Release from your machine

```bash
cp android/app/build/outputs/apk/release/app-release.apk dist/sonic-mandala-1.0.0-release.apk   # mkdir -p dist first
gh release create v1.0.0 dist/sonic-mandala-1.0.0-release.apk \
  --title "v1.0.0" --generate-notes
```

### Option B: Let CI do it

Push a version tag. The [Android App](../.github/workflows/android.yml) workflow builds the APKs and attaches them to a GitHub Release (details in [CI.md](CI.md)).

```bash
git tag v1.0.0
git push origin v1.0.0
```

To have CI sign the release, add these repository secrets: `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`. Produce the first one with:

```bash
base64 -w0 ~/sonic-mandala-release.keystore   # macOS: base64 -i file
```

### Option C: Google Play

Build the `.aab` (section 5), then upload it in the Play Console under your app's release track. Enrol in Play App Signing when prompted. Remember to bump `VERSION_CODE` for every upload.

## Dependency security overrides

The build tooling (Android Gradle Plugin 8.5.2, Kotlin plugin 2.1.0) resolves old transitive libraries in its own internal configurations (unified test platform, lint, and so on). These never ship in the APK, but scanners such as the Snyk IDE extension report them. [`android/build.gradle.kts`](../android/build.gradle.kts) therefore overrides them:

- A `buildscript { constraints { … } }` block pins `io.netty` 4.1.140.Final, `protobuf-java` 3.25.9, and `commons-io` 2.22.0 on the plugin classpath.
- An `allprojects { configurations.all { resolutionStrategy … } }` block applies the same versions, plus `kotlin-stdlib` 2.1.0, to every project configuration (alongside the pinned `guava`).

Check the result with `./gradlew :app:dependencies` and `./gradlew buildEnvironment`. Revisit the overrides whenever AGP is upgraded; they may no longer be needed.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `SDK location not found` | Set `ANDROID_HOME` or create `android/local.properties` with `sdk.dir=...`. |
| `Failed to install the following Android SDK packages as some licences have not been accepted` | Run `sdkmanager --licenses`. |
| Unsupported class file major version | Gradle is running on the wrong JDK. Use JDK 17 (`JAVA_HOME`). |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | An app with a different signature is installed. Run `adb uninstall com.generative.mandala`. |
| "Enable Mic" shows "Permission Denied" | The permission was denied in Android Settings. Grant it under Settings → Apps → Sonic Mandala → Permissions. |
| `gradlew: Permission denied` | Run `chmod +x android/gradlew`. |
| `Vulnerable protobuf generated type in use: com.google.crypto.tink...` during `sdkReleaseDependencyData` | Harmless log noise from Tink classes bundled with the Android tooling, not your code. The build still succeeds. |
| `This version only understands SDK XML versions up to 3` | The command-line tools and Android Studio versions differ. A warning only; update the SDK tools to silence it. |
