# Keystore CI Setup Guide

This document explains how to configure GitHub Actions to build signed release APKs for StandardTune.

## Overview

The GitHub Actions workflow builds the APK in a clean Linux environment. The signing keystore is **never committed to the repository** — it's stored as a base64-encoded secret and decoded at build time.

If the secrets are not configured, CI still runs: it produces a debug-signed APK artifact instead of failing, and skips publishing GitHub Releases (so a debug-signed build can never be released by accident).

## Prerequisites

- A release keystore file (`.jks` or `.p12`)
- Access to your GitHub repository's **Settings > Secrets and variables > Actions**

## Step 1: Base64-Encode Your Keystore

Your existing keystore is at:
```
C:\Users\micha\.android-keystores\standardtune-release.p12
```

### PowerShell (Windows)
```powershell
[System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes("C:\Users\micha\.android-keystores\standardtune-release.p12")) | Set-Content keystore-base64.txt
```

### Linux / macOS
```bash
openssl base64 < standardtune-release.p12 | tr -d '\n' | tee keystore-base64.txt
```

Open `keystore-base64.txt`, copy the entire contents (single line, no line breaks).

## Step 2: Create GitHub Secrets

Go to your repository: **Settings > Secrets and variables > Actions > New repository secret**

Create these 4 secrets:

| Secret Name | Value |
|---|---|
| `KEYSTORE_BASE64` | Paste the entire base64 string from Step 1 |
| `KEYSTORE_PASSWORD` | The keystore password (your keystore password — never write it in this repo) |
| `KEY_ALIAS` | The key alias (e.g., `standardtune`) |
| `KEY_PASSWORD` | The key password (same as keystore password if you set it the same) |

**Important**: `KEY_PASSWORD` is the password for the individual key, not the keystore. If you set them the same during keystore creation, use the same value for both secrets.

## Step 3: How It Works in CI

The workflow (`build-release.yml`) does this at build time:

1. **Expo prebuild** runs first, generating the `android/` directory with default config
2. **Decode keystore**: `echo "$KEYSTORE_BASE64" | base64 -d > android/app/release.keystore`
3. **Create keystore.properties**: Dynamically writes the signing credentials
4. **Patch build.gradle**: Injects `signingConfigs { release { ... } }` and sets `buildTypes.release.signingConfig`
5. **Build**: `./gradlew assembleRelease`

The keystore file only exists during the workflow run — it's wiped when the runner shuts down.

## Step 4: Release a New Version

When you're ready to release:

```bash
# Update version in app.json (versionCode must increment)
git tag v1.0.0
git push origin v1.0.0
```

This triggers the workflow, which:
- Builds the signed release APK
- Creates a GitHub Release tagged `v1.0.0`
- Attaches the APK to the release

Obtainium can then detect and offer the update to users.

## Security Notes

- **Never** commit keystore files (`.jks`, `.p12`) to the repository
- **Never** commit `keystore.properties` with real credentials
- GitHub Secrets are encrypted and only available to workflow runs on protected branches
- The decoded keystore exists only ephemerally during the build
- `.gitignore` already excludes `*.jks`, `*.p12`, `keystore.properties`, and `*.apk`

## Troubleshooting

### "Could not find keystore" error
- The base64 secret may be malformed (line breaks, missing characters)
- Re-encode the keystore and update the secret

### "Signing config not found" error
- The `prebuild --clean` may have run after the signing config was injected
- Check that the workflow order is: prebuild → decode keystore → patch build.gradle → build

### "Wrong password" error
- Verify `KEYSTORE_PASSWORD`, `KEY_ALIAS`, and `KEY_PASSWORD` secrets match your keystore
- Use `keytool -list -keystore standardtune-release.p12` to verify credentials locally
