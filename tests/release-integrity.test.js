const assert = require("assert");
const fs = require("fs");

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const installer = fs.readFileSync("Installer.js", "utf8");
const widget = fs.readFileSync("src/widget.js", "utf8");
const gitignore = fs.readFileSync(".gitignore", "utf8");

assert.strictEqual(manifest.version, packageJson.version);
assert.strictEqual(packageJson.version, packageLock.version);
assert(installer.includes(`version: "${manifest.version}"`));
assert(widget.includes(`v${manifest.version}`));

for (const resource of manifest.resources) {
  assert(resource.sourceUrl.startsWith("https://"), `${resource.scriptName} must use HTTPS`);
  assert(fs.existsSync(resource.sourcePath), `${resource.sourcePath} must exist`);
  const content = fs.readFileSync(resource.sourcePath, "utf8");
  assert(content.includes(resource.marker), `${resource.scriptName} marker must match`);
}

assert(/const\s+apiKey\s*=\s*["']YOUR_CAIYUN_API_KEY["']\s*;?/.test(widget));
assert.strictEqual((widget.match(/const\s+apiKey\s*=/g) || []).length, 1);
assert(widget.includes("const DEBUG = false"));
assert(!/(?:^|[^A-Za-z])log\s*\(\s*`定位信息：/.test(widget));
assert(!/(?:^|[^A-Za-z])log\s*\(\s*`电池==>/.test(widget));
assert(/debugLog\s*\(\s*`定位信息：/.test(widget));

assert(!/getBattery|Device\.(?:batteryLevel|isCharging)|batteryStr|batteryColor/.test(widget));
assert(widget.includes("const widgetRenderedAt = currentDate"));
assert(widget.includes("_widgetRenderedAt: widgetRenderedAt.toISOString()"));
for (const cacheKey of ["weather", "lunar", "poetry"]) {
  const cachePattern = new RegExp(`loadLastKnownGood\\(\\s*cacheManager,\\s*"${cacheKey}"`);
  assert(cachePattern.test(widget), cacheKey + " should use independent cache");
}

for (const rule of ["*.key", "*.token", "config.private.js", ".env"]) {
  assert(gitignore.split(/\r?\n/).includes(rule), `${rule} must be ignored`);
}

console.log("release integrity tests passed");
