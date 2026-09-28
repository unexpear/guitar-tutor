# UI review: evaluated implementation plan

Status: evaluated implementation and UI verification complete. Scope: the two supplied UI reviews (sections 1–85) and September phone screenshots. This is a refinement of the current app, not a new product or release authorization. Optional proposals that were adjusted or deferred are explicitly accounted for below.

## Evaluation

The reviews correctly identify a weak tuner hierarchy, overflowing settings controls, inconsistent card density, an excessively long collection, hidden navigation labels, and explanations that precede actions. Many sections repeat the same issues; the work below consolidates them into testable changes.

Corrections to the proposed examples:

- “4 gifts” means four collected guitars, not four unopened boxes. Keep one free daily claim and existing 50/30/15/5 odds and seven-day guarantee.
- Bodies are already free. Only finishes have level requirements. Do not create body locks or change progression.
- Two columns are a default, not an accessibility requirement. Use fewer columns when text needs space.
- Chord details, favorites, filters, lessons, audio controls, and song modes already exist. Improve their presentation without duplicating them.
- The full guitar must remain visible in the tuner. Do not replace it with a headstock or hide it in a menu.
- Example copyrighted songs are illustrative, not permission to add recordings.
- Keep the existing six activities; no new home screen, currencies, payments, or automatic release.

## Ordered work and acceptance checks

- [x] Shared foundation: spacing/type/width/touch-size tokens, reusable search and controls, labeled navigation and clear selected states.
- [x] Tuner: compact preset, note/cents/direction before decoration, full guitar and string targets, accessible start/stop, no collapsed readout, landscape layout.
- [x] Signal help and large display: truthful idle state, state-specific guidance, scroll-safe help, concise diagnostics, optional explanation, safe-area controls.
- [x] Settings: category-first disclosure, advanced tester tools remain available, controls wrap beneath labels rather than crushing them; preserve every setting and reset safeguards.
- [x] Collection: Owned / Daily Gift / Unlocks; owned subcategories, equipped summary, responsive visual grids, filtering/sorting and preview/equip without many live 3D views.
- [x] Daily gift: claim/status before rules, explicit collected count, accurate streak guarantee, transparent odds disclosure and persistence feedback.
- [x] Guitar imagery: consistent framing and honest preview relationship to the equipped model; no misleading claim that older thumbnails are live 3D.
- [x] Songs: readable titles, concise metadata, consistent search/filter/sort and useful empty states; preserve playback and rights information.
- [x] Chords: consistent search/filter/empty states and readable grid/detail actions; preserve fingering and working audio.
- [x] Learn and games: readable cards, existing curriculum/progress, one clear starter recommendation and difficulty hierarchy.
- [x] Metronome: preserve tempo/audio behavior; explain beat accents and improve controls where needed.
- [x] Accessibility/responsiveness: 48-point actions, visible navigation names, large-text reflow, tablet width limits, landscape, one vertical scroll owner per screen.
- [x] Verification: focused regression tests, full tests/typecheck/Android bundle, browser layout checks with explicitly documented native-device limitations.

## Guardrails and exclusions

Avoid a wholesale shared-component rewrite. Reuse existing Expo Router headers, native controls, cards, and stores. Introduce reusable components only where two or more screens need the same behavior. Keep all audio assets, tuning tolerances, saved collections and lesson/game progress intact.

Do not add last-tab startup, a dashboard, new scoring rules, or artificial loading skeletons without a demonstrated need. Do not force normal-size layouts on accessibility text. Existing standalone generator work and release automation are outside this UI pass.

## Evidence and reference behavior

- Tuner readout had `flex: 1`, `flexShrink: 1`, and `minHeight: 0` inside its scroll content below tall controls; phone screenshot shows only the note circle above the fixed action.
- Settings uses a horizontal label plus unconstrained wrapping choice group; phone screenshot shows labels broken into fragments.
- Locker forces one column below 380 points or above 1.2 text scale and streams bodies, gifts, and finishes together.
- Navigation explicitly hides labels above 1.4 text scale.
- Signal help reports idle microphone diagnostics as if audio were already being captured; stage mode displays a false zero-cent value with no note.

