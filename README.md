# 翻译 AI API - uTools 插件

一个功能强大的智能翻译工具，支持多种翻译引擎，可同时使用多个翻译服务对比结果，帮助您快速、准确地完成翻译任务。

## ✨ 功能特性

### 核心功能

- **多引擎支持**：同时支持传统翻译引擎和 AI 翻译引擎

  - ✅ 百度翻译（传统翻译引擎）
  - ✅ AI 翻译引擎（支持 OpenAI 格式 API，如 DeepSeek、OpenAI、Claude 等）
  - 🔜 更多翻译平台即将接入

- **并行翻译对比**：可同时启用多个翻译引擎，并排展示翻译结果，方便对比和选择最佳翻译

- **快速翻译**：

  - 支持从剪贴板粘贴文本快速翻译
  - 快捷键支持（Ctrl/Cmd + Enter 快速翻译）
  - 自动检测源语言

- **多语言支持**：

  - 自动检测 → 中文
  - 英文 ↔ 中文
  - 日文 ↔ 中文
  - 更多语言对持续扩展中

- **流式输出**：AI 翻译引擎支持流式输出，实时显示翻译结果

- **灵活配置**：
  - 可自定义配置多个 AI 翻译引擎
  - 支持启用/禁用单个翻译引擎
  - 配置信息本地存储，安全可靠

## 🛠️ 技术栈

- **前端框架**：Vue 3 + TypeScript
- **构建工具**：Vite 6
- **UI 组件库**：Naive UI
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **HTTP 客户端**：Axios
- **加密工具**：Crypto-js
- **AI SDK**：OpenAI SDK（兼容 OpenAI 格式 API）

## 📦 安装与使用

### 开发环境

1. **克隆项目**

   ```bash
   git clone <repository-url>
   cd 翻译-AI-API
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **启动开发服务器**

   ```bash
   npm run dev
   ```

4. **构建生产版本**
   ```bash
   npm run build
   ```

### 在 uTools 中使用

1. 在 uTools 中导入插件（将 `public` 目录作为插件目录）
2. 首次使用需要配置翻译引擎：
   - 进入设置页面
   - 配置百度翻译的 AppID 和密钥（可选）
   - 添加 AI 翻译引擎配置（支持 OpenAI 格式 API）

### 配置说明

#### 百度翻译配置

1. 访问 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册账号并创建应用，获取 AppID 和密钥
3. 在插件设置页面填入 AppID 和密钥

#### AI 翻译引擎配置

支持所有兼容 OpenAI API 格式的服务，包括但不限于：

- **DeepSeek**：`https://api.deepseek.com`
- **OpenAI**：`https://api.openai.com`
- **其他兼容服务**：只需提供对应的 Base URL 和 API Key

配置示例：

- **名称**：DeepSeek
- **基础 URL**：`https://api.deepseek.com`
- **API 密钥**：您的 API Key
- **模型**：`deepseek-chat`（或其他可用模型）

## 🎯 使用方式

### 方式一：命令输入

在 uTools 中输入以下命令：

- `翻译` 或 `translate`

### 方式二：文本拖拽

选中文本后，拖拽到 uTools 窗口，自动填充并翻译

### 方式三：粘贴文本

在翻译页面直接粘贴文本，点击翻译按钮或使用快捷键（Ctrl/Cmd + Enter）

## 📁 项目结构

```
翻译-AI-API/
├── public/                 # 插件公共资源
│   ├── plugin.json        # uTools 插件配置
│   ├── logo.png          # 插件图标
│   └── preload/          # 预加载脚本
├── src/
│   ├── api/              # API 接口
│   │   ├── aiTranslateApi.ts  # AI 翻译 API
│   │   ├── baidu.ts      # 百度翻译 API
│   │   └── openai.ts     # OpenAI SDK 封装
│   ├── stores/           # Pinia 状态管理
│   │   └── index.ts      # 应用状态存储
│   ├── router/           # 路由配置
│   │   └── index.ts
│   └── view/             # 页面组件
│       ├── HomePage/     # 翻译主页
│       ├── Setting/      # 设置页面
│       ├── Read/         # 阅读页面
│       └── Write/        # 写作页面
├── package.json
├── vite.config.js
└── README.md
```

## 🔮 未来规划

- [ ] 接入更多翻译平台（Google 翻译、有道翻译、腾讯翻译等）
- [ ] 支持更多语言对
- [ ] 翻译历史记录功能
- [ ] 翻译结果收藏功能
- [ ] 批量翻译功能
- [ ] 翻译结果导出功能
- [ ] 自定义翻译提示词
- [ ] 翻译质量评分
- [ ] 暗色主题支持

## 📝 版本说明

详细的版本更新日志请查看 [CHANGELOG.md](./CHANGELOG.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [uTools](https://u.tools/) - 优秀的效率工具平台
- [Naive UI](https://www.naiveui.com/) - 优雅的 Vue 3 组件库
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架

---

**注意**：使用本插件需要自行配置各翻译服务的 API 密钥，请妥善保管您的密钥信息。
