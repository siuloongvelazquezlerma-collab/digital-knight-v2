const fs = require('fs');
const twaManifestPath = 'twa-manifest.json';

const manifest = JSON.parse(fs.readFileSync(twaManifestPath, 'utf8'));
manifest.launcherActivityMetadata = {
  "android.support.customtabs.trusted.DISABLE_LAUNCH_AS_BROWSER": "true"
};
fs.writeFileSync(twaManifestPath, JSON.stringify(manifest, null, 2));
console.log("✅ Añadido launcherActivityMetadata correctamente");