Official references checked before implementation:

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Router tabs](https://docs.expo.dev/router/advanced/tabs/)
- [React Native ScrollView](https://reactnative.dev/docs/scrollview)
- [React Native responsive dimensions](https://reactnative.dev/docs/usewindowdimensions)
- [React Navigation bottom tabs and sidebar options](https://reactnavigation.org/docs/bottom-tab-navigator/), cross-checked against the installed Expo Router implementation.

## Verification log

### Automated checks, 2026-09-19

- App tests: **345 passed**, including six new UI/cache/status regression tests. Existing audio, chord, tuner, rewards, persistence, lesson and practice tests remain green.
- Guitar studio tests: **32 passed**.
- TypeScript: passed. Offline 3D scene freshness: passed (2,086,107 bytes).
- Android export: passed, including 191 bundled assets. The initial Metro cache-version warning recovered by rebuilding the cache; it did not prevent export.
- Native Android debug build: passed. Refreshed the ignored native project without cleaning or dependency updates because its old generated manifest still locked portrait, whereas the current app configuration permits rotation. The package manifest was not changed.
- Whitespace/error check: passed; Git reports only normal Windows line-ending conversion warnings.

### Render and interaction checks

The ignored `output/playwright/ui-harness.*` uses the real screen components with React Native Web, simulated native services, isolated browser storage, and the actual offline 3D renderer. It is a layout harness, not a second production app or an audio test.

- Captured all eight main views at 393 × 852, 320 × 640, 844 × 390 and 1200 × 800. No document-level horizontal overflow in the 24 small/landscape/tablet checks.
- Captured all eight at 2× simulated text size. Cards and settings reflow; collections reduce columns. At accessibility sizes scrolling is intentional. Browser navigation is a harness stand-in, so actual tab labels were checked natively.
- Expanded Advanced Tuning at 2× text: zone choices and reference-pitch controls remain readable and reachable.
- Daily gift: claim, disabled same-day claim, equip, reload and retained ownership/equipped summary checked with isolated test data. Locked finish detail has a disabled equip action. No user collection was reset.
- Chord search empty-state recovery restores the library. Song library/difficulty filters combine correctly (41 total → 15 references → four hard references); Saved empty-state recovery clears all filters and restores 41 items.
- All 30 locked finishes produced previews in the browser. Cards share one reusable renderer; the cache is expendable, bounded to 500 KB and independent of ownership. Corrupt images fall back to the explicit 3D-preview action.
- The final higher-resolution thumbnail revision was decoded and checked: all six bodies plus a collected guitar render at 288 × 384; those seven images use approximately 53 KB of cache, below the limit.
- Actual Android API 36 emulator at 1.5× text: tuner readout, six labeled tabs, complete guitar, collection navigation and actual generated thumbnail images observed. An initially graphics-disabled emulator exercised the fallback; with host graphics enabled, the 3D renderer and hidden thumbnail worker both rendered successfully.
- Native landscape testing caught cutout insets squeezing sidebar labels and default item margins pushing Tempo off screen. The rail now reserves the cutout width and shares vertical space across six actions; all labels, six strings, the readout and start action are visible in the final Android landscape capture. Native portrait Settings categories and expanded Advanced Tuning controls are also readable at 1.5× text.
- Representative artifacts (under `output/playwright/`): `android-tuner-final.png`, `android-landscape-final.png`, `android-settings-final.png`, `android-settings-tuning-final.png`, `android-collection.png`, `ui-locker-bodies-final.png`, `ui-gift-owned-reloaded.png`, `ui-settings-tuning-large.png`, `ui-stage-landscape.png`, and the `ui-<screen>-<width>.png` matrix.

Microphone accuracy, speaker output, real-device GPU speed, and full TalkBack operation are **not** established by these UI checks. No audio engine, asset bank, game scoring, reward odds or ownership store was changed. A physical-phone smoke test remains appropriate before release; publishing is not part of this goal.

## Full review disposition

The two documents repeat proposals at increasing detail. This matrix accounts for every numbered section rather than treating 85 sections as 85 separate rewrites.

| Review sections | Disposition |
| --- | --- |
| 1–3, 15–24 | Shared layout/type/width tokens, search and choice controls; existing six-activity navigation retained with visible labels. |
| 4, 25–26 | Readout first, compact configuration on short phones, readout/guitar columns in landscape, fixed start/stop, full guitar preserved. Secondary tools may scroll on short screens. |
| 5, 27 | Large display has explicit cents, truthful idle state, optional explanation and reachable exit/start/stop. |
| 6, 28 | Signal help distinguishes stopped, starting, quiet, noisy, unstable, clear and error states. |
| 7, 30–31 | Short lesson catalog summaries, readable titles, retained complete lesson instructions/quizzes/practice, safe back controls. No curriculum rewrite. |
| 8, 32–33 | One featured beginner start, difficulty sections, wrapping game cards and readable progress summary. |
| 9, 34 | Songs/exercises retain truthful content labels, get search/filter/sort, readable titles and compact metadata. Rights/audio information stays in detail. |
| 10, 35 | Responsive chord grid, shared search, type sheet, Saved empty state and recovery action; fingering/audio retained. |
| 11–12, 36–41 | Owned / Daily Gift / Unlocks, category grids, accurate thumbnails, preview/equip details, explicit locks/XP, action-first daily gift with odds disclosure. “Gifts” is not an unopened-box currency. |
| 13, 29 | Metronome controls and beat explanation improved; clock/tempo behavior unchanged. |
| 14, 42–43 | Collapsible settings categories, stacked choice groups and advanced tester tools; reset confirmations retained. |
| 44–52 | Safe-area headers, consistent selected states and action hierarchy, improved muted contrast, width limits, 48-point controls and one vertical scroll owner. |
| 53–56 | Useful search/collection empty states, explicit loading and retry/fallback states, contextual beginner guidance. Existing questionnaire is retained; no new onboarding carousel or persistent hint-dismissal state. |
| 57–59 | Lessons, minutes, XP and check-ins keep separate labels. No new currencies/dashboard; last-tab startup deferred as an unrelated behavior change. |
| 60 | Collection and guitar detail are full-screen presentations with back handling. Existing song/chord/lesson details remain scroll-safe native modals; no unnecessary navigation-stack rewrite. |
| 61–63 | Shared search/clear control, separate filter/sort controls, meaningful sort choices. “Recently played” not added without a reliable recency field; body type is a filter rather than a misleading rarity sort for free bodies. |
| 64–66 | Width/font-aware grids, compact tuner, landscape arrangement, large-display layout and text reflow. Tab labels stay visible at a bounded size while retaining accessible names. |
| 67–70 | Utility/navigation icon semantics and naming standardized. Playful game art remains content art. “My Guitars,” “Daily Gift,” and “Large display” are explicit; fixed imported finishes are not falsely recolored. |
| 71–82 | Consolidated priorities above implemented, including primary information before decorative/explanatory content. |
| 83–85 | Foundation → tools → libraries/settings → verification order followed. Existing dark identity, full guitar visual, diagrams, activities and progression preserved. |

Deliberate adjustments: “New” is not a permanent ownership state; collection order is newest first and acquisition dates are shown in detail. Example song titles, invented remaining-box counts, forced two-column large-text grids, added currencies and speculative home behavior were not implemented. These are corrections to the proposed plan, not removed user content.
