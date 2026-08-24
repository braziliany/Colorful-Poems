const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("Installer.js", "utf8")
  .replace(/try \{\s*await main\(\);[\s\S]*$/, "globalThis.__installer = { normalizeManifest, extractVersion, compareVersions, extractReleaseNotes, extractCaiyunToken, isValidCaiyunToken, injectCaiyunToken, CONFIG };");
const context = { globalThis: {} };
vm.runInNewContext(`(async () => { ${source} })()`, context);
const api = context.globalThis.__installer;

assert(api, "installer helpers should be exposed");
assert.strictEqual(api.CONFIG.version, "1.1.2");
assert.strictEqual(api.extractVersion("// v1.1.2 Polish"), "1.1.2");
assert.strictEqual(api.compareVersions("1.2.0", "1.1.9"), 1);
assert.strictEqual(api.compareVersions("1.1.2", "1.1.2"), 0);
assert.strictEqual(api.compareVersions("1.0.9", "1.1.0"), -1);
assert(api.extractReleaseNotes("## 1.1.2\n\n- hello\n\n## 1.1.0\n- old", "1.1.2").includes("hello"));

const placeholderSource = 'const apiKey = "YOUR_CAIYUN_API_KEY"';
assert.strictEqual(api.extractCaiyunToken(placeholderSource), null);
const injected = api.injectCaiyunToken(placeholderSource, "rotated-token-123");
assert(injected.includes('const apiKey = "rotated-token-123";'));
assert.strictEqual(api.extractCaiyunToken(injected), "rotated-token-123");
assert.throws(() => api.injectCaiyunToken(placeholderSource, "short"));
const realWidget = fs.readFileSync("src/widget.js", "utf8");
const installedWidget = api.injectCaiyunToken(realWidget, "rotated-token-123");
assert.strictEqual(api.extractCaiyunToken(installedWidget), "rotated-token-123");
assert(!installedWidget.includes("YOUR_CAIYUN_API_KEY"));

const manifest = api.normalizeManifest({
  version: "1.1.2",
  resources: [{ scriptName: "Widget", sourceUrl: "https://example.com/widget.js", marker: "marker" }]
});
assert.strictEqual(manifest.resources.length, 1);
assert.throws(() => api.normalizeManifest({ version: "x", resources: [] }));

console.log("installer tests passed");
