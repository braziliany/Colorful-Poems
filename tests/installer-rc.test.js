const assert = require("assert")
const fs = require("fs")
const vm = require("vm")

const branch = "codex/v1.1.2-offline-cache"
const expectedVersion = "1.1.2"
const stableNames = ["Colorful-Poems", "彩云诗词桌面天气"]
const rcInstaller = fs.readFileSync("Installer-RC.js", "utf8")
const source = rcInstaller.replace(
  /try \{\s*await main\(\)[\s\S]*$/,
  "globalThis.__rcInstaller = { CONFIG, isPinnedRcUrl, assertSafeRcScriptName, normalizeRcManifest, extractVersion, extractCaiyunToken, injectCaiyunToken, assertRcTargetPath }"
)
const context = { globalThis: {} }
vm.runInNewContext(`(async () => { ${source} })()`, context)
const api = context.globalThis.__rcInstaller

assert(api, "RC installer helpers should be exposed")
assert.strictEqual(api.CONFIG.version, expectedVersion)
assert.strictEqual(api.CONFIG.branch, branch)
assert(api.CONFIG.displayName.includes(`v${expectedVersion} RC`))
assert(api.isPinnedRcUrl(api.CONFIG.manifestUrl))
assert(!api.CONFIG.manifestUrl.includes("/main/"))

const manifest = JSON.parse(fs.readFileSync("manifest.rc.json", "utf8"))
const normalized = api.normalizeRcManifest(manifest)
assert.strictEqual(normalized.version, expectedVersion)
assert.strictEqual(normalized.branch, branch)
assert.strictEqual(normalized.resources.length, 1)

const resource = normalized.resources[0]
assert(resource.scriptName.endsWith(" RC"))
assert(!stableNames.includes(resource.scriptName))
assert(api.isPinnedRcUrl(resource.sourceUrl))
assert(!resource.sourceUrl.includes("/main/"))
assert.throws(() => api.assertSafeRcScriptName("Colorful-Poems"))
assert.throws(() => api.assertSafeRcScriptName("folder/widget RC"))
assert.strictEqual(
  api.isPinnedRcUrl("https://example.com/main/widget.js"),
  false
)

const widget = fs.readFileSync("src/widget.js", "utf8")
assert(widget.includes(resource.marker))
assert.strictEqual(api.extractVersion(widget), expectedVersion)
assert(widget.includes('const apiKey = "YOUR_CAIYUN_API_KEY"'))

const installed = api.injectCaiyunToken(widget, "rc-device-token-123")
assert.strictEqual(api.extractVersion(installed), expectedVersion)
assert.strictEqual(api.extractCaiyunToken(installed), "rc-device-token-123")
assert(!installed.includes("YOUR_CAIYUN_API_KEY"))

const fakeFileManager = {
  documentsDirectory() { return "/documents" },
  joinPath(base, name) { return `${base}/${name}` }
}
const rcPath = `/documents/${resource.scriptName}.js`
assert.doesNotThrow(() =>
  api.assertRcTargetPath(fakeFileManager, rcPath, resource.scriptName)
)
for (const stableName of stableNames) {
  assert.throws(() =>
    api.assertRcTargetPath(
      fakeFileManager,
      `/documents/${stableName}.js`,
      resource.scriptName
    )
  )
}

for (const forbiddenMainUrl of rcInstaller.match(/https:\/\/[^"\s]+/g) || []) {
  assert(!forbiddenMainUrl.includes("/main/"))
}

const stableInstaller = fs.readFileSync("Installer.js", "utf8")
const stableManifest = fs.readFileSync("manifest.json", "utf8")
assert(stableInstaller.includes("/main/manifest.json"))
assert(stableManifest.includes("/main/src/widget.js"))

console.log("RC installer tests passed")
