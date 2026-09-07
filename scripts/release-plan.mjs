export function releasePlan(args, app, pkg, lock, notes) {
  const versions = args.filter(arg => /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(arg));
  if (versions.length > 1 || args.some(arg => arg !== '--dry-run' && !versions.includes(arg))) throw Error('Usage: npm run release -- [X.Y.Z] [--dry-run]');
  const code = app.expo?.android?.versionCode;
  if (!Number.isSafeInteger(code) || code < 1 || code >= 2100000000) throw Error('Invalid Android versionCode');
  if (!notes.trim() || [...notes].length > 500) throw Error('Release notes must contain 1–500 characters');
  const version = versions[0] ?? app.expo.version;
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw Error('Invalid app version');
  if (!lock.packages?.['']) throw Error('Missing root package-lock entry');
  const nextApp = structuredClone(app), nextPkg = structuredClone(pkg), nextLock = structuredClone(lock);
  nextApp.expo.version = nextPkg.version = nextLock.version = nextLock.packages[''].version = version;
  nextApp.expo.android.versionCode = code + 1;
  return { app: nextApp, pkg: nextPkg, lock: nextLock, tag: `v${version}-${code + 1}`, dryRun: args.includes('--dry-run') };
}
export function confirmPublished(run) {
  if (run.status !== 'completed' || run.conclusion !== 'success') throw Error('Release workflow did not succeed');
  const steps = (run.jobs ?? []).flatMap(job => job.steps ?? []);
  for (const name of ['Build release AAB (Play Store)', 'Upload to Play closed testing track']) {
    if (!steps.some(step => step.name === name && step.conclusion === 'success')) throw Error(`${name} did not succeed (possibly skipped). Release is not confirmed.`);
  }
}
