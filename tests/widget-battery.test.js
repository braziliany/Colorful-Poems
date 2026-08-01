const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("src/widget.js", "utf8");

function extractFunction(name) {
  const match = source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`));
  assert(match, `${name} should exist`);
  return match[0];
}

const context = {};
vm.runInNewContext(
  `${extractFunction("getBatteryIcon")}\n${extractFunction("getBatteryColor")}\n` +
  "globalThis.batteryApi = { getBatteryIcon, getBatteryColor };",
  context
);

const { getBatteryIcon, getBatteryColor } = context.batteryApi;

assert.strictEqual(getBatteryIcon(100, false), "battery.100");
assert.strictEqual(getBatteryIcon(55, false), "battery.50");
assert.strictEqual(getBatteryIcon(20, false), "battery.25");
assert.strictEqual(getBatteryIcon(10, false), "battery.0");
assert.strictEqual(getBatteryIcon(55, true), "battery.100.bolt");

assert.strictEqual(getBatteryColor(100, false), "#afa6cc");
assert.strictEqual(getBatteryColor(55, false), "#afa6cc");
assert.strictEqual(getBatteryColor(20, false), "#afa6cc");
assert.strictEqual(getBatteryColor(10, false), "#ff453a");
assert.strictEqual(getBatteryColor(55, true), "#30d158");

assert(source.indexOf("getLunarText(lunarInfo)") < source.indexOf("const weatherAlertInfo"));
assert(source.indexOf("getBatteryIcon(batteryLevel, batteryIsCharging)") > source.indexOf("if (weatherControl.UPDATE_TIME)"));

console.log("widget battery tests passed");
