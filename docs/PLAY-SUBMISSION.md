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

## Closed test release — remaining manual steps

Console state as of the branding release: app created, all App content
declarations complete, store listing published with the branded icon,
feature graphic and six screenshots, and the closed testing track
("Closed testing - Alpha") targeted at 177 countries.

Two things still need a human, because browser automation cannot do them:

### 1. Upload the app bundle

Two ways. The second one is a one-time setup that removes this step forever.

#### Option A - drag it in once (fastest right now)

1. Download the `app-release-aab` artifact from the latest green CI run
   (or use the copy already at `dist-play/app-release.aab`).
2. Open the release: Test and release -> Testing -> Closed testing ->
   Manage track -> Create new release.
3. Drag the `.aab` onto the "App bundles" drop zone and wait for processing.
4. Release name: `1 (1.0.0) - first closed test`
5. Release notes (paste inside the existing `<en-US>` tags):

```
First closed test build of StandardTune.

- Real-time tuner with 16 tunings and per-string in-tune indicators
- Chord library with 29 chords, diagrams, and reference audio
- Play-along practice drills that listen to your guitar
- Beginner to advanced lessons with an interactive guitar anatomy quiz
- Metronome with tap tempo and multiple time signatures

Everything runs offline and audio never leaves your device. Please report
anything that misbehaves, especially tuner accuracy on your instrument.
```

6. Save -> Next -> Send for review / start rollout.

Note: Play refuses to save the release draft (name and notes included) until
a bundle is attached, so do the upload first.

#### Option B - let CI upload it (recommended)

`.github/workflows/build-release.yml` has a `publish` job that pushes the
signed AAB to the closed-testing track on every `v*` tag. It stays dormant
until you add one secret:

1. In Google Cloud, create a service account and a JSON key for it.
2. In Play Console: Users and permissions -> Invite new users -> paste the
   service account email, grant it access to this app with the "Release to
   testing tracks" permission.
3. In GitHub: Settings -> Secrets and variables -> Actions -> new secret
   `PLAY_SERVICE_ACCOUNT_JSON`, pasting the whole JSON key file.
4. Tag a release: `git tag v1.0.0 && git push origin v1.0.0`.

The job uploads as a **draft** release (review and roll out in the console).
Change `status: draft` to `completed` in the workflow once you want tags to
reach testers directly. Release notes come from
`distribution/whatsnew/whatsnew-en-US`.

### 2. Add testers

Closed testing needs an email list, and production access needs **12 testers
opted in continuously for 14 days**. In the track: Testers -> Create email
list -> paste addresses -> save. Then share the opt-in link with them and
make sure nobody opts out during the window; the clock restarts if the count
drops below 12.
