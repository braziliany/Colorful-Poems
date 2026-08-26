const assert = require("assert");
const fs = require("fs");

const source = fs.readFileSync("src/widget.js", "utf8");

for (const forbidden of [
  "getBatteryIcon", "getBatteryColor", "getBatteryLevel",
  "getBatteryChargingState", "Device.batteryLevel", "Device.isCharging",
  "batteryStr", "batteryColor", "battery.100"
]) {
  assert(!source.includes(forbidden), forbidden + " should be removed");
}

assert(source.includes("getWeatherStatusText(weatherInfo)"));
assert(source.includes("缓存 · "));
assert(source.includes("更新于 "));
assert(source.includes("暂无天气数据"));

console.log("widget UI cleanup tests passed");