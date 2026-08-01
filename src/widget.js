// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: cloud-sun;

/**
 * 日历 · 天气 · 诗词小组件
 * v1.1.0 · Deep Blue Violet Glass Theme
 *
 * 主要修复：
 * 1. 使用 SFSymbol.named() 返回真正的 Image，移除浏览器 document / Font Awesome 代码
 * 2. 所有图标增加空值与无效名称兜底
 * 3. 天气预警、生活指数、农历和诗词接口增加字段缺失与请求失败兜底
 * 4. 背景图片不存在时不再直接崩溃
 * 5. 修复日程循环中的 return
 * 6. 增加部分新款 iPhone 截图尺寸
 */

// ==============================
// 配置项
// ==============================

const locale = "zh_cn"

// true：深蓝紫主题背景；false：图片或透明背景（缺失时使用主题背景）
const colorMode = false
const bgColorStr = "#000000"

// 仅在 Scriptable App 内运行时使用
const previewSize = "Medium"

// 彩云天气 API Key
const apiKey = "L8lbdhlXj0NOcasX"

// 定位失败时使用的默认位置。
// 建议填写，以免关闭定位权限后天气无法加载。
let locationData = {
  latitude: undefined,
  longitude: undefined,
  locality: undefined,
  subLocality: undefined,
  street: undefined
}

// true：始终使用上面填写的位置；false：优先实时定位
const lockLocation = false

// 在 Scriptable App 内运行时是否显示背景设置菜单
const changePicBg = true

const maxSchedules = 2
const maxReminders = 2

const padding = {
  top: 0,
  left: 4,
  bottom: 0,
  right: 4
}

const greetingText = {
  nightGreeting: "🦉 𝑇𝑖𝑚𝑒 𝑡𝑜 𝑔𝑒𝑡 𝑙𝑎𝑖𝑑~",
  morningGreeting: "💫 𝐺𝑜𝑜𝑑 𝑚𝑜𝑟𝑛𝑖𝑛𝑔~",
  noonGreeting: "🥳 𝐺𝑜𝑜𝑑 𝑛𝑜𝑜𝑛~",
  afternoonGreeting: "🐡 𝐺𝑜𝑜𝑑 𝑎𝑓𝑡𝑒𝑟𝑛𝑜𝑜𝑛~",
  eveningGreeting: "🐳 𝐺𝑜𝑜𝑑 𝑒𝑣𝑒𝑛𝑖𝑛𝑔~"
}

const weatherIcos = {
  SUNRISE: "sunrise.fill",
  CLEAR_DAY: "sun.max.fill",
  CLEAR_NIGHT: "moon.stars.fill",
  PARTLY_CLOUDY_DAY: "cloud.sun.fill",
  PARTLY_CLOUDY_NIGHT: "cloud.moon.fill",
  CLOUDY: "cloud.fill",
  LIGHT_HAZE: "sun.haze.fill",
  MODERATE_HAZE: "sun.haze.fill",
  HEAVY_HAZE: "sun.haze.fill",
  LIGHT_RAIN: "cloud.drizzle.fill",
  MODERATE_RAIN: "cloud.rain.fill",
  HEAVY_RAIN: "cloud.heavyrain.fill",
  STORM_RAIN: "cloud.bolt.rain.fill",
  FOG: "cloud.fog.fill",
  LIGHT_SNOW: "cloud.snow.fill",
  MODERATE_SNOW: "cloud.snow.fill",
  HEAVY_SNOW: "cloud.snow.fill",
  STORM_SNOW: "wind.snow",
  DUST: "sun.dust.fill",
  SAND: "sun.dust.fill",
  WIND: "wind",
  SUNSET: "sunset.fill"
}

const weatherControl = {
  HUMIDITY: true,
  COMFORT: true,
  ULTRAVIOLET: true,
  AQI: true,
  HEIGHT_LOW: true,
  SUNRISE_SUNSET: true,
  UPDATE_TIME: true
}

const weekTitle = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
const defaultTextColor = new Color("#ffffff")
const accentColor = new Color("#ffd166")
const secondaryTextColor = new Color("#e9e7ff", 0.82)
const glassPanelColor = new Color("#7566a8", 0.28)
const highTemperatureColor = new Color("#ff5c6c")
const lowTemperatureColor = new Color("#58a6ff")

// ==============================
// 初始化
// ==============================

const currentDate = new Date()
const year = currentDate.getFullYear()
const month = currentDate.getMonth() + 1
const day = currentDate.getDate()
const hour = currentDate.getHours()
const minute = currentDate.getMinutes()

const filename = `${Script.name()}.jpg`
const files = FileManager.local()
const path = files.joinPath(files.documentsDirectory(), filename)
const poetryTokenPath = files.joinPath(
  files.documentsDirectory(),
  `${Script.name()}-jinrishici-token.txt`
)
const widget = new ListWidget()

