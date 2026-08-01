// Colorful Poems 开发安装器
// 仅用于开发和测试阶段。发行稳定后可直接复制 src/widget.js 使用。

const CONFIG = {
  version: "1.1.1",
  manifestUrl: "https://raw.githubusercontent.com/braziliany/Colorful-Poems/main/manifest.json",
  fallbackManifest: {
    version: "1.1.1",
    changelogUrl: "https://raw.githubusercontent.com/braziliany/Colorful-Poems/main/CHANGELOG.md",
    resources: [
      {
        scriptName: "Colorful-Poems",
        sourceUrl: "https://raw.githubusercontent.com/braziliany/Colorful-Poems/main/src/widget.js",
        marker: "YOUR_CAIYUN_API_KEY",
        injectCaiyunToken: true
      },
      {
        scriptName: "Colorful Poems Installer",
        sourceUrl: "https://raw.githubusercontent.com/braziliany/Colorful-Poems/main/Installer.js",
        marker: "Colorful Poems 开发安装器"
      }
    ]
  }
};

const CAIYUN_PLACEHOLDER = "YOUR_CAIYUN_API_KEY";

function normalizeManifest(value) {
  const manifest = value && typeof value === "object" ? value : {};
  const resources = Array.isArray(manifest.resources) ? manifest.resources : [];
  if (!/^\d+\.\d+\.\d+$/.test(String(manifest.version || ""))) {
    throw new Error("安装清单版本号无效");
  }
  if (resources.length === 0) throw new Error("安装清单没有资源");
  const normalizedResources = resources.map((resource) => {
    const item = resource && typeof resource === "object" ? resource : {};
    const scriptName = String(item.scriptName || "").trim();
    const sourceUrl = String(item.sourceUrl || "").trim();
    const marker = String(item.marker || "");
    if (!scriptName || !sourceUrl.startsWith("https://") || !marker) {
      throw new Error("安装清单资源无效");
    }
    return {
      scriptName,
      sourceUrl,
      marker,
      injectCaiyunToken: item.injectCaiyunToken === true
    };
  });
  return {
    version: String(manifest.version),
    changelogUrl: String(manifest.changelogUrl || ""),
    resources: normalizedResources
  };
}

function extractVersion(content) {
  const match = String(content || "").match(/\bv(\d+\.\d+\.\d+)\b/i);
  return match ? match[1] : "0.0.0";
}

function compareVersions(left, right) {
  const a = String(left || "0").split(".").map((value) => Number(value) || 0);
  const b = String(right || "0").split(".").map((value) => Number(value) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) > (b[index] || 0)) return 1;
    if ((a[index] || 0) < (b[index] || 0)) return -1;
  }
  return 0;
}

function extractReleaseNotes(changelog, version) {
  const text = String(changelog || "");
  const escaped = String(version).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`(?:^|\\n)##\\s+(?:v)?${escaped}[^\\n]*\\n([\\s\\S]*?)(?=\\r?\\n##\\s+|$)`, "i"));
  return match ? match[1].trim() : "本次更新包含稳定性与兼容性改进。";
}

