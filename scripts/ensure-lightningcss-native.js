/**
 * npm sometimes installs lightningcss-win32-x64-msvc without the .node binary
 * (antivirus / optional-deps). Extract it from the published tarball when missing.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

if (process.platform !== "win32") {
  process.exit(0);
}

const pkgDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "lightningcss-win32-x64-msvc"
);
const nodeFile = path.join(pkgDir, "lightningcss.win32-x64-msvc.node");
const fallback = path.join(
  __dirname,
  "..",
  "node_modules",
  "lightningcss",
  "lightningcss.win32-x64-msvc.node"
);

if (fs.existsSync(nodeFile)) {
  if (!fs.existsSync(fallback)) {
    fs.copyFileSync(nodeFile, fallback);
  }
  process.exit(0);
}

const pkgJson = require(path.join(pkgDir, "package.json"));
const version = pkgJson.version;
const root = path.join(__dirname, "..");
const tgz = path.join(root, `lightningcss-win32-x64-msvc-${version}.tgz`);

console.log("[postinstall] Restoring lightningcss native binary for Windows…");

if (!fs.existsSync(tgz)) {
  execSync(`npm pack lightningcss-win32-x64-msvc@${version}`, {
    cwd: root,
    stdio: "inherit",
  });
}

execSync(
  `tar -xzf "${tgz}" -C "${pkgDir}" --strip-components=1 package/lightningcss.win32-x64-msvc.node`,
  { cwd: root, stdio: "inherit", shell: true }
);

if (fs.existsSync(nodeFile)) {
  fs.copyFileSync(nodeFile, fallback);
  console.log("[postinstall] lightningcss native binary restored.");
} else {
  console.warn(
    "[postinstall] Could not restore lightningcss binary. Add an antivirus exclusion for node_modules or install Microsoft Visual C++ Redistributable."
  );
}