// ==============================
// 获取数据
// ==============================

const weatherInfo = await getWeather()
const lunarInfo = await getLunar()
const poetry = await getPoetry()
const showSchedules = await getSchedules()
const showReminders = await getReminders()

// ==============================
// 小组件布局
// ==============================

const contentStack = widget.addStack()
contentStack.layoutHorizontally()
contentStack.centerAlignContent()

applyThemeBackground(widget)

// ---------- 左侧 ----------
const leftStack = contentStack.addStack()
leftStack.layoutVertically()

const titleStack = horizontallyCenterStack(leftStack)
const greeting = provideGreeting(currentDate)
addStyleText(titleStack, 0, greeting, 1, Font.systemFont(22), defaultTextColor, 0, 0.72)

const dateStr = getDateStr(currentDate)
addStyleText(
  leftStack,
  2,
  dateStr,
  1,
  Font.systemFont(16),
  accentColor,
  0,
  0.85
)

const weekDayColor = new Color("#ffffff", 0.9)
leftStack.addSpacer(2)

const dateStack = horizontallyCenterStack(leftStack)
addStyleText(
  dateStack,
  0,
  getDayWeekTitle(currentDate),
  1,
  Font.systemFont(16),
  weekDayColor,
  0,
  0.85
)
dateStack.addSpacer(4)

addStyleText(
  dateStack,
  0,
  getLunarText(lunarInfo),
  1,
  Font.systemFont(16),
  weekDayColor,
  0,
  0.72
)

dateStack.addSpacer(2)
const batteryStr = `〓 ${getBatteryLevel()} 〓`
addStyleText(
  dateStack,
  0,
  batteryStr,
  1,
  Font.systemFont(15),
  weekDayColor,
  0,
  0.78
)

const weatherAlertInfo = weatherInfo.alertWeatherTitle
const weatherDesc = weatherAlertInfo || weatherInfo.weatherDesc || "暂时无法获取天气描述"
addStyleText(
  leftStack,
  3,
  weatherDesc,
  1,
  Font.systemFont(12),
  defaultTextColor,
  0,
  0.7
)

const schedulePoetryColor = secondaryTextColor

if (showSchedules.length > 0) {
  addStyleText(
    leftStack,
    1,
    "----------------------------------",
    1,
    Font.systemFont(10),
    new Color("#ffd166", 0.65)
  )

  let scheduleIndex = 0
  for (const schedule of showSchedules) {
    scheduleIndex += 1
    if (scheduleIndex > maxSchedules) break

    const scheduleStack = horizontallyCenterStack(leftStack)
    addStyleImg(
      scheduleStack,
      0,
      getSFIco("megaphone.fill"),
      12,
      12,
      accentColor
    )
    scheduleStack.addSpacer(4)
    addStyleText(
      scheduleStack,
      0,
      schedule.title || "未命名日程",
      1,
      Font.systemFont(11),
      schedulePoetryColor,
      0,
      0.75
    )

    const scheduleTimeStack = leftStack.addStack()
    scheduleTimeStack.layoutHorizontally()
    scheduleTimeStack.addSpacer(17)
    addStyleText(
      scheduleTimeStack,
      0,
      schedule.timeText || "",
      1,
      Font.systemFont(11),
      schedulePoetryColor
    )
  }
} else {
  leftStack.addSpacer(4)

  const poetryStack = leftStack.addStack()
  poetryStack.backgroundColor = glassPanelColor
  poetryStack.cornerRadius = 4
  poetryStack.layoutVertically()
  poetryStack.addSpacer(2)

  const poetryInfoStack = poetryStack.addStack()
  poetryInfoStack.layoutHorizontally()
  poetryInfoStack.addSpacer(2)

  const poetryInfo = normalizePoetry(poetry)
  addStyleText(
    poetryInfoStack,
    0,
    `"${poetryInfo.content}"`,
    1,
    Font.systemFont(11),
    schedulePoetryColor,
    0,
    0.78
  )

  const authStack = poetryStack.addStack()
  authStack.layoutHorizontally()
  authStack.addSpacer()

  addStyleText(
    authStack,
    0,
    `⊱${poetryInfo.dynasty}·${poetryInfo.author}⊰`,
    1,
    Font.systemFont(11),
    schedulePoetryColor,
    0,
    0.8
  )

  authStack.addSpacer(20)
  poetryStack.addSpacer(2)
}

// ---------- 右侧 ----------
contentStack.addSpacer()

const rightStack = contentStack.addStack()
rightStack.size = new Size(110, 0)
rightStack.layoutVertically()

