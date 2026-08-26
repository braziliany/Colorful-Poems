# 彩云诗词桌面天气

[![Release](https://img.shields.io/github/v/release/braziliany/Colorful-Poems?display_name=tag&sort=semver)](https://github.com/braziliany/Colorful-Poems/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

运行在 iOS Scriptable 中的中号桌面小组件，主脚本为 `src/widget.js`。

当前稳定版本：v1.1.2

## 当前功能

- 彩云天气、天气预警和生活指数
- 农历与每日诗词
- 日历事件与提醒事项数据
- 相册背景与透明背景

## v1.1.0 视觉主题

- 默认背景升级为深蓝紫玻璃风渐变。
- 黄色作为日期、天气图标、日出和日落的强调色。
- 最高与最低温度继续使用红色和蓝色区分。
- 保留原有 `Good afternoon~` 特殊字体效果和水平双栏布局。
- 相册背景、透明背景和全部数据接口保持不变。

## v1.1.1 视觉细节

- 气象预警根据红、橙、黄、蓝等级使用官方信号色。
- 无预警时天气描述恢复为克制的灰白色。
- 日期行使用 SF Symbol 电池图标和独立百分比，替换字符占位符。
- 正常、低电量和充电状态分别使用灰紫色、红色和绿色。
- Midnight 深蓝紫主题、双栏布局和全部数据接口保持不变。

### Battery hierarchy optimization

- 电池状态从左侧农历行移至右下角更新时间行。
- 电池图标和百分比缩小，正常状态使用低视觉权重的灰紫色。
- 低电量和充电状态继续使用红色、绿色提示。
- 电量来源、充电判断、双栏结构和天气布局保持不变。

## v1.1.2 Offline Cache & UI Cleanup

- 新增三个独立缓存域：Weather Cache（天气及天气预警）、Lunar Cache（农历）和 Poetry Cache（每日诗词）。
- 三个缓存域分别维护 last-known-good data 与 `successfulFetchedAt`；一个数据源失败不会使其他数据源失效。
- 断网或接口异常时优先显示最后一次成功数据。
- 右下角正确区分实时数据的“更新于 HH:mm”和缓存数据的“缓存 · HH:mm”。
- 首次运行无缓存和缓存损坏时继续使用安全 fallback，不会崩溃。
- 删除低价值电池图标、百分比和全部相关死代码。
- Midnight Theme、中号双栏和现有数据接口保持不变。

## 安装

### Scriptable Installer（推荐）

Official Scriptable Installer 是推荐安装方式。将仓库根目录的 `Installer.js` 复制到 Scriptable 后运行：

- 首次安装会用隐藏输入框要求填写彩云天气 Token。
- Token 只会注入本机 iCloud 中的 `Colorful-Poems.js`，不会写回公开仓库。
- 后续运行安装器更新时，会自动保留已安装脚本中的 Token。
- 下载或写入失败会保留原有脚本。

用户需要申请并配置自己的彩云天气 Token。

### 手动安装

将 `src/widget.js` 完整复制到 Scriptable 中运行，并将脚本顶部的 `YOUR_CAIYUN_API_KEY` 替换为自己的彩云天气 Token。首次使用天气功能时需要允许定位权限；未授权定位时可在脚本顶部填写默认经纬度。

不要把真实 Token 提交到 Git 仓库或公开分享的脚本中。

## 容错说明

- Weather（含天气预警）、Lunar 和 Poetry 三个缓存域在各自数据源失败时优先使用最后成功缓存；无缓存时显示兜底文本。
- 无效 SF Symbol 自动使用备用图标。
- 背景图片缺失或无法读取时使用配置的纯色背景。
- 农历优先显示接口的 `lunar_date` 字段，旧格式响应仍可兼容。
- 今日诗词 Token 会保存在 Scriptable 本地目录，并在失效时自动刷新。
- 较长的日期、农历、预警、诗句和日程文本会在保持单行布局的前提下适度缩小。

## 许可证

本项目采用 [MIT License](LICENSE) 开源。
