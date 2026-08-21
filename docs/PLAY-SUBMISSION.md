# Google Play Submission Guide

Everything needed to fill in the Play Console for StandardTune, in the order the console asks for it. Repo-side artifacts (privacy policy, AAB, store assets) are already in place; this file is the answer sheet.

## Artifacts

| Item | Where |
|---|---|
| Release AAB (upload this, not the APK) | CI artifact `app-release-aab` on any main-branch or tag build |
| Privacy policy URL | `https://github.com/unexpear/guitar-tutor/blob/main/PRIVACY.md` |
| App icon 512×512 | `assets/icon.png` (export at 512 if the console rejects the size) |
| Feature graphic 1024×500 | `fastlane/metadata/android/en-US/images/featureGraphic.png` |
| Phone screenshots | `fastlane/metadata/android/en-US/images/phoneScreenshots/` |
| Short / full description | `fastlane/metadata/android/en-US/*.txt` (already brand-reference-free) |

## Store listing

- **Category:** Music & Audio
- **Tags:** guitar, tuner, music education
- **Contact email:** required — use an address you monitor (issues link alone is not accepted)

## App content declarations

- **Privacy policy:** the URL above.
- **Ads:** No, the app contains no ads.
- **App access:** All functionality is available without special access (no login).
- **Content rating (IARC questionnaire):** no violence, sexuality, language, controlled substances, gambling, user interaction, sharing of location, or purchases → rates **Everyone**.
- **Target audience:** select **13 and over only**. Do NOT select any under-13 age band — that pulls the app into the Families policy. Answer "No" to "could your store listing unintentionally appeal to children" with the reasoning that it is a general-audience instrument-learning tool.
- **News app:** No. **COVID-19 app:** No. **Government app:** No.
- **Financial features:** None.
- **Health:** None.

## Data safety form

Declare exactly this (it matches PRIVACY.md — keep them in sync forever):

- **Does your app collect or share any of the required user data types?** → **No.**
  - Rationale: microphone audio is processed ephemerally on-device and never stored or transmitted, which under Play's definitions is not "collection." Progress/settings live only in local app storage.
- **Is all of the user data collected by your app encrypted in transit?** → N/A (no data collected).
- **Do you provide a way for users to request that their data is deleted?** → N/A (no data collected).

If analytics, crash reporting, or any network feature is ever added, this form AND PRIVACY.md must be updated first.

## Permissions notes (if the console asks)

- `RECORD_AUDIO`: core functionality — real-time guitar pitch detection for the tuner and play-along lessons; requested in context, foreground only, audio never leaves the device.
- No sensitive/restricted permissions are used. `SYSTEM_ALERT_WINDOW` is explicitly stripped from the manifest at build time.

## Signing

Enroll in **Play App Signing** when creating the app: Google generates and holds the app signing key; the existing keystore (see `docs/KEYSTORE-CI.md`) becomes the **upload key** that signs the AAB.

## New personal account gate

Personal developer accounts created after 2023-11-13 must run a **closed test with 12 testers opted in continuously for 14 days** before production access can be requested. Plan for this: create the closed track, upload the AAB, recruit testers early, and don't let them opt out mid-window.
