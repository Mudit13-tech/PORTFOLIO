import type { Failure } from './types'

/**
 * Crash reports.
 *
 * Each of these was drafted from a real commit in a real repository — the sha,
 * message and date on every entry were read from the GitHub API on 2026-09-20
 * and are reproduced verbatim. The commit is the receipt: anyone can open it.
 *
 * What the commit cannot supply is what it felt like to hit the bug, how long
 * it actually cost, and what was learned. Those fields are reconstructed from
 * what the change itself shows, and every entry carries `confirmed: false`
 * until Mudit has read it and either confirmed or corrected it. The interface
 * renders that flag — an unconfirmed report says so on its face.
 *
 * `cost` is null everywhere for the same reason. A fabricated "6 hours" is
 * exactly the kind of detail that makes a reader doubt the other thirty-six.
 * Fill it in where you remember it; leave it null where you do not.
 */
export const failures: Failure[] = [
  {
    id: 'ota-dev-bundle',
    title: 'OTA update overwrote the development build',
    projectId: 'xceed',
    status: 'broken',
    resolved: true,
    date: '2026-09-13',
    severity: 'high',
    cost: null,
    whatHappened:
      'The over-the-air update mechanism did not distinguish a development build from a released one. A dev build on a device would pull the published bundle and replace its own, so the code being worked on was silently swapped for production the next time the app launched.',
    cause:
      'The OTA check ran unconditionally on startup. Nothing in it asked whether the running build was one that should be accepting updates at all.',
    investigation: [
      'Noticed a dev build running code that was not the code in the working tree.',
      'Traced the launch path to the OTA check, which runs before anything else.',
      'Confirmed the check had no notion of build channel — every install was a candidate.',
    ],
    fix: 'Gate the OTA replacement so a development build keeps its own bundle.',
    lesson:
      'An update mechanism needs to know which builds it is allowed to touch. "Update everything" is the same bug as "update nothing", found later and at worse cost.',
    commit: {
      sha: '21bbd83127',
      message: "Stop OTA replacing a dev build's own bundle",
      repo: 'Xceed-Ios',
    },
    confirmed: false,
  },
  {
    id: 'share-sheet-cancel',
    title: 'Cancelling the iOS share sheet reported a failed download',
    projectId: 'xceed',
    status: 'broken',
    resolved: true,
    date: '2026-09-13',
    severity: 'medium',
    cost: null,
    whatHappened:
      'On iOS, a file downloaded correctly and was handed to the system share sheet. If the user dismissed that sheet — the ordinary way to say "not now" — the app reported the download as failed. The file was on the device the whole time.',
    cause:
      'The dismissal callback was being read as an error path. iOS reports a cancelled share the same way it reports one that never opened, and the code did not separate the two.',
    investigation: [
      'Reproduced by downloading a file and swiping the share sheet away.',
      'Saw the failure toast fire on dismissal, not on any actual download error.',
      'Found the share result being treated as the download result — two different outcomes on one code path.',
    ],
    fix: 'Stop treating a dismissed share sheet as a failed download, and report where the file actually went instead.',
    lesson:
      'A user declining the next step is not a failure of the previous one. Success needs to be recorded when it happens, not inferred from what the user does afterwards.',
    commit: {
      sha: 'a6874c9926',
      message: 'Stop treating a dismissed share sheet as a failed download',
      repo: 'Xceed-Ios',
    },
    confirmed: false,
  },
  {
    id: 'ios-safe-area',
    title: 'The header fought the WebView over the safe area',
    projectId: 'xceed',
    status: 'broken',
    resolved: true,
    date: '2026-09-13',
    severity: 'medium',
    cost: null,
    whatHappened:
      'On the first iOS builds the header sat under the Dynamic Island, a stray line drew across the top of the body, and a cover bar had been added to hide the seam. Each fix moved the problem rather than removing it — the run of commits on 2026-09-13 is the argument going back and forth.',
    cause:
      'The WebView and the page were both trying to own the top inset. Two layers applying the same offset produced either a doubled gap or a visible seam, depending on which one won.',
    investigation: [
      'Covered the top inset and coloured it from the page — hid the seam, did not remove it.',
      'Moved the inset onto the header and dropped the cover bar.',
      'Dropped the body inset that was drawing the line.',
      'Settled it by giving the page ownership of the safe areas outright, instead of the WebView.',
    ],
    fix: 'Own the safe areas in the page instead of the WebView, and let the header carry the inset alone.',
    lesson:
      'When two layers can both apply a layout offset, decide which one owns it before writing either. Most of this was spent undoing compensations for a decision that had never been made.',
    commit: {
      sha: '4801974f6c',
      message: 'Own the safe areas in the page instead of the WebView',
      repo: 'Xceed-Ios',
    },
    confirmed: false,
  },
  {
    id: 'ams-sync-conflict',
    title: 'The automated content sync failed on its own additions',
    projectId: 'xceed',
    status: 'failed',
    resolved: true,
    date: '2026-09-12',
    severity: 'medium',
    cost: null,
    whatHappened:
      'The GitHub Actions job that syncs content from the upstream AMS server stopped on merge conflicts. The conflicts were additive — both sides had added entries to the same list, and nothing was genuinely in contention — but the run failed and the sync stopped landing.',
    cause:
      'The sync used a plain merge and treated every conflict alike. An append on both sides of a list is a conflict to git and not a conflict in fact.',
    investigation: [
      'Found the workflow failing on the merge step rather than on the fetch.',
      'Read the conflicts: both sides appending to the same member list.',
      'Confirmed no edit on either side actually contradicted the other.',
    ],
    fix: "Resolve the sync's additive conflicts by merging both member lists instead of failing the run.",
    lesson:
      'An automated job that stops on a conflict it could have resolved is a job someone has to babysit. Decide up front which conflicts the automation is allowed to settle by itself.',
    commit: {
      sha: '516fa853db',
      message: "Resolve the sync's additive conflicts instead of failing on them",
      repo: 'Xceed-Ios',
    },
    confirmed: false,
  },
  {
    id: 'faceid-split',
    title: 'One biometric implementation did not fit two platforms',
    projectId: 'xceed',
    status: 'broken',
    resolved: true,
    date: '2026-09-13',
    severity: 'medium',
    cost: null,
    whatHappened:
      'Biometric authentication had been written once against Android and reused for iOS. Face ID did not work on the iOS build, and making it work by changing the shared path risked breaking the Android flow that was already shipping to students.',
    cause:
      'A single implementation was covering two platform APIs that only look alike from a distance.',
    investigation: [
      'Confirmed Face ID failing on iOS while Android biometrics kept working.',
      'Established that the shared path could not satisfy both without changing Android behaviour.',
      'Chose to split rather than to generalise further.',
    ],
    fix: 'Split biometric auth by platform, leaving Android exactly as it was.',
    lesson:
      'Sharing code across platforms is worth it until the platforms disagree. At that point a clean split costs less than an abstraction that has to lie to both sides.',
    commit: {
      sha: 'b8bcafa055',
      message: 'Split biometric auth by platform, leaving Android as it was',
      repo: 'Xceed-Ios',
    },
    confirmed: false,
  },
  {
    id: 'ios-download-path',
    title: 'iOS downloads were fetched on the wrong side of the bridge',
    projectId: 'xceed',
    status: 'broken',
    resolved: true,
    date: '2026-09-13',
    severity: 'medium',
    cost: null,
    whatHappened:
      'File downloads on iOS were being performed natively rather than in the WebView. The native fetch did not carry the session the WebView held, so authenticated files came back wrong or not at all, and long-pressing a file link raised an iOS link preview over the app.',
    cause:
      'The download was crossing the Capacitor bridge to native code that had no access to the WebView cookies the request needed.',
    investigation: [
      'Compared an authenticated download in the WebView against the native path.',
      'Moved the fetch back into the WebView, where the session already lives.',
      'Suppressed the iOS link preview on server file links so a long press stopped hijacking the gesture.',
      'Added @capacitor/file-viewer to the iOS pods so attachments could open in place.',
    ],
    fix: 'Fetch iOS downloads in the WebView rather than natively, and open attachments in place instead of handing them to a share sheet.',
    lesson:
      'Crossing a native bridge means leaving the session behind. Before moving work to native, check what the web context was carrying that the native side is not.',
    commit: {
      sha: '1e8958dbec',
      message: 'Fetch iOS downloads in the WebView, not in iOS',
      repo: 'Xceed-Ios',
    },
    confirmed: false,
  },
  {
    id: 'ota-bundle-weight',
    title: 'Notebook runtimes were shipping inside the OTA bundle',
    projectId: 'xceed',
    status: 'broken',
    resolved: true,
    date: '2026-09-12',
    severity: 'low',
    cost: null,
    whatHappened:
      'The over-the-air bundle included notebook runtimes that no installed app needed. Every OTA update pushed that weight to every student phone, over whatever connection they happened to be on.',
    cause: 'The bundle was built by inclusion rather than exclusion, so anything in the tree travelled with it.',
    investigation: [
      'Looked at what the OTA bundle actually contained.',
      'Found runtimes that exist for development and are dead weight on a device.',
      'Excluded them and re-measured.',
    ],
    fix: 'Keep the notebook runtimes out of the OTA bundle.',
    lesson:
      'An update that ships to phones deserves a look at its own payload. Nobody notices bundle weight until it is being sent to real devices on real data plans.',
    commit: {
      sha: '99a4e2e654',
      message: 'Keep the notebook runtimes out of the OTA bundle',
      repo: 'Xceed-Ios',
    },
    confirmed: false,
  },
  {
    id: 'ams-upstream-revert',
    title: 'A local edit to an upstream file had to be reverted',
    projectId: 'xceed',
    status: 'failed',
    resolved: true,
    date: '2026-09-13',
    severity: 'low',
    cost: null,
    whatHappened:
      'A file owned by the upstream AMS source had been modified locally. Because the sync job pulls that file from upstream, the local edit was on a collision course with every future sync, and it was reverted rather than defended.',
    cause:
      'Editing a file that an automated sync owns. The change worked until the next sync, at which point it was either lost or a conflict.',
    investigation: [
      'Identified the file as one the AMS sync overwrites.',
      'Confirmed the local change would conflict on every subsequent run.',
      'Reverted to upstream and moved the change somewhere the sync does not own.',
    ],
    fix: 'Revert the AMS original back to upstream.',
    lesson:
      'In a repository fed by an automated sync, know which files you own before editing one. Anything upstream owns will take your change back eventually.',
    commit: {
      sha: 'f1cc5f53ec',
      message: 'Revert the AMS original back to upstream',
      repo: 'Xceed-Ios',
    },
    confirmed: false,
  },
  {
    id: 'cosmic-ai-planner',
    title: 'COSMIC-AI-PLANNER never got past the repository',
    projectId: null,
    status: 'never-shipped',
    resolved: true,
    date: '2026-07-31',
    severity: 'low',
    cost: null,
    whatHappened:
      'A repository was created for an AI planner and nothing was ever committed to it. It is 0 KB. Five days later COSMOS-LABS- was created and became the project that actually shipped, live on Render.',
    cause:
      'The repository was made before the idea was worked out. The version that shipped started from a different angle — the solar system — which is what made it worth building.',
    investigation: [
      'COSMIC-AI-PLANNER created 2026-07-31, size 0 KB, no commits.',
      'COSMOS-LABS- created 2026-08-05, shipped and deployed.',
    ],
    fix: 'Superseded by COSMOS LABS rather than revived.',
    lesson:
      'An empty repository is a decision recorded, not time lost. This one is five days between an idea that would not start and the one that did.',
    commit: null,
    confirmed: false,
  },
]
