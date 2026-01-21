# Quick Style Settings Manager

这是一个为 [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) 插件设计的可视化 CSS 片段管理器。无需手动编写繁琐的 YAML 配置，即可通过现代化的可视化界面轻松创建、编辑和管理样式设置。

## 主要功能 (Features)

- **可视化构建器 (Visual Builder)**
  - 抛弃手写 YAML，通过图形界面添加和配置 Style Settings。
  - 支持所有主流设置类型：Colors, Toggles, Sliders, Text, Select 等。

- **主从视图设计 (Master-Detail View)**
  - **主列表**: 采用紧凑的单行布局，最大化屏幕利用率。
  - **详细页**: 点击任意设置项进入详细编辑视图（Split View），左侧编辑元数据（ID, Title, Description），右侧编写对应的 CSS 代码。

- **智能分组与折叠 (Smart Grouping)**
  - 使用 **Heading** 类型作为分组依据。
  - Heading 下方的所有设置项自动识别为该组的子项。
  - 支持点击 Heading 左侧箭头进行折叠/展开，保持界面整洁。
  - **组拖拽**: 拖动 Heading 时，会自动携带并移动其下属的所有子设置项。
  - **组删除**: 删除 Heading 时，会智能提示并删除该组内的所有子项。

- **CSS 自动格式化 (Auto Formatter)**
  - 内置 CSS 格式化工具。
  - 保存或更新时，自动**缩紧排版**，去除多余空行，并进行智能缩进（Smart Indentation）。
  - 确保生成的 CSS 文件既紧凑又规范。

- **双向同步 (Bidirectional Sync)**
  - 可视化界面的修改会实时更新底层的 CSS/YAML 文件。
  - 支持 `/* @settings ... */` YAML 块和 Asterisk Block (`/**********/`) 格式的解析与生成。

## 使用说明 (Usage)

### 1. 启动
在 Obsidian 命令面板 (`Ctrl/Cmd + P`) 中搜索并执行：
`Quick Style Settings: Manage Style Settings Snippets`

### 2. 管理界面操作
- **添加设置**: 在列表底部，从下拉菜单中选择设置类型（如 `Heading`, `Color`, `Toggle` 等），然后点击 **Add** 按钮。
- **编辑详情**: 点击设置项的**标题区域**，即可打开详细编辑模态框。
- **编写 CSS**: 在详细页面的右侧代码框中输入 CSS。插件会自动处理 ID 关联和格式化。

### 3. 布局与交互
- **拖拽排序**:
  - 按住设置项最左侧的 **拖拽手柄 (`::`)** 即可上下拖动排序。
  - 拖动 Heading 会移动整个分组。
- **右侧控件**:
  - **类型标识**: 显示当前设置的类型（如 `class-toggle`）。
  - **复制 ID**: 部分类型支持一键复制变量名或 ID。
  - **删除**: 点击右侧垃圾桶图标删除。注意：删除 Heading 会连带删除其子项。
- **折叠**: 点击 Heading 行的箭头图标 (`>`) 可折叠/展开该分组。

### 4. 搜索
- 在代码编辑界面，支持使用搜索框快速查找 CSS 内容。

## 安装
(通过 BRAT 或手动安装)
