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

## Version codes

`android/` is gitignored and CI regenerates it with `expo prebuild --clean`,
so **`expo.android.versionCode` in `app.json` is the only thing that sets
it**. It was unset for the first release, which meant Expo defaulted it to 1
- and once a version-code-1 bundle is on Play, every later upload with the
same code is rejected as a duplicate.

Bump `versionCode` by one for every build you intend to upload, in the same
commit as the change. `expo.version` (the name testers see, e.g. "1.0.1") is
separate and can move at its own pace. `tests/appConfig.test.ts` fails the
build if the code goes missing or drops back to 1.

| Uploaded | versionCode | version |
|---|---|---|
| 2026-08-22, closed testing | 1 | 1.0.0 |
| next | 2 | 1.0.0 |

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

Once set up, shipping a build is one command:

```sh
npm run release
```

That bumps `versionCode`, commits, tags, and pushes. CI builds the signed
AAB and uploads it straight to the closed testing track, with the notes from
`distribution/whatsnew/whatsnew-en-US`. Pass a version to change the name
testers see (`npm run release -- 1.0.1`), or `--dry-run` to see what it
would do first.

It refuses to run on a dirty tree, off `main`, on a duplicate tag, or with
release notes over Play's 500-character limit — all things that otherwise
fail slowly, in CI or at the console.

**The one-time setup** is a service account, because Google will not let CI
authenticate any other way:

1. In Google Cloud, in the project linked to your Play account:
   IAM & Admin -> Service Accounts -> Create. Then Keys -> Add key -> JSON.
   A key file downloads.
2. In Play Console: Users and permissions -> Invite new user -> paste the
   service account's email -> grant it **Release to testing tracks** on this
   app.
3. Add the key to GitHub without it passing through your clipboard:

   ```sh
   gh secret set PLAY_SERVICE_ACCOUNT_JSON < ~/Downloads/your-key.json
   ```

Until that secret exists the publish job skips with a warning and the signed
AAB is still attached to the run as the `app-release-aab` artifact, so you
can always fall back to Option A.

The upload uses `status: completed`, so a tag reaches testers directly. Set
it to `draft` in `.github/workflows/build-release.yml` if you ever want to
review in the console first.

### 2. Add testers

Closed testing needs an email list, and production access needs **12 testers
opted in continuously for 14 days**. In the track: Testers -> Create email
list -> paste addresses -> save. Then share the opt-in link with them and
make sure nobody opts out during the window; the clock restarts if the count
drops below 12.
