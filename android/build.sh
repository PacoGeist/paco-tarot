#!/bin/bash
# Builds android/releases/PacoTarot.apk from the shared web app in ../iphone.
# The version comes from ../iphone/version.json ("version" and "androidVersionCode").
# The signing key is NOT in this repository. By default it is read from ../../keys/ (next to the repo folder):
#   keys/tarot.keystore   and   keys/signing.env  containing  KS_PASS=yourpassword
# or set KEYSTORE=/path/to/tarot.keystore and KS_PASS=... yourself. Every update must use the same key.
set -e
cd "$(dirname "$0")"
SDK=${ANDROID_SDK:-/opt/android-sdk}; BT=$SDK/build-tools/35.0.0; AJ=$SDK/platforms/android-35/android.jar
KEYS=${KEYS:-../../keys}
[ -f "$KEYS/signing.env" ] && . "$KEYS/signing.env"
KEYSTORE=${KEYSTORE:-$KEYS/tarot.keystore}
[ -f "$KEYSTORE" ] || { echo "Signing key not found at $KEYSTORE (see the comments at the top of build.sh)"; exit 1; }
[ -n "$KS_PASS" ] || { echo "Set KS_PASS (the keystore password), e.g. in $KEYS/signing.env"; exit 1; }
read VN VC < <(python3 -c "import json;v=json.load(open('../iphone/version.json'));print(v['version'],v['androidVersionCode'])")
echo "Building version $VN (versionCode $VC)"

rm -rf build && mkdir -p build/res build/gen build/classes build/assets releases
cp -r ../iphone build/assets/www
# web-app-only files are not needed inside the Android app
rm -rf build/assets/www/sw.js build/assets/www/files.json build/assets/www/manifest.webmanifest build/assets/www/icons build/assets/www/.nojekyll
$BT/aapt2 compile --dir res -o build/res/res.zip
$BT/aapt2 link -I $AJ --manifest AndroidManifest.xml -o build/base.apk build/res/res.zip -A build/assets --java build/gen --min-sdk-version 24 --target-sdk-version 35 --version-code $VC --version-name $VN --replace-version -0 jpg -0 woff2
javac -nowarn --release 11 -classpath $AJ -d build/classes $(find src build/gen -name '*.java') 2>&1 | grep -v "warning\|^Note:" || true
$BT/d8 --lib $AJ --min-api 24 --release --output build $(find build/classes -name '*.class')
(cd build && zip -q -j base.apk classes.dex)
$BT/zipalign -f -p 4 build/base.apk build/aligned.apk
$BT/apksigner sign --ks "$KEYSTORE" --ks-key-alias ${KS_ALIAS:-tarot} --ks-pass pass:$KS_PASS --key-pass pass:${KEY_PASS:-$KS_PASS} --out releases/PacoTarot.apk build/aligned.apk
rm -f releases/PacoTarot.apk.idsig
$BT/apksigner verify releases/PacoTarot.apk && ls -la releases/PacoTarot.apk
