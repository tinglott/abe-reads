# Publishing to Google Play Store

This guide covers the full path from this repo to a published Android app on
Google Play. It uses **EAS Submit** — you do not need Android Studio or a local
Android SDK.

> Pre-requisites: a **Google Play Developer account** ($25 one-time,
> play.google.com/console). Builds themselves run on Expo's free cloud
> (no Xcode/Android Studio needed), as described in the README.

---

## 1. Build the production Android App Bundle

```bash
npx eas-cli login
npx eas-cli build:configure      # links project; writes projectId into app.json
npx eas-cli build --profile production --platform android
```

This produces an **.aab** (Android App Bundle) — required by Google Play.
(For a side-loadable file, use `--profile apk` instead; the Play Store wants
the .aab.)

Download the artifact from the EAS build page, or let EAS Submit upload it
directly (step 4).

---

## 2. Create the app in Google Play Console

1. Go to **Play Console → All apps → Create app**.
   - App name: **Abe Reads**
   - Default language: English (United States)
   - App or game: **App**
   - Free / Paid: choose **Free**
2. Complete the **Play App Signing** step. Google signs your .aab with the
   upload key — **download and keep the "Upload key certificate"** it shows.
   (EAS also manages signing; the simplest path is to let EAS generate an
   upload key and let Play sign it. If Play asks for an existing key, choose
   "Export and upload a key from Java keystore" and follow EAS's instructions.)
3. Fill **Store listing**: title, short/long description, category
   (Education), and **at least 2 phone screenshots + a feature graphic + icon**
   (use `assets/icon.png` and the screenshots in `docs/`).
4. Complete **App content** (privacy policy URL, target audience = "Older users /
   Ages 13+ or appropriate; this app is for young readers but declares 13+ to
   avoid the stricter "Designed for Families" flow — adjust if you target
   under-13), and **Data safety** (the app collects no personal data; state
   that clearly).

> ⚠️ **Content rating for kids:** This app is for children. If you want it in
> the "Designed for Families" program, answer the target-age questions for
> under-13 and follow Google's teacher/parental guidance rules. Keep it simple:
> declare **13+** unless you intend the Families program.

---

## 3. Create a service account (for automated uploads)

EAS Submit uploads via a **Google service account**, not your personal login.

1. In Play Console → **Settings → API access → Create new service account**.
2. Click **Google Cloud Platform** link it gives you → **Create service account**
   → give it a name → **Create and continue**.
3. Grant role **Service Account User** (or none at org level; Play grants per-app).
4. Open the account → **Keys → Add key → Create new key → JSON** → download it.
5. **Save that file as `google-service-account.json` in this project root.**
   (It is git-ignored — do not commit it. Anyone with it can upload to your app.)
6. Back in Play Console → **API access**, click the service account →
   **Grant access** → choose your app → role **Release manager** (or Admin).

Test access first with the **internal** track (below) before promoting.

---

## 4. Submit the build

The `submit.production.android` block in `eas.json` already points at
`./google-service-account.json` and the `internal` track. Submit:

```bash
npx eas-cli submit --platform android --profile production
```

EAS reads `google-service-account.json`, uploads the .aab, and creates a
**draft release** on the configured track.

---

## 5. Move through the tracks to public

Google Play uses staged tracks. Promote in Play Console:

```
internal  →  closed (alpha)  →  open (beta)  →  production
```

- **Internal** (up to 100 testers): instant, for you + family to test.
- **Closed**: invite testers by email/CSV.
- **Open / Production**: public. Roll out gradually (5% → 100%) — recommended.

To change the default submit track, edit the `track` field in `eas.json`
(`internal` | `alpha` | `beta` | `production`). For a first public launch,
keep `internal` for the automated submit and promote manually, OR set it to
`production` once you're confident.

---

## 6. Privacy policy (required for publishing)

Google requires a privacy policy URL. The app:
- collects **no** personal data,
- stores progress **on-device only** unless Supabase keys are configured (then
  it uses anonymous auth, no email/name),
- only contacts the network for (a) optional Supabase sync, (b) optional Hugging
  Face AI questions, (c) Microsoft's free read-aloud voices.

A minimal policy is enough: "Abe Reads stores reading progress locally on your
device. No personal information is collected or shared. Optional cloud features
use anonymous identifiers." Host the text on GitHub Pages or any static site and
paste the URL into Play Console.

---

## Quick checklist

- [ ] `eas build --profile production --platform android` succeeded
- [ ] Play Console app created; signing + store listing done
- [ ] `google-service-account.json` present locally (not committed)
- [ ] Service account granted Release Manager on the app
- [ ] `eas submit --platform android --profile production` → draft on internal
- [ ] Tested on a real device via internal track
- [ ] Privacy policy URL added
- [ ] Promoted internal → production (gradual rollout)