function extractCaiyunToken(content) {
  const match = String(content || "").match(/const\s+apiKey\s*=\s*(["'])(.*?)\1\s*;?/);
  const token = match ? match[2].trim() : "";
  return isValidCaiyunToken(token) ? token : null;
}

function isValidCaiyunToken(token) {
  const value = String(token || "").trim();
  return value.length >= 8 && value !== CAIYUN_PLACEHOLDER && !/[\r\n]/.test(value);
}

function injectCaiyunToken(content, token) {
  const value = String(token || "").trim();
  if (!isValidCaiyunToken(value)) throw new Error("彩云 Token 格式无效");
  const source = String(content || "");
  const pattern = /const\s+apiKey\s*=\s*["']YOUR_CAIYUN_API_KEY["']\s*;?/;
  if (!pattern.test(source)) throw new Error("组件源码中未找到彩云 Token 占位符");
  return source.replace(pattern, () => `const apiKey = ${JSON.stringify(value)};`);
}

async function downloadText(url) {
  const request = new Request(url);
  request.timeoutInterval = 20;
  const text = await request.loadString();
  const status = Number(request.response?.statusCode || 0);
  if (status < 200 || status >= 300 || !text) throw new Error(`下载失败（HTTP ${status || "未知"}）`);
  return text;
}

async function loadRemoteManifest() {
  try {
    return normalizeManifest(JSON.parse(await downloadText(CONFIG.manifestUrl)));
  } catch (error) {
    return normalizeManifest(CONFIG.fallbackManifest);
  }
}

async function promptForToken() {
  const alert = new Alert();
  alert.title = "设置彩云天气 Token";
  alert.message = "Token 仅写入本机 iCloud 中的组件脚本，不会上传或写回公开仓库。";
  alert.addSecureTextField("彩云天气 Token", "");
  alert.addAction("继续安装");
  alert.addCancelAction("取消");
  const selected = await alert.presentAlert();
  if (selected === -1) return null;
  const token = String(alert.textFieldValue(0) || "").trim();
  if (!isValidCaiyunToken(token)) throw new Error("Token 为空、过短或仍是占位符");
  return token;
}

async function confirmInstall(localVersion, remoteVersion, releaseNotes) {
  const comparison = compareVersions(remoteVersion, localVersion);
  const action = localVersion === "0.0.0" ? "安装" : comparison > 0 ? "更新" : comparison < 0 ? "降级" : "重新安装";
  const alert = new Alert();
  alert.title = `${action} Colorful Poems`;
  alert.message = `本机：v${localVersion}\n远端：v${remoteVersion}\n\n${releaseNotes}`;
  alert.addAction(`${action} v${remoteVersion}`);
  alert.addCancelAction("取消");
  return (await alert.presentAlert()) !== -1;
}

async function readExistingScript(fileManager, path) {
  if (!fileManager.fileExists(path)) return "";
  try {
    if (fileManager.isFileStoredIniCloud(path)) await fileManager.downloadFileFromiCloud(path);
    return fileManager.readString(path) || "";
  } catch (error) {
    return "";
  }
}

async function writeTransaction(fileManager, downloads, token) {
  const backups = [];
  try {
    for (const item of downloads) {
      const path = fileManager.joinPath(fileManager.documentsDirectory(), `${item.resource.scriptName}.js`);
      const existed = fileManager.fileExists(path);
      if (existed && fileManager.isFileStoredIniCloud(path)) await fileManager.downloadFileFromiCloud(path);
      const previous = existed ? fileManager.readString(path) : null;
      backups.push({ path, existed, previous });
      const output = item.resource.injectCaiyunToken ? injectCaiyunToken(item.content, token) : item.content;
      fileManager.writeString(path, output);
    }
  } catch (error) {
    for (let index = backups.length - 1; index >= 0; index -= 1) {
      const backup = backups[index];
      try {
        if (backup.existed) fileManager.writeString(backup.path, backup.previous);
        else if (fileManager.fileExists(backup.path)) fileManager.remove(backup.path);
      } catch (rollbackError) {}
    }
    throw error;
  }
}

async function showResult(title, message) {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  alert.addAction("完成");
  await alert.presentAlert();
}

async function main() {
  const fileManager = FileManager.iCloud();
  const manifest = await loadRemoteManifest();
  const mainResource = manifest.resources.find((item) => item.injectCaiyunToken);
  if (!mainResource) throw new Error("安装清单缺少主组件");

  const mainPath = fileManager.joinPath(fileManager.documentsDirectory(), `${mainResource.scriptName}.js`);
  const existingSource = await readExistingScript(fileManager, mainPath);
  const localVersion = extractVersion(existingSource);

  let changelog = "";
  if (manifest.changelogUrl.startsWith("https://")) {
    try { changelog = await downloadText(manifest.changelogUrl); } catch (error) {}
  }
  const releaseNotes = extractReleaseNotes(changelog, manifest.version);
  if (!(await confirmInstall(localVersion, manifest.version, releaseNotes))) return;

  const downloads = [];
  for (const resource of manifest.resources) {
    const content = await downloadText(resource.sourceUrl);
    if (!content.includes(resource.marker)) throw new Error(`${resource.scriptName} 文件校验失败`);
    downloads.push({ resource, content });
  }

  let token = extractCaiyunToken(existingSource);
  if (!token) token = await promptForToken();
  if (!token) return;

  await writeTransaction(fileManager, downloads, token);
  await showResult("安装完成", `Colorful Poems v${manifest.version} 已写入 Scriptable。\n\n后续更新会自动保留本机彩云 Token。`);
  Safari.open(`scriptable:///open/${encodeURIComponent(mainResource.scriptName)}`);
}

try {
  await main();
} catch (error) {
  await showResult("安装失败", String(error?.message || error || "未知错误"));
} finally {
  Script.complete();
}
