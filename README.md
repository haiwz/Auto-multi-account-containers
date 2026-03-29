# Auto Multi-Account Containers

中文说明与 English guide are both included below.

## 中文

### 项目简介

Auto Multi-Account Containers 是一个面向 Firefox 的 Manifest V3 扩展，用来把浏览器容器变成可管理、可复用、可自动清理的工作单元。

它适合这些场景：

- 同时登录多个账号，又不希望 Cookie、Local Storage、IndexedDB 相互污染
- 给不同容器绑定不同代理，隔离工作、测试、运营、海外站点访问环境
- 需要用快捷键快速打开某个固定容器，或一键清理并重建容器
- 希望现有 Firefox 容器也能被纳入统一管理，而不是从零重建

### 核心能力

- 创建受管容器：直接在扩展弹窗里创建新的 Firefox 容器
- 导入现有容器：把当前浏览器里尚未托管的容器导入到扩展中统一管理
- 独立代理配置：每个容器可选“继承浏览器默认代理”或“自定义代理”
- 多种代理类型：支持 `HTTP`、`HTTPS`、`SOCKS5`、`SOCKS4`
- 远程 DNS：自定义代理模式下可切换 Remote DNS
- 自动清理：当容器最后一个标签页关闭后，扩展会自动清理数据并重建容器
- 手动清理与重建：可以随时手动执行 clean / rebuild
- 顺序驱动快捷键：容器顺序会自动映射到打开槽位和清理槽位
- 缺失容器恢复：如果 Firefox 容器被外部删除，扩展会把它标记为缺失并允许重建
- 多语言界面：支持跟随浏览器、English、简体中文、繁體中文

### 容器与快捷键规则

- 扩展当前提供 9 个“打开容器”槽位
- 扩展当前提供 9 个“清理容器”槽位
- 槽位不是手动指定的，而是由容器在列表中的顺序自动分配
- 你把某个容器上移或下移后，它绑定的快捷键槽位也会一起改变

这套设计的目的，是让“第 1 个容器永远是最常用的那个”，“第 2 个容器永远是次常用的那个”，从而降低维护成本。

### 代理模式

每个受管容器都可以配置以下两种模式：

- 浏览器默认：直接沿用 Firefox 当前的全局代理策略
- 自定义代理：为这个容器单独指定代理主机、端口、协议与 Remote DNS

这意味着你可以：

- 让工作容器走公司代理
- 让测试容器走本地 SOCKS
- 让普通浏览容器继续使用浏览器默认网络环境

### 数据清理范围

当前“清理容器”会移除该容器对应的：

- Cookies
- IndexedDB
- Local Storage

清理后扩展会重建同名容器，保留你配置的名称、颜色、图标、代理模式、自动清理选项和快捷键顺序。

### 安装方式

普通用户应安装“已签名”的 `.xpi` 包。

推荐方式：

1. 打开 GitHub Releases 页面
2. 下载对应版本的已签名 `.xpi`
3. 用 Firefox 打开该文件，或在 `about:addons` 中选择“从文件安装附加组件”

注意：

- 标准版 Firefox 默认要求扩展包已签名
- 本地 `web-ext build` 生成的打包文件适合开发或校验，不适合作为普通用户安装包

### 使用流程

1. 安装扩展后，点击工具栏图标打开弹窗
2. 创建新容器，或导入已有 Firefox 容器
3. 为容器设置名称、颜色、图标和代理策略
4. 视需要开启自动清理
5. 通过调整顺序，让常用容器占据更靠前的快捷键槽位
6. 需要重置状态时，使用 clean / rebuild

### 外部链接打开

扩展现在会注册自定义协议 `ext+automac`，用来把外部链接直接交给某个受管容器打开。

- 在容器卡片的展开区域，可以看到两种链接模板：
- `稳定容器链接`：按 `profileId` 绑定，适合放进笔记、文档、任务系统
- `槽位链接`：按当前打开槽位绑定，适合配合 Raycast、快捷指令或启动器
- 链接中的 `#` 后面就是目标网址，支持直接写 `https://example.com`，也支持只写 `example.com`
- 目前只允许 `http` 和 `https` 目标地址

