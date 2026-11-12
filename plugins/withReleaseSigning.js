// Config plugin: sign release builds with your own keystore when the
// FUELLOG_UPLOAD_* gradle properties are provided (set by the GitHub workflow
// from repository secrets). Without them, release falls back to the debug key
// so the CI build still produces an installable APK.
const { withAppBuildGradle } = require('expo/config-plugins');

const SIGNING_BLOCK = `
        release {
            if (project.hasProperty('FUELLOG_UPLOAD_STORE_FILE')) {
                storeFile file(FUELLOG_UPLOAD_STORE_FILE)
                storePassword FUELLOG_UPLOAD_STORE_PASSWORD
                keyAlias FUELLOG_UPLOAD_KEY_ALIAS
                keyPassword FUELLOG_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes('FUELLOG_UPLOAD_STORE_FILE')) return cfg;

    // 1. add a release signing config next to the debug one
    src = src.replace(/signingConfigs\s*\{/, (m) => m + SIGNING_BLOCK);

    // 2. inside buildTypes.release, use it when available
    src = src.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      "$1signingConfig project.hasProperty('FUELLOG_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug"
    );

    cfg.modResults.contents = src;
    return cfg;
  });
};
