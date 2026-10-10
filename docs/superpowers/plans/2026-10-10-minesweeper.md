# Windows 扫雷游戏实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 subagent-driven-development（推荐）或 executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在 `D:\codex\game\扫雷` 中交付一个可双击运行、包含三档难度和完整鼠标操作的 `扫雷.exe`。

**架构：** 将游戏规则实现为不依赖 DOM 的 JavaScript 引擎，由浏览器界面负责渲染和输入；一个 Node.js 启动器提供仅监听本机的静态服务并打开浏览器应用窗口。最终使用 Node.js Single Executable Application 生成 Windows x64 单文件程序，并把应用资源嵌入可执行文件。

**技术栈：** HTML5、CSS、原生 JavaScript、Node.js 24、`node:test`、Node.js SEA、Postject

**规格：** `docs/superpowers/specs/2026-10-10-minesweeper-design.md`

## 全局约束

- 目标平台为 Windows x64，最终入口文件名为 `扫雷.exe`。
- 背景为白色。
- 简单为 9 x 9、10 雷；困难为 16 x 16、40 雷；噩梦为 30 x 16、99 雷。
- 第一次左键点击必须安全。
- 左键翻开格子，右键插旗或取消插旗。
- 程序只监听本机地址，不访问外部网络。
- 噩梦棋盘在窄窗口中横向滚动，格子保持可点击尺寸。

## 审查重点（Review Focus）

- 第一次点击靠近边角时仍不得布雷到被点击格，且雷数必须准确。
- 快速连续点击或游戏结束后继续点击不得重复结算或重启计时器。
- 插旗数达到雷数后，继续右键未标记格子不得让剩余雷数变成负数。
- 空白区展开不得翻开已插旗格子，也不得递归溢出。
- 当常用端口被占用或 Edge 不可用时，应选择可用端口并回退到默认浏览器。

---

### 任务 1：游戏引擎

**文件：**
- 创建：`扫雷/app/game.js`
- 创建：`扫雷/tests/game.test.js`
- 创建：`扫雷/package.json`

- [ ] **步骤 1：编写失败的引擎测试**

覆盖 `DIFFICULTIES` 的三个精确配置，以及 `MinesweeperGame` 的首次点击安全、雷数准确、邻雷计数、空白展开不越过旗帜、旗帜上限、踩雷失败、翻完非雷格获胜和结束后拒绝操作。

- [ ] **步骤 2：运行测试验证失败**

运行：`node --test tests/game.test.js`

预期：FAIL，提示 `app/game.js` 不存在或导出未定义。

- [ ] **步骤 3：实现游戏引擎接口**

在 `扫雷/app/game.js` 导出 `DIFFICULTIES`、`CELL_STATE`、`GAME_STATUS` 和 `MinesweeperGame`。类提供 `reset(difficulty)`、`reveal(row, col)`、`toggleFlag(row, col)`、`getCell(row, col)` 和只读统计数据；布雷使用可注入随机函数，空白展开使用迭代队列。

- [ ] **步骤 4：运行引擎测试验证通过**

运行：`node --test tests/game.test.js`

预期：全部 PASS。

### 任务 2：游戏界面

**文件：**
- 创建：`扫雷/app/index.html`
- 创建：`扫雷/app/styles.css`
- 创建：`扫雷/app/main.js`
- 创建：`扫雷/tests/ui.test.js`

- [ ] **步骤 1：编写失败的静态界面测试**

断言页面包含三个难度按钮、剩余雷数、计时器、状态提示、重新开始按钮和棋盘容器；断言 CSS 包含白色页面背景、固定格子尺寸、棋盘横向滚动和清晰焦点样式。

- [ ] **步骤 2：运行界面测试验证失败**

运行：`node --test tests/ui.test.js`

预期：FAIL，提示界面文件不存在。

- [ ] **步骤 3：实现 HTML、CSS 和 DOM 控制器**

`main.js` 创建 `MinesweeperGame`，用事件委托处理左键和 `contextmenu`，在首次有效翻格时启动计时器，在胜负后停止计时器，并在切换难度或重新开始时完整重置显示。所有可见文案使用中文。

- [ ] **步骤 4：运行全部应用测试**

运行：`node --test tests/*.test.js`

预期：全部 PASS。

### 任务 3：Windows 可执行文件与交付验证

**文件：**
- 创建：`扫雷/launcher.js`
- 创建：`扫雷/scripts/build.ps1`
- 创建：`扫雷/tests/launcher.test.js`
- 创建：`扫雷/README.txt`
- 生成：`扫雷/扫雷.exe`

- [ ] **步骤 1：编写失败的启动器测试**

断言路径解析拒绝目录穿越、静态资源 MIME 类型正确、服务只绑定 `127.0.0.1`、应用资源可从开发目录或 SEA 资源读取，并验证浏览器启动参数优先使用 Edge 应用模式且存在默认浏览器回退。

- [ ] **步骤 2：运行启动器测试验证失败**

运行：`node --test tests/launcher.test.js`

预期：FAIL，提示 `launcher.js` 不存在或接口未导出。

- [ ] **步骤 3：实现启动器与构建脚本**

`launcher.js` 导出可测试的资源读取、请求处理和浏览器选择函数；直接运行时启动随机可用端口、打开窗口并在合理的空闲或父进程退出条件下关闭。`build.ps1` 安装锁定版本的 Postject、生成 SEA blob、复制当前 Node 可执行文件、注入 blob 和应用资源，并输出 `扫雷.exe`。

- [ ] **步骤 4：运行全部测试并构建**

运行：`node --test tests/*.test.js`

运行：`powershell -ExecutionPolicy Bypass -File scripts/build.ps1`

预期：测试全部 PASS，且生成非空的 `扫雷.exe`。

- [ ] **步骤 5：实际启动交付物并检查 HTTP 健康状态**

运行 `扫雷.exe`，确认进程成功启动、主页及 `styles.css`、`game.js`、`main.js` 均返回成功；随后关闭进程。

- [ ] **步骤 6：执行视觉和交互检查**

用桌面与窄窗口分别检查简单、困难、噩梦三档，确认白色背景、控件无重叠、噩梦棋盘可横向滚动；实际执行左键翻格、右键插旗、重新开始和切换难度。

- [ ] **步骤 7：完成交付说明**

在 `README.txt` 写明双击 `扫雷.exe` 即可运行、Windows 安全提示的处理方式、源码目录和重新构建命令。
