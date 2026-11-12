// Extends app.json. CI sets VERSION_CODE / VERSION_NAME so every APK can
// be installed over the previous one.
module.exports = ({ config }) => {
  const versionCode = Number(process.env.VERSION_CODE) || config.android.versionCode || 1;
  const version = process.env.VERSION_NAME || config.version;
  return {
    ...config,
    version,
    android: { ...config.android, versionCode },
  };
};