示例：

```text
ext+automac://open?profileId=YOUR_PROFILE_ID#https://example.com
ext+automac://open?slot=1#https://example.com
```

首次点击这类链接时，Firefox 可能会提示你确认由 Auto Multi-Account Containers 处理该协议。确认后，后续点击笔记里的链接或从 Raycast 触发同类链接，就会在对应容器中打开目标网址。

### Raycast Script Command 模板

仓库里提供了一个可直接导入的 Raycast Script Command 模板：

- [raycast/open-url-in-container.sh](/Volumes/SSD512/Code/Auto-multi-account-containers/raycast/open-url-in-container.sh)

导入方式：

1. 在 Raycast 设置中打开 `Extensions`
2. 点击添加按钮，选择 `Add Script Directory`
3. 选择这个目录：`/Volumes/SSD512/Code/Auto-multi-account-containers/raycast`
4. 重新打开 Raycast，搜索 `Open URL in Container`

默认行为：

- 第一个参数是槽位下拉框，默认提供 `Slot 1` 到 `Slot 9`
- 第二个参数是要打开的网址
- 执行后，脚本会调用：

```text
ext+automac://open?slot=N#https://example.com
```

如果你想让某个命令稳定绑定到固定容器，而不是依赖槽位顺序，可以把脚本里 `argument1` 的某个值从 `slot:1` 改成 `profile:YOUR_PROFILE_ID`。这个 `profileId` 可以直接从扩展弹窗里的“稳定容器链接”拿到。

### 权限说明

扩展当前申请以下权限：

- `contextualIdentities`：创建、更新、删除 Firefox 容器
- `cookies`：配合容器隔离与数据清理
- `proxy`：为不同容器返回不同代理配置
- `tabs`：打开容器标签页、关闭待清理容器的标签页
- `storage`：保存受管容器配置与排序
- `browsingData`：清理容器对应的站点数据
- `<all_urls>`：让代理请求回调覆盖所有访问目标

### 隐私说明

- 扩展不依赖远程后端服务来保存你的容器配置
- 配置数据保存在浏览器扩展存储中
- 代理配置由你手动输入，扩展不会替你生成或购买代理
- 发布仓库不会再跟踪本地 AMO 上传状态文件 `.amo-upload-uuid`

### 本地开发

安装依赖：

```bash
npm install
```

校验清单：

```bash
npm run verify:manifest
```

运行扩展 lint：

```bash
npm run lint:ext
```

构建未签名包：

```bash
npm run build
```

签名 unlisted 包：

```bash
export WEB_EXT_API_KEY="your-amo-jwt-issuer"
export WEB_EXT_API_SECRET="your-amo-jwt-secret"
npm run sign:unlisted
```

更多发布细节见 [RELEASE.md](./RELEASE.md)。

## English

### Overview

Auto Multi-Account Containers is a Firefox Manifest V3 extension that turns Firefox containers into manageable, reusable, and automatically resettable browsing environments.

It is designed for people who need to:

- stay logged into multiple accounts at the same time without state leakage
- route different containers through different proxies
- open or clean specific containers quickly from keyboard shortcuts
- import existing Firefox containers instead of rebuilding everything from scratch

### What It Does

- Create managed containers directly from the popup
- Import existing Firefox containers into the managed list
- Configure per-container proxy behavior
- Support `HTTP`, `HTTPS`, `SOCKS5`, and `SOCKS4`
- Enable Remote DNS for custom proxy setups
- Automatically clean and rebuild a container after its last tab closes
- Manually clean and rebuild a container on demand
- Auto-assign shortcut slots based on the current container order
- Detect missing containers and allow rebuilding them
- Provide a localized popup in English, Simplified Chinese, and Traditional Chinese

### Shortcut Model

The extension currently exposes:

- 9 open slots
- 9 clean slots

Slots are assigned from the current container order instead of being configured individually.

That means:

- moving a container up gives it a higher-priority shortcut slot
- moving a container down gives it a lower-priority shortcut slot
- keyboard usage stays predictable even when your managed list changes

### Proxy Modes

Each managed container can use one of two modes:

- Browser default
- Custom proxy

In custom mode, you can configure:

- proxy type
- host
- port
- Remote DNS

This lets you keep one container on the browser-wide network path while sending others through dedicated upstream proxies.

### What “Clean” Removes

Cleaning a managed container currently removes:

- Cookies
- IndexedDB
- Local Storage

After cleanup, the extension recreates the Firefox container and keeps the managed profile settings such as name, color, icon, proxy mode, auto-clean, and shortcut order.

### Installation

For regular Firefox users, the correct package is a signed `.xpi`.

Recommended flow:

1. Open the GitHub Releases page
2. Download the signed `.xpi` for the target version
3. Open it with Firefox, or install it from `about:addons`

Notes:

- Standard Firefox builds require signed extensions
- The artifact produced by `web-ext build` is useful for development and validation, not as the final user-facing package

### Typical Workflow

1. Open the extension popup from the Firefox toolbar
2. Create a new managed container or import an existing one
3. Set name, color, icon, and proxy behavior
4. Enable auto-clean if you want disposable sessions
5. Reorder containers to control shortcut priority
6. Use clean / rebuild whenever you want a fresh isolated state

### External Link Opening

The extension now registers a custom `ext+automac` protocol so external links can open directly in a managed container.

- The expanded profile card shows two link templates
- `Stable profile link` binds to `profileId`, which is better for notes, docs, and task systems
- `Slot link` binds to the current open slot, which works well with Raycast and launchers
- The text after `#` is the target URL. You can use `https://example.com` or just `example.com`
- Only `http` and `https` targets are accepted

Examples:

```text
ext+automac://open?profileId=YOUR_PROFILE_ID#https://example.com
ext+automac://open?slot=1#https://example.com
```

The first time you click one of these links, Firefox may ask you to confirm that Auto Multi-Account Containers should handle the protocol. After that, the same links can be triggered from notes or Raycast and will open in the selected container.

### Raycast Script Command Template

The repository includes an importable Raycast Script Command template:

- [raycast/open-url-in-container.sh](/Volumes/SSD512/Code/Auto-multi-account-containers/raycast/open-url-in-container.sh)

Import flow:

1. Open `Extensions` in Raycast Settings
2. Click the add button and choose `Add Script Directory`
3. Select `/Volumes/SSD512/Code/Auto-multi-account-containers/raycast`
4. Search for `Open URL in Container` in Raycast

Default behavior:

- argument 1 is a dropdown with `Slot 1` through `Slot 9`
- argument 2 is the target URL
- the script opens:

```text
ext+automac://open?slot=N#https://example.com
```

If you want a command to stay bound to one managed container instead of following slot order, replace one of the dropdown values such as `slot:1` with `profile:YOUR_PROFILE_ID`. You can copy that `profileId` from the stable link shown in the extension popup.

### Permissions

The extension requests:

- `contextualIdentities` to manage Firefox containers
- `cookies` to support isolation and cleanup
- `proxy` to return per-container proxy settings
- `tabs` to open container tabs and close tabs during cleanup
- `storage` to persist managed profile data
- `browsingData` to clear per-container site data
- `<all_urls>` so the proxy request hook can apply everywhere

### Privacy

- The extension does not rely on a remote backend to store profile settings
- Managed configuration is stored in browser extension storage
- Proxy credentials and proxy endpoints come from user input
- The repository no longer tracks the local AMO upload-state file `.amo-upload-uuid`

### Development

Install dependencies:

```bash
npm install
```

Validate the manifest:

```bash
npm run verify:manifest
```

Run extension lint:

```bash
npm run lint:ext
```

Build an unsigned package:

```bash
npm run build
```

Sign an unlisted package:

```bash
export WEB_EXT_API_KEY="your-amo-jwt-issuer"
export WEB_EXT_API_SECRET="your-amo-jwt-secret"
npm run sign:unlisted
```

See [RELEASE.md](./RELEASE.md) for more release details.
