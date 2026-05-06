# Repository Guidelines

## 项目结构与模块组织

本仓库是 Trip Trace 的 Vite + React + TypeScript 前端应用。应用代码位于 `src/`：`main.tsx` 负责挂载 React，`App.tsx` 是当前 UI 入口，`styles.css` 放全局样式，`src/test/setup.ts` 配置测试环境。产品设计和实施资料位于 `docs/superpowers/`，其中 `specs/` 存设计说明，`plans/` 存实现计划。`dist/` 是构建产物，不要手工编辑。

## 构建、测试与本地开发命令

- `npm install`：按 `package-lock.json` 安装依赖。
- `npm run dev`：启动 Vite 本地开发服务器。
- `npm run build`：先执行 `tsc -b` 类型检查，再生成生产构建。
- `npm test`：以单次运行模式执行 Vitest 测试。
- `npm run test:watch`：以监听模式运行 Vitest，适合开发时使用。

## 编码风格与命名约定

使用 TypeScript 和 React 函数组件。保持现有风格：两个空格缩进、双引号、分号，以及短小直接的组件文件。React 组件使用 `PascalCase`，例如 `TripMap.tsx`；工具函数和变量使用 `camelCase`。在样式规模较小前，优先继续使用 `src/styles.css` 管理全局样式。小改动不要顺手做大范围重构。

## 测试规范

测试使用 Vitest、`jsdom`、Testing Library、`@testing-library/jest-dom` 和 `fake-indexeddb`。测试初始化代码放在 `src/test/setup.ts`。优先将测试放在被测代码附近，命名示例：`App.test.tsx`、`storage.test.ts`。新增功能应优先覆盖用户可见行为和持久化逻辑，而不是实现细节。提交前运行 `npm test`；涉及类型、入口或构建配置时同时运行 `npm run build`。

## 提交与 Pull Request 规范

近期提交采用简短祈使句摘要，部分使用 conventional 前缀，例如 `chore: scaffold Trip Trace frontend`、`Add Trip Trace MVP implementation plan`。继续沿用这一风格。Pull Request 应包含清晰描述、已执行的验证命令、相关 issue 或规划文档链接；涉及 UI 变化时附截图。

## 安全与配置提示

不要提交密钥、本地凭据或生成缓存。依赖变更必须同时体现在 `package.json` 和 `package-lock.json`。后续实现照片导入、存储或导出功能时，将照片元数据和地理位置数据视为敏感信息处理。