const weatherStack = alignRightStack(rightStack)
weatherStack.bottomAlignContent()

addStyleImg(
  weatherStack,
  0,
  getSFIco(weatherInfo.weatherIco),
  32,
  32,
  accentColor
)

weatherStack.addSpacer(4)
addStyleText(
  weatherStack,
  0,
  `${weatherInfo.bodyFeelingTemperature ?? "--"}°C`,
  1,
  Font.boldMonospacedSystemFont(22),
  defaultTextColor
)

if (weatherControl.HUMIDITY) {
  rightStack.addSpacer(4)
  const humidityStack = alignRightStack(rightStack)
  addStyleText(
    humidityStack,
    0,
    `相对湿度：${weatherInfo.humidity || "--"}`,
    1,
    Font.systemFont(11),
    defaultTextColor
  )
}

if (weatherControl.COMFORT) {
  rightStack.addSpacer(1)
  const comfortStack = alignRightStack(rightStack)
  addStyleText(
    comfortStack,
    0,
    `舒适指数：${weatherInfo.comfort || "--"}`,
    1,
    Font.systemFont(11),
    defaultTextColor
  )
}

if (weatherControl.ULTRAVIOLET) {
  rightStack.addSpacer(1)
  const ultravioletStack = alignRightStack(rightStack)
  addStyleText(
    ultravioletStack,
    0,
    `紫外线：${weatherInfo.ultraviolet || "--"}`,
    1,
    Font.systemFont(11),
    defaultTextColor
  )
}

if (weatherControl.AQI) {
  rightStack.addSpacer(1)
  const aqiInfoStack = alignRightStack(rightStack)
  addStyleText(
    aqiInfoStack,
    0,
    `空气质量：${weatherInfo.aqiInfo || "--"}`,
    1,
    Font.systemFont(11),
    defaultTextColor
  )
}

if (weatherControl.HEIGHT_LOW) {
  rightStack.addSpacer(3)
  const tempStack = alignRightStack(rightStack)

  addStyleText(tempStack, 0, "↑", 1, Font.systemFont(10), highTemperatureColor)
  addStyleText(
    tempStack,
    0,
    `${weatherInfo.maxTemperature ?? "--"}°`,
    1,
    Font.systemFont(10),
    highTemperatureColor
  )

  tempStack.addSpacer(6)

  addStyleText(tempStack, 0, "↓", 1, Font.systemFont(10), lowTemperatureColor)
  addStyleText(
    tempStack,
    0,
    `${weatherInfo.minTemperature ?? "--"}°`,
    1,
    Font.systemFont(10),
    lowTemperatureColor
  )
}

if (weatherControl.SUNRISE_SUNSET) {
  rightStack.addSpacer(2)

  const symbolStack = rightStack.addStack()
  symbolStack.layoutHorizontally()
  symbolStack.addSpacer()
  symbolStack.bottomAlignContent()

  addStyleImg(
    symbolStack,
    0,
    getSFIco(weatherIcos.SUNRISE),
    15,
    15,
    accentColor
  )
  symbolStack.addSpacer(4)
  addStyleText(
    symbolStack,
    0,
    weatherInfo.sunrise || "--:--",
    1,
    Font.systemFont(10),
    accentColor
  )

  symbolStack.addSpacer(4)

  addStyleImg(
    symbolStack,
    0,
    getSFIco(weatherIcos.SUNSET),
    15,
    15,
    accentColor
  )
  symbolStack.addSpacer(4)
  addStyleText(
    symbolStack,
    0,
    weatherInfo.sunset || "--:--",
    1,
    Font.systemFont(10),
    accentColor
  )
}

if (weatherControl.UPDATE_TIME) {
  rightStack.addSpacer(2)
  const updateTimeStack = alignRightStack(rightStack)
  addStyleText(
    updateTimeStack,
    0,
    `上次更新 → ${pad2(hour)}:${pad2(minute)}`,
    1,
    Font.systemFont(8),
    new Color("#ffffff", 0.8)
  )
}

// ==============================
// 背景
// ==============================

if (!colorMode && !config.runsInWidget && changePicBg) {
  await configureBackground()
}

if (colorMode) {
  applyThemeBackground(widget)
} else if (files.fileExists(path)) {
  const backgroundImage = safelyReadImage(path)
  if (backgroundImage) {
    widget.backgroundImage = backgroundImage
  } else {
    applyThemeBackground(widget)
  }
} else {
  // 第一次直接添加到桌面、还没有设置图片时，使用主题渐变兜底。
  applyThemeBackground(widget)
}

widget.setPadding(padding.top, padding.left, padding.bottom, padding.right)

Script.setWidget(widget)
Script.complete()

if (!config.runsInWidget) {
  if (previewSize === "Large") {
    await widget.presentLarge()
  } else if (previewSize === "Small") {
    await widget.presentSmall()
  } else {
    await widget.presentMedium()
  }
}

// ==============================
// 背景相关
// ==============================

function applyThemeBackground(targetWidget) {
  try {
    const gradient = new LinearGradient()
    gradient.colors = [
      new Color("#07152f"),
      new Color("#202057"),
      new Color("#4b2e83")
    ]
    gradient.locations = [0, 0.56, 1]
    gradient.startPoint = new Point(0, 0)
    gradient.endPoint = new Point(1, 1)
    targetWidget.backgroundGradient = gradient
  } catch (error) {
    log(`主题渐变设置失败：${error}`)
    targetWidget.backgroundColor = new Color(bgColorStr)
  }
}

async function configureBackground() {
  const hasBackground = files.fileExists(path)
  const options = hasBackground
    ? ["使用相册图片", "生成透明背景", "保留现有背景"]
    : ["使用相册图片", "生成透明背景", "暂不设置"]

  const choice = await generateAlert("请选择小组件背景", options)

  if (choice === 0) {
    try {
      const img = await Photos.fromLibrary()
      if (!isScriptableImage(img)) {
        throw new Error("没有选择有效图片")
      }
      files.writeImage(path, img)
      await generateAlert("背景图片已保存。", ["好的"])
    } catch (error) {
      log(`背景图片设置失败：${error}`)
      await generateAlert("未能保存背景图片，将继续使用现有背景。", ["好的"])
    }
    return
  }

  if (choice === 1) {
    await createTransparentBackground()
  }
}

async function createTransparentBackground() {
  const instructions =
    "请先回到主屏幕，长按进入编辑模式，滑动到最右侧空白页并截图。已有截图时选择“继续”。"

  const shouldContinue = await generateAlert(instructions, ["继续", "退出"])
  if (shouldContinue !== 0) return

  let screenshot
  try {
    screenshot = await Photos.fromLibrary()
  } catch (error) {
    log(`主屏幕截图选择失败：${error}`)
    return
  }

  if (!isScriptableImage(screenshot) || !screenshot.size) {
    await generateAlert("没有选择有效的主屏幕截图。", ["好的"])
    return
  }

  const height = Math.round(screenshot.size.height)
  const phone = phoneSizes()[height]

  if (!phone) {
    await generateAlert(
      `暂不支持这张截图的高度：${height}px。你仍可改用相册图片背景。`,
      ["好的"]
    )
    return
  }

  const sizeIndex = await generateAlert(
    "请选择小组件尺寸",
    ["小号", "中号", "大号"]
  )
  if (sizeIndex < 0 || sizeIndex > 2) return
  const widgetSize = ["小号", "中号", "大号"][sizeIndex]

  let crop = { w: 0, h: 0, x: 0, y: 0 }

  if (widgetSize === "小号") {
    const positions = [
      "顶部 左边",
      "顶部 右边",
      "中间 左边",
      "中间 右边",
      "底部 左边",
      "底部 右边"
    ]
    const positionIndex = await generateAlert("请选择位置", positions)
    if (positionIndex < 0 || positionIndex >= positions.length) return
    const keys = positions[positionIndex].split(" ")

    crop.w = phone.小号
    crop.h = phone.小号
    crop.y = phone[keys[0]]
    crop.x = phone[keys[1]]
  } else if (widgetSize === "中号") {
    const positions = ["顶部", "中间", "底部"]
    const positionIndex = await generateAlert("请选择位置", positions)
    if (positionIndex < 0 || positionIndex >= positions.length) return

    crop.w = phone.中号
    crop.h = phone.小号
    crop.x = phone.左边
    crop.y = phone[positions[positionIndex]]
  } else {
    const positions = ["顶部", "底部"]
    const positionIndex = await generateAlert("请选择位置", positions)
    if (positionIndex < 0 || positionIndex >= positions.length) return

    crop.w = phone.中号
    crop.h = phone.大号
    crop.x = phone.左边
    crop.y = positionIndex === 0 ? phone.顶部 : phone.中间
  }

  try {
    const imgCrop = cropImage(
      screenshot,
      new Rect(crop.x, crop.y, crop.w, crop.h)
    )

    if (!isScriptableImage(imgCrop)) {
      throw new Error("裁剪结果不是有效图片")
    }

    files.writeImage(path, imgCrop)
    await generateAlert("透明背景已生成。", ["好的"])
  } catch (error) {
    log(`透明背景生成失败：${error}`)
    await generateAlert("透明背景生成失败，将继续使用现有背景。", ["好的"])
  }
}

async function generateAlert(message, options) {
  const alert = new Alert()
  alert.message = message

  for (const option of options) {
    alert.addAction(option)
  }

  return await alert.presentAlert()
}

function cropImage(img, rect) {
  const draw = new DrawContext()
  draw.size = new Size(rect.width, rect.height)
  draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y))
  return draw.getImage()
}

/**
 * 不同系统版本的小组件间距可能略有变化。
 * 新机型数值按常见主屏幕截图规格补充，透明效果若有轻微偏移，
 * 可改用相册图片背景，或自行微调对应机型坐标。
 */
function phoneSizes() {
  return {
    // iPhone 16 Pro Max
    "2868": {
      小号: 510, 中号: 1092, 大号: 1146,
      左边: 90, 右边: 672,
      顶部: 258, 中间: 900, 底部: 1542
    },
    // iPhone 16 Pro
    "2622": {
      小号: 474, 中号: 1014, 大号: 1062,
      左边: 78, 右边: 618,
      顶部: 246, 中间: 840, 底部: 1434
    },
    // iPhone 15 Pro Max / 14 Pro Max
    "2796": {
      小号: 510, 中号: 1092, 大号: 1146,
      左边: 90, 右边: 672,
      顶部: 252, 中间: 888, 底部: 1524
    },
    // iPhone 15 Pro / 14 Pro
    "2556": {
      小号: 474, 中号: 1014, 大号: 1062,
      左边: 82, 右边: 622,
      顶部: 231, 中间: 825, 底部: 1419
    },
    "2778": {
      小号: 510, 中号: 1092, 大号: 1146,
      左边: 96, 右边: 678,
      顶部: 246, 中间: 882, 底部: 1518
    },
    "2532": {
      小号: 474, 中号: 1014, 大号: 1062,
      左边: 78, 右边: 618,
      顶部: 231, 中间: 819, 底部: 1407
    },
    "2688": {
      小号: 507, 中号: 1080, 大号: 1137,
      左边: 81, 右边: 654,
      顶部: 228, 中间: 858, 底部: 1488
    },
    "2436": {
      小号: 465, 中号: 987, 大号: 1035,
      左边: 69, 右边: 591,
      顶部: 213, 中间: 783, 底部: 1353
    },
    "2208": {
      小号: 471, 中号: 1044, 大号: 1071,
      左边: 99, 右边: 672,
      顶部: 114, 中间: 696, 底部: 1278
    },
    "1792": {
      小号: 338, 中号: 720, 大号: 758,
      左边: 54, 右边: 436,
      顶部: 160, 中间: 580, 底部: 1000
    },
    "1334": {
      小号: 296, 中号: 642, 大号: 648,
      左边: 54, 右边: 400,
      顶部: 60, 中间: 412, 底部: 764
    },
    "1136": {
      小号: 282, 中号: 584, 大号: 622,
      左边: 30, 右边: 332,
      顶部: 59, 中间: 399, 底部: 399
    }
  }
}

// ==============================
// UI 工具
// ==============================

function addStyleText(
  stack,
  topMargin,
  text,
  lineLimit,
  font,
  textColor,
  width = 0,
  minimumScaleFactor = 1
) {
  if (!stack) return

  if (width > 0) {
    stack.size = new Size(width, 0)
  }

  if (topMargin > 0) {
    stack.addSpacer(topMargin)
  }

  const textSpan = stack.addText(String(text ?? ""))
  textSpan.font = font || Font.systemFont(12)
  textSpan.lineLimit = Number.isFinite(lineLimit) ? lineLimit : 1
  textSpan.textColor = textColor || defaultTextColor
  textSpan.minimumScaleFactor =
    Number.isFinite(minimumScaleFactor) &&
    minimumScaleFactor > 0 &&
    minimumScaleFactor <= 1
      ? minimumScaleFactor
      : 1
}

function addStyleImg(stack, topMargin, img, width, height, tintColor) {
  if (!stack) return

  if (topMargin > 0) {
    stack.addSpacer(topMargin)
  }

  const safeImage = isScriptableImage(img)
    ? img
    : getSFIco("questionmark.circle")

  const imgSpan = stack.addImage(safeImage)
  imgSpan.imageSize = new Size(width, height)

  if (tintColor) {
    imgSpan.tintColor = tintColor
  }
}

/**
 * 返回 Scriptable 的 Image。
 * 不能返回 HTML 字符串，也不能使用 document.getElementById。
 */
function getSFIco(symbolName) {
  const fallbackNames = [
    "questionmark.circle.fill",
    "questionmark.circle",
    "circle.fill"
  ]

  const requestedName =
    typeof symbolName === "string" && symbolName.trim().length > 0
      ? symbolName.trim()
      : fallbackNames[0]

  let symbol = safelyGetSymbol(requestedName)

  if (!symbol) {
    for (const fallbackName of fallbackNames) {
      symbol = safelyGetSymbol(fallbackName)
      if (symbol) break
    }
  }

  if (!symbol) {
    // 极端情况下绘制一个透明占位图，确保 addImage 不收到 null。
    return createPlaceholderImage()
  }

  try {
    symbol.applyFont(Font.systemFont(24))
    if (isScriptableImage(symbol.image)) {
      return symbol.image
    }
  } catch (error) {
    log(`SF Symbol 图片生成失败：${error}`)
  }

  return createPlaceholderImage()
}

function safelyGetSymbol(symbolName) {
  try {
    return SFSymbol.named(symbolName)
  } catch (error) {
    log(`无效的 SF Symbol：${symbolName}，${error}`)
    return null
  }
}

function isScriptableImage(value) {
  if (!value) return false

  try {
    return value instanceof Image
  } catch (error) {
    return false
  }
}

function createPlaceholderImage() {
  const context = new DrawContext()
  context.size = new Size(1, 1)
  context.opaque = false
  context.respectScreenScale = true
  return context.getImage()
}

function safelyReadImage(imagePath) {
  try {
    const image = files.readImage(imagePath)
    return isScriptableImage(image) ? image : null
  } catch (error) {
    log(`背景图片读取失败：${error}`)
    return null
  }
}

function alignRightStack(alignmentStack) {
  const returnStack = alignmentStack.addStack()
  returnStack.layoutHorizontally()
  returnStack.addSpacer()
  return returnStack
}

function horizontallyCenterStack(alignmentStack) {
  const returnStack = alignmentStack.addStack()
  returnStack.layoutHorizontally()
  returnStack.centerAlignContent()
  return returnStack
}

function verticallyCenterStack(alignmentStack) {
  const returnStack = alignmentStack.addStack()
  returnStack.layoutVertically()
  returnStack.centerAlignContent()
  return returnStack
}

// ==============================
// 日期与问候
// ==============================

function getDateStr(date, formatter = "yyyy年MM月d日") {
  const df = new DateFormatter()
  df.locale = locale
  df.dateFormat = formatter
  return df.string(date)
}

function provideGreeting(date) {
  const currentHour = date.getHours()

  if (currentHour < 5) return greetingText.nightGreeting
  if (currentHour < 11) return greetingText.morningGreeting
  if (currentHour < 13) return greetingText.noonGreeting
  if (currentHour < 19) return greetingText.afternoonGreeting
  if (currentHour < 22) return greetingText.eveningGreeting
  return greetingText.nightGreeting
}

function getDayWeekTitle(date) {
  return weekTitle[date.getDay()]
}

function pad2(value) {
  return String(value).padStart(2, "0")
}

// ==============================
// 天气
// ==============================

async function getWeather() {
  const fallback = {
    alertWeatherTitle: undefined,
    minTemperature: "--",
    maxTemperature: "--",
    bodyFeelingTemperature: "--",
    weatherIco: weatherIcos.CLOUDY,
    weatherDesc: "天气数据暂不可用",
    humidity: "--",
    comfort: "--",
    ultraviolet: "--",
    aqiInfo: "--",
    sunrise: "--:--",
    sunset: "--:--"
  }

  try {
    const location = await getLocation()

    if (!isValidCoordinate(location.latitude, location.longitude)) {
      throw new Error("没有可用的经纬度，请开启定位权限或填写默认位置")
    }

    log(
      `定位信息：${location.locality || "未知城市"}·${location.subLocality || "未知地区"}`
    )

    const domain =
      `https://api.caiyunapp.com/v2.5/${apiKey}/` +
      `${location.longitude},${location.latitude}/weather.json?alert=true`

    const weatherJsonData = await getJson(domain)

    if (!isPlainObject(weatherJsonData) || weatherJsonData.status !== "ok") {
      throw new Error(safeText(weatherJsonData?.error, "彩云天气返回异常"))
    }

    const result = asObject(weatherJsonData.result)
    const realtime = asObject(result.realtime)
    const daily = asObject(result.daily)
    const dailyTemperature = asArray(daily.temperature)
    const dailyAstro = asArray(daily.astro)

    const alertContent = asObject(result.alert).content
    let alertWeatherTitle

    if (Array.isArray(alertContent) && alertContent.length > 0) {
      alertWeatherTitle = safeText(asObject(alertContent[0]).title, undefined)
    } else if (isPlainObject(alertContent)) {
      alertWeatherTitle = safeText(alertContent.title, undefined)
    }

    const temperatureData = asObject(dailyTemperature[0])
    const astro = asObject(dailyAstro[0])
    const weather = safeText(realtime.skycon, "")
    const humidity = safeNumber(realtime.humidity)
    const aqi = safeNumber(asObject(asObject(realtime.air_quality).aqi).chn)
    const realtimeLifeIndex = asObject(realtime.life_index)
    const dailyLifeIndex = asObject(daily.life_index)
    const dailyComfort = asArray(asObject(dailyLifeIndex).comfort)
    const dailyUltraviolet = asArray(asObject(dailyLifeIndex).ultraviolet)
    const comfort =
      safeText(asObject(realtimeLifeIndex.comfort).desc, "") ||
      safeText(asObject(dailyComfort[0]).desc, "--")
    const ultraviolet =
      safeText(asObject(realtimeLifeIndex.ultraviolet).desc, "") ||
      safeText(asObject(dailyUltraviolet[0]).desc, "--")

    return {
      alertWeatherTitle,
      minTemperature: safeRound(temperatureData.min, "--"),
      maxTemperature: safeRound(temperatureData.max, "--"),
      bodyFeelingTemperature: safeRound(
        realtime.apparent_temperature ?? realtime.temperature,
        "--"
      ),
      weatherIco: weatherIcos[weather] || weatherIcos.CLOUDY,
      weatherDesc: safeText(result.forecast_keypoint, "暂无天气预报"),
      humidity: Number.isFinite(humidity)
        ? `${Math.round(humidity * 100)}%`
        : "--",
      comfort,
      ultraviolet,
      aqiInfo: Number.isFinite(aqi) ? airQuality(aqi) : "--",
      sunrise: safeText(asObject(astro.sunrise).time, "--:--"),
      sunset: safeText(asObject(astro.sunset).time, "--:--")
    }
  } catch (error) {
    log(`天气获取失败：${error}`)
    return fallback
  }
}

