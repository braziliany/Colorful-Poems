const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const widget = fs.readFileSync("src/widget.js", "utf8");
const start = widget.indexOf("function createCacheManager(");
const end = widget.indexOf("function debugLog(message)", start);
assert(start >= 0 && end > start, "cache helpers should exist");
const helpers = widget.slice(start, end);

const context = {
  Date, JSON, Number, Object, String, console,
  widgetRenderedAt: new Date("2026-08-25T03:00:00.000Z"),
  debugLog() {},
  isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  },
  asObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
  },
  safeText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  },
  pad2(value) {
    return String(value).padStart(2, "0");
  }
};
vm.createContext(context);
vm.runInContext(helpers + "\nglobalThis.cacheApi = { createCacheManager, loadLastKnownGood, getWeatherStatusText };", context);

const { createCacheManager, loadLastKnownGood, getWeatherStatusText } = context.cacheApi;

function createMemoryFileManager() {
  const files = new Map();
  return {
    files,
    joinPath(base, name) { return base + "/" + name; },
    fileExists(path) { return files.has(path); },
    readString(path) { return files.get(path); },
    writeString(path, content) { files.set(path, content); }
  };
}

const valid = value => value && Number.isFinite(value.temperature);
const fallback = { temperature: "--" };
const fixedNow = new Date("2026-08-25T02:30:00.000Z");

(async () => {
  const fm = createMemoryFileManager();
  const manager = createCacheManager(fm, "/documents", "Widget");
  const live = await loadLastKnownGood(manager, "weather", async () => ({ temperature: 28 }), valid, fallback, () => {}, () => fixedNow);
  assert.strictEqual(live._source, "network");
  assert.strictEqual(live.temperature, 28);
  assert.strictEqual(live._successfulFetchedAt, fixedNow.toISOString());
  assert.strictEqual(live._widgetRenderedAt, "2026-08-25T03:00:00.000Z");
  const cachePath = "/documents/Widget-cache-v1-weather.json";
  const saved = JSON.parse(fm.files.get(cachePath));
  assert.strictEqual(saved.schemaVersion, 1);
  assert.strictEqual(saved.successfulFetchedAt, fixedNow.toISOString());

  const writeFailureFm = createMemoryFileManager();
  writeFailureFm.writeString = () => { throw new Error("disk full"); };
  const writeFailureManager = createCacheManager(writeFailureFm, "/documents", "WriteFailure");
  const writeFailureResult = await loadLastKnownGood(writeFailureManager, "weather", async () => ({ temperature: 27 }), valid, fallback, () => {}, () => fixedNow);
  assert.strictEqual(writeFailureResult._source, "network");
  assert.strictEqual(writeFailureResult.temperature, 27);

  const offline = await loadLastKnownGood(manager, "weather", async () => { throw new Error("offline"); }, valid, fallback);
  assert.strictEqual(offline._source, "cache");
  assert.strictEqual(offline.temperature, 28);
  assert.strictEqual(offline._successfulFetchedAt, fixedNow.toISOString());
  const cacheStatus = getWeatherStatusText(offline);
  assert(cacheStatus.startsWith("缓存 · "));
  assert(!cacheStatus.includes("--"));

  const beforeInvalid = fm.files.get(cachePath);
  const invalidApi = await loadLastKnownGood(manager, "weather", async () => ({ temperature: null }), valid, fallback);
  assert.strictEqual(invalidApi._source, "cache");
  assert.strictEqual(fm.files.get(cachePath), beforeInvalid);

  const firstRunManager = createCacheManager(createMemoryFileManager(), "/documents", "First");
  const firstOffline = await loadLastKnownGood(firstRunManager, "weather", async () => { throw new Error("offline"); }, valid, fallback);
  assert.strictEqual(firstOffline._source, "fallback");
  assert.strictEqual(firstOffline.temperature, "--");
  assert.strictEqual(getWeatherStatusText(firstOffline), "暂无天气数据");

  const corruptFm = createMemoryFileManager();
  corruptFm.files.set("/documents/Broken-cache-v1-weather.json", "{not-json");
  const corruptManager = createCacheManager(corruptFm, "/documents", "Broken");
  const corruptResult = await loadLastKnownGood(corruptManager, "weather", async () => { throw new Error("offline"); }, valid, fallback);
  assert.strictEqual(corruptResult._source, "fallback");

  const partialFm = createMemoryFileManager();
  const partialManager = createCacheManager(partialFm, "/documents", "Partial");
  const objectValid = value => value && typeof value.value === "string";
  for (const key of ["weather", "lunar", "poetry"]) {
    partialManager.write(key, { value: key + "-cached" }, fixedNow.toISOString());
  }
  const partialWeather = await loadLastKnownGood(partialManager, "weather", async () => ({ value: "weather-live" }), objectValid, {}, () => {}, () => fixedNow);
  const partialLunar = await loadLastKnownGood(partialManager, "lunar", async () => { throw new Error("lunar offline"); }, objectValid, {});
  const partialPoetry = await loadLastKnownGood(partialManager, "poetry", async () => { throw new Error("poetry offline"); }, objectValid, {});
  assert.strictEqual(partialWeather._source, "network");
  assert.strictEqual(partialLunar._source, "cache");
  assert.strictEqual(partialPoetry._source, "cache");

  console.log("cache tests passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});