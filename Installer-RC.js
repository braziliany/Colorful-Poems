// Scriptable Weather Widget v1.1.2 RC Test Installer
// 临时真机验收入口：仅从 codex/v1.1.2-offline-cache 下载，不使用 main。

const CONFIG = {
  displayName: "Scriptable Weather Widget v1.1.2 RC",
  version: "1.1.2",
  branch: "codex/v1.1.2-offline-cache",
  manifestUrl:
    "https://raw.githubusercontent.com/braziliany/Colorful-Poems/" +
    "codex/v1.1.2-offline-cache/manifest.rc.json",
  stableScriptNames: ["Colorful-Poems", "彩云诗词桌面天气"]
}

const CAIYUN_PLACEHOLDER = "YOUR_CAIYUN_API_KEY"

function expectedBranchUrlPart() {
  return `/${CONFIG.branch}/`
}

function isPinnedRcUrl(url) {
  const value = String(url || "").trim()
  return (
    value.startsWith("https://raw.githubusercontent.com/") &&
    value.includes(expectedBranchUrlPart()) &&
    !value.includes("/main/")
  )
}

function assertSafeRcScriptName(scriptName) {
  const value = String(scriptName || "").trim()
  if (!value || !value.endsWith(" RC")) {
    throw new Error("RC 脚本名必须以 RC 结尾")
  }
  if (/[\\/:*?"<>|]/.test(value)) {
    throw new Error("RC 脚本名包含无效路径字符")
  }
  if (CONFIG.stableScriptNames.includes(value)) {
    throw new Error("RC 脚本名不能与 Stable 相同")
  }
  return value
}

function normalizeRcManifest(value) {
  const manifest = value && typeof value === "object" ? value : {}
  const resources = Array.isArray(manifest.resources) ? manifest.resources : []

  if (String(manifest.version || "") !== CONFIG.version) {
    throw new Error(`测试清单版本必须为 v${CONFIG.version}`)
  }
  if (manifest.channel !== "release-candidate") {
    throw new Error("测试清单不是 Release Candidate 通道")
  }
  if (manifest.branch !== CONFIG.branch) {
    throw new Error("测试清单分支不匹配")
  }
  if (manifest.displayName !== CONFIG.displayName) {
    throw new Error("测试清单显示名称不匹配")
  }
  if (resources.length !== 1) {
    throw new Error("测试清单必须且只能包含一个 RC 组件")
  }

  const item = resources[0] && typeof resources[0] === "object"
    ? resources[0]
    : {}
  const scriptName = assertSafeRcScriptName(item.scriptName)
  const sourceUrl = String(item.sourceUrl || "").trim()
  const marker = String(item.marker || "")

  if (!isPinnedRcUrl(sourceUrl)) {
    throw new Error("RC 组件下载地址未固定到测试分支")
  }
  if (!marker.includes(`v${CONFIG.version}`)) {
    throw new Error("RC 组件版本标记无效")
  }
  if (item.injectCaiyunToken !== true) {
    throw new Error("RC 组件必须启用彩云 Token 注入")
  }

  return {
    version: CONFIG.version,
    channel: manifest.channel,
    branch: CONFIG.branch,
    displayName: CONFIG.displayName,
    resources: [{
      scriptName,
      sourceUrl,
      marker,
      injectCaiyunToken: true
    }]
  }
}

function extractVersion(content) {
  const match = String(content || "").match(/\bv(\d+\.\d+\.\d+)\b/i)
  return match ? match[1] : "0.0.0"
}

function extractCaiyunToken(content) {
  const match = String(content || "").match(
    /const\s+apiKey\s*=\s*(["'])(.*?)\1\s*;?/
  )
  const token = match ? match[2].trim() : ""
  return isValidCaiyunToken(token) ? token : null
}

function isValidCaiyunToken(token) {
  const value = String(token || "").trim()
  return (
    value.length >= 8 &&
    value !== CAIYUN_PLACEHOLDER &&
    !/[\r\n]/.test(value)
  )
}

function injectCaiyunToken(content, token) {
  const value = String(token || "").trim()
  if (!isValidCaiyunToken(value)) {
    throw new Error("彩云 Token 格式无效")
  }

  const source = String(content || "")
  const pattern = /const\s+apiKey\s*=\s*["']YOUR_CAIYUN_API_KEY["']\s*;?/
  if (!pattern.test(source)) {
    throw new Error("RC 组件源码中未找到彩云 Token 占位符")
  }
  return source.replace(
    pattern,
    () => `const apiKey = ${JSON.stringify(value)}`
  )
}

async function downloadText(url) {
  if (!isPinnedRcUrl(url)) {
    throw new Error("拒绝下载未固定到 RC 分支的资源")
  }

  const request = new Request(url)
  request.timeoutInterval = 20
  const text = await request.loadString()
  const status = Number(request.response?.statusCode || 0)
  if (status < 200 || status >= 300 || !text) {
    throw new Error(`下载失败（HTTP ${status || "未知"}）`)
  }
  return text
}

async function loadRcManifest() {
  const content = await downloadText(CONFIG.manifestUrl)
  return normalizeRcManifest(JSON.parse(content))
}

async function readExistingRcScript(fileManager, path) {
  if (!fileManager.fileExists(path)) return ""
  try {
    if (fileManager.isFileStoredIniCloud(path)) {
      await fileManager.downloadFileFromiCloud(path)
    }
    return fileManager.readString(path) || ""
  } catch (error) {
    return ""
  }
}

async function promptForToken() {
  const alert = new Alert()
  alert.title = `${CONFIG.displayName} · Token`
  alert.message =
    "Token 只会写入本机 iCloud 中的 RC 组件副本，不会上传、写回仓库或读取 Stable。"
  alert.addSecureTextField("彩云天气 Token", "")
  alert.addAction("继续安装 RC")
  alert.addCancelAction("取消")

  const selected = await alert.presentAlert()
  if (selected === -1) return null
  const token = String(alert.textFieldValue(0) || "").trim()
  if (!isValidCaiyunToken(token)) {
    throw new Error("Token 为空、过短或仍是占位符")
  }
  return token
}

async function confirmInstall(scriptName, sourceUrl, existingSource) {
  const action = existingSource ? "重新安装" : "安装"
  const alert = new Alert()
  alert.title = `${action} ${CONFIG.displayName}`
  alert.message =
    `目标脚本：${scriptName}\n` +
    `版本：v${CONFIG.version} RC\n` +
    `分支：${CONFIG.branch}\n\n` +
    `下载：${sourceUrl}\n\n` +
    "Stable 脚本不会被读取或覆盖。"
  alert.addAction(`${action} v${CONFIG.version} RC`)
  alert.addCancelAction("取消")
  return (await alert.presentAlert()) !== -1
}

function assertRcTargetPath(fileManager, targetPath, scriptName) {
  const documents = fileManager.documentsDirectory()
  const stablePaths = CONFIG.stableScriptNames.map(name =>
    fileManager.joinPath(documents, `${name}.js`)
  )
  const expectedPath = fileManager.joinPath(documents, `${scriptName}.js`)

  if (targetPath !== expectedPath || stablePaths.includes(targetPath)) {
    throw new Error("RC 安装目标可能覆盖 Stable，已中止")
  }
}

async function showResult(title, message) {
  const alert = new Alert()
  alert.title = title
  alert.message = message
  alert.addAction("完成")
  await alert.presentAlert()
}

async function main() {
  const fileManager = FileManager.iCloud()
  const manifest = await loadRcManifest()
  const resource = manifest.resources[0]
  const targetPath = fileManager.joinPath(
    fileManager.documentsDirectory(),
    `${resource.scriptName}.js`
  )
  assertRcTargetPath(fileManager, targetPath, resource.scriptName)

  const existingSource = await readExistingRcScript(fileManager, targetPath)
  if (!(await confirmInstall(
    resource.scriptName,
    resource.sourceUrl,
    existingSource
  ))) return

  const source = await downloadText(resource.sourceUrl)
  if (!source.includes(resource.marker)) {
    throw new Error("RC 组件文件标记校验失败")
  }
  if (extractVersion(source) !== manifest.version) {
    throw new Error("RC 组件源码版本与测试清单不一致")
  }

  let token = extractCaiyunToken(existingSource)
  if (!token) token = await promptForToken()
  if (!token) return

  const installedSource = injectCaiyunToken(source, token)
  if (extractVersion(installedSource) !== CONFIG.version) {
    throw new Error("安装后的 RC 组件版本校验失败")
  }

  fileManager.writeString(targetPath, installedSource)
  await showResult(
    "RC 安装完成",
    `${CONFIG.displayName} 已安装为：\n${resource.scriptName}\n\n` +
    `来源：${CONFIG.branch}\nStable 未被修改。`
  )
  Safari.open(`scriptable:///open/${encodeURIComponent(resource.scriptName)}`)
}

try {
  await main()
} catch (error) {
  await showResult(
    "RC 安装失败",
    String(error?.message || error || "未知错误")
  )
} finally {
  Script.complete()
}
