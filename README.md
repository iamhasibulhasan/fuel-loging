# FuelLog

Fuel, mileage, servicing and engine-oil logbook for Android, built with React Native (Expo SDK 58, Expo Router).

© 2026 [Renosia Tech](https://renosiatech.com/). All rights reserved. See [LICENSE](LICENSE).

## Features

- **Multiple vehicles**: motorcycle, scooter, car, SUV, microbus, pickup, truck, bus, CNG/auto, tractor. Each has make, model, year, registration number, fuel type, engine capacity (cc), power (hp/kW/PS), tank size and odometer unit (km/mi).
- **Fuel log**: full or partial fill. The date defaults to today and can be changed for missed entries. Enter odometer, volume (L / US gal / UK gal) and unit price; the total is calculated for you, or enter the total and the volume is worked out. Last price is pre-filled.
- **Service log**: pick from 25+ common jobs (filters, brakes, chain, tyres, battery, tax token…) or add your own. Parts and labour cost are entered separately, and you can set a reminder for the next service by odometer and/or date.
- **Engine oil log**: oil name (defaults to "Engine Oil"), grade, quantity, how many km to use it, price and whether the filter was changed. The dashboard shows a progress bar and the km left before the next change.
- **Dashboard**: odometer, average mileage, fuel cost per km, total spend, oil and service status, this month's summary, a spending breakdown, a 6-month chart and recent activity.
- **Reports**: average, last, best and worst mileage, fuel cost and running cost per km, average fuel price, estimated tank range, monthly charts (cost, litres, distance, mileage) and a month-by-month table.
- **Regions**: Bangladesh is the default (BDT ৳, km, litre, km/L). Presets for India, Pakistan, Nepal, UAE, Saudi Arabia, Qatar, Kuwait, Oman, Malaysia, Singapore, Japan, China, Korea, Germany, France, Italy, UK, USA, Canada and Australia. Currency and units can also be set by hand.
- **Data**: stored offline on the device. JSON backup/restore and CSV export (for Excel or Google Sheets) through the share sheet.

Mileage uses the **full-tank to full-tank** method: the distance between two full-tank fills, divided by all fuel added after the first one. Partial fills between them are counted.

## Development

```bash
npm install
npx expo run:android     # needs Android Studio / JDK 17 locally
npm run typecheck
```

## Automatic APK builds (GitHub Actions)

`.github/workflows/android-apk.yml` builds a release APK:

| Trigger | Result |
| --- | --- |
| Push to `master` / pull request / manual run | APK uploaded as a workflow **artifact** (Actions → run → Artifacts) |
| Push a tag like `v1.0.0` | APK also attached to a **GitHub Release** |

```bash
git tag v1.0.0 && git push origin v1.0.0
```

`versionCode` is the workflow run number, so every new APK installs over the old one.

### Signing with your own key (recommended before sharing publicly)

Without secrets, the APK is signed with the default debug key. To use your own key:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore fuellog.keystore -alias fuellog -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 fuellog.keystore   # copy the output
```

Add these repository secrets (Settings → Secrets and variables → Actions):
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

Keep the keystore file safe. If you lose it, you can't publish updates that install over your existing app. Phones that have the debug-signed build must uninstall it once before installing the first build signed with your key.

## Project layout

```
src/app/            screens (Expo Router)
  (tabs)/           Dashboard, History, Reports, Vehicles, Settings
  fuel.tsx          add/edit fuel entry
  service.tsx       add/edit service
  oil.tsx           add/edit engine oil change
  vehicle.tsx       add/edit vehicle
src/lib/            data store, statistics, units & country presets, backup
src/components/     shared UI
plugins/            Expo config plugin for release signing
```