async function getLocation() {
  if (!lockLocation) {
    try {
      const location = await Location.current()

      locationData.latitude = location.latitude
      locationData.longitude = location.longitude

      try {
        const geocode = await Location.reverseGeocode(
          location.latitude,
          location.longitude,
          locale
        )

        const geo = asObject(asArray(geocode)[0])
        locationData.locality =
          safeText(geo.locality, "") ||
          safeText(geo.administrativeArea, undefined)
        locationData.subLocality = safeText(geo.subLocality, undefined)
        locationData.street = safeText(geo.thoroughfare, undefined)
      } catch (reverseError) {
        log(`反向地理编码失败：${reverseError}`)
      }
    } catch (error) {
      log(`定位失败，将尝试使用默认位置：${error}`)
    }
  }

  return locationData
}

function isValidCoordinate(latitude, longitude) {
  return (
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude))
  )
}

function safeRound(value, fallback = "--") {
  const number = safeNumber(value)
  return Number.isFinite(number) ? Math.round(number) : fallback
}

function safeNumber(value) {
  if (value === null || value === undefined || value === "") return NaN
  const number = Number(value)
  return Number.isFinite(number) ? number : NaN
}

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function asObject(value) {
  return isPlainObject(value) ? value : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function airQuality(levelNum) {
  if (levelNum >= 0 && levelNum <= 50) return "优秀"
  if (levelNum <= 100) return "良好"
  if (levelNum <= 150) return "轻度"
  if (levelNum <= 200) return "中度"
  if (levelNum <= 300) return "重度"
  return "严重"
}

// ==============================
// 日程与提醒事项
// ==============================

function shouldShowSchedule(schedule) {
  if (!isPlainObject(schedule)) return false
  if (safeText(schedule.title, "").startsWith("Canceled:")) return false
  if (schedule.isAllDay) return true
  if (!isValidDate(schedule.endDate)) return false

  const now = new Date()
  return schedule.endDate.getTime() > now.getTime()
}

function isValidDate(value) {
  return (
    value instanceof Date &&
    Number.isFinite(value.getTime())
  )
}

async function getSchedules() {
  try {
    const showSchedules = []
    const todaySchedules = asArray(await CalendarEvent.today([]))

    for (const schedule of todaySchedules) {
      if (!shouldShowSchedule(schedule)) continue

      let timeText = "全天"

      if (!schedule.isAllDay) {
        if (!isValidDate(schedule.startDate) || !isValidDate(schedule.endDate)) {
          continue
        }

        timeText =
          `${pad2(schedule.startDate.getHours())}:` +
          `${pad2(schedule.startDate.getMinutes())}→` +
          `${pad2(schedule.endDate.getHours())}:` +
          `${pad2(schedule.endDate.getMinutes())}`
      }

      showSchedules.push({
        title: safeText(schedule.title, "未命名日程"),
        timeText
      })
    }

    return showSchedules
  } catch (error) {
    log(`日程获取失败：${error}`)
    return []
  }
}

async function getReminders() {
  try {
    const reminders = asArray(await Reminder.all())
    return reminders
      .filter(reminder => isPlainObject(reminder) && !reminder.isCompleted)
      .slice(0, maxReminders)
      .map(reminder => ({
        title: safeText(reminder.title, "未命名提醒"),
        dueDate: reminder.dueDate
      }))
  } catch (error) {
    log(`提醒事项获取失败：${error}`)
    return []
  }
}

// ==============================
// 网络、农历、诗词
// ==============================

async function getJson(url) {
  if (typeof url !== "string" || url.length === 0) {
    throw new Error("请求地址无效")
  }

  const request = new Request(url)
  request.method = "GET"
  request.headers = {
    Accept: "*/*",
    "Content-Type": "application/json"
  }
  request.timeoutInterval = 15
  return await request.loadJSON()
}

async function getLunar() {
  try {
    const request = new Request("https://www.iamwawa.cn/home/nongli/ajax")
    request.method = "POST"
    request.headers = {
      Accept: "application/json"
    }
    request.timeoutInterval = 15
    request.addParameterToMultipart("type", "solar")
    request.addParameterToMultipart("year", String(year))
    request.addParameterToMultipart("month", String(month))
    request.addParameterToMultipart("day", String(day))
    const response = await request.loadJSON()

    if (!isPlainObject(response) || response.status !== 1) {
      throw new Error(safeText(response?.info, "农历接口返回异常"))
    }

    return response
  } catch (error) {
    log(`农历获取失败：${error}`)
    return null
  }
}

function getLunarText(lunarInfo) {
  const data = asObject(asObject(lunarInfo).data)
  const lunarDate = safeText(data.lunar_date, "")

  if (lunarDate) {
    return lunarDate
  }

  const raw = safeText(data.lunar, "")
  if (!raw) {
    return "农历加载失败"
  }

  // 兼容只返回完整农历日期的旧接口，移除公历式年份前缀。
  return raw
    .replace(/^\d{4}年/, "")
    .replace(/^农历[\s：:]*/, "")
    .trim() || "农历加载失败"
}

async function getPoetry() {
  try {
    let token = await getPoetryToken()
    let response = await requestPoetry(token)

    // Token 被服务端判定无效时刷新一次，避免永久停留在兜底内容。
    const poetryErrorCode = Number(asObject(response).errCode)
    if (
      asObject(response).status !== "success" &&
      (poetryErrorCode === 2002 || poetryErrorCode === 2004)
    ) {
      token = await getPoetryToken(true)
      response = await requestPoetry(token)
    }

    if (
      !isPlainObject(response) ||
      response.status !== "success" ||
      !isPlainObject(response.data)
    ) {
      throw new Error("诗词接口返回异常")
    }

    return response
  } catch (error) {
    log(`诗词获取失败：${error}`)
    return null
  }
}

async function getPoetryToken(forceRefresh = false) {
  if (!forceRefresh && files.fileExists(poetryTokenPath)) {
    try {
      const savedToken = safeText(files.readString(poetryTokenPath), "")
      if (savedToken) return savedToken
    } catch (error) {
      log(`诗词 Token 读取失败：${error}`)
    }
  }

  const request = new Request("https://v2.jinrishici.com/token")
  request.method = "GET"
  request.headers = { Accept: "application/json" }
  request.timeoutInterval = 15
  const response = await request.loadJSON()
  const token = safeText(asObject(response).data, "")

  if (asObject(response).status !== "success" || !token) {
    throw new Error("诗词 Token 获取失败")
  }

  files.writeString(poetryTokenPath, token)
  return token
}

async function requestPoetry(token) {
  if (!safeText(token, "")) {
    throw new Error("诗词 Token 无效")
  }

  const request = new Request("https://v2.jinrishici.com/sentence")
  request.method = "GET"
  request.headers = {
    Accept: "application/json",
    "X-User-Token": token
  }
  request.timeoutInterval = 15
  return await request.loadJSON()
}

function normalizePoetry(poetry) {
  const data = asObject(asObject(poetry).data)
  const origin = asObject(data.origin)
  let content = safeText(data.content, "")

  if (typeof content !== "string" || content.trim().length === 0) {
    content = "生活明朗，万物可爱"
  }

  content = content.trim().replace(/[。！？；，、]$/, "")

  return {
    content,
    dynasty: safeText(origin.dynasty, "今日"),
    author: safeText(origin.author, "诗词")
  }
}

// ==============================
// 电池
// ==============================

function getBatteryLevel() {
  const level = Device.batteryLevel()

  if (!Number.isFinite(level) || level < 0) {
    return "--%"
  }

  const batteryAscii = `${Math.round(level * 100)}%`
  log(`电池==>${batteryAscii}`)
  return batteryAscii
}
