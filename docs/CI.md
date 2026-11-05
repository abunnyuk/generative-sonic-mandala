# CI & Release Workflows

Workflows live in [`.github/workflows/`](../.github/workflows).

## GitHub Pages ([`pages.yml`](../.github/workflows/pages.yml))

Deploys the contents of `src/` to GitHub Pages on every push to `main` (or manually via `workflow_dispatch`).

## Android App ([`android.yml`](../.github/workflows/android.yml))

| Trigger | Condition |
| --- | --- |
| Push to `main` | Changes under `src/**`, `android/**`, or the workflow file |
| Pull request | Changes under `src/**`, `android/**`, or the workflow file |
| Tag `v*` | Any tag push (also publishes a GitHub Release) |
| `workflow_dispatch` | Manual |

The job uses JDK 17 (Temurin) and runs `./gradlew --no-daemon assembleDebug assembleRelease` in `android/`, then uploads `dist/*.apk` as the `sonic-mandala-android` artifact.

### Versioning

- `VERSION_NAME`: the tag without the leading `v` (for `v1.2.0`, `1.2.0`), otherwise `0.0.0-<short-sha>`.
- `VERSION_CODE`: the workflow run number.

### Signing

If the `ANDROID_KEYSTORE_BASE64` secret is set, the keystore is decoded and the release APK is signed as `sonic-mandala-<version>-release.apk`. Otherwise an unsigned `sonic-mandala-<version>-release-unsigned.apk` is produced, which Android will not install.

| Secret | Purpose |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded keystore (`base64 -w0 file`) |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | Key alias |
| `KEY_PASSWORD` | Key password |

### Releasing

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow attaches the APKs to a GitHub Release with generated notes. See [ANDROID.md](ANDROID.md) for creating a keystore and building locally.
