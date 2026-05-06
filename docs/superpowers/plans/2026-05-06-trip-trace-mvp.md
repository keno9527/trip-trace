# Trip Trace MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 Trip Trace 第一版：一个中文优先、PC 优先、纯前端本地 Web 应用，可创建旅行、导入 iPhone 原图、解析 EXIF 时间和位置、在地图与时间轴中浏览，并给照片添加家庭成员标签。

**Architecture:** 使用 React + TypeScript + Vite 构建单页应用。业务按 `trip`、`photo-import`、`timeline`、`members`、`map-view`、`storage` 拆分，IndexedDB 通过独立模块封装，UI 状态由 React 组合管理。第一版不做后端、账号、云同步和公开分享。

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, IndexedDB, Leaflet, exifr, CSS modules or plain CSS.

---

## 前置约定

- 默认中文交互：产品界面、空状态、错误提示和导入摘要均使用中文。
- 地图选型：MVP 使用 Leaflet，理由是 API 简单、适合第一版快速落地。
- 图片存储：MVP 保存缩略图和展示尺寸图片副本，不保存全尺寸原图。
- 测试优先：每个核心纯函数或存储行为先写测试，再实现。
- 每个任务完成后运行相关测试，并提交一次小提交。

## 目标文件结构

- `package.json`：项目脚本和依赖。
- `vite.config.ts`：Vite 与 Vitest 配置。
- `tsconfig.json`、`tsconfig.node.json`：TypeScript 配置。
- `index.html`：应用 HTML 入口。
- `src/main.tsx`：React 挂载入口。
- `src/App.tsx`：应用顶层布局和状态组合。
- `src/styles.css`：全局样式和 PC 工作台布局。
- `src/domain/types.ts`：Trip、PhotoAsset、Member 等共享类型。
- `src/domain/timeline.ts`：时间轴分组、排序和兜底分组逻辑。
- `src/domain/route.ts`：地图路线点位排序逻辑。
- `src/domain/members.ts`：成员标签筛选逻辑。
- `src/storage/db.ts`：IndexedDB 打开、schema 和基础读写封装。
- `src/storage/repositories.ts`：Trip、PhotoAsset、Member 的仓储函数。
- `src/photo-import/exif.ts`：EXIF 解析结果规范化。
- `src/photo-import/images.ts`：缩略图和展示尺寸图片生成。
- `src/photo-import/importPhotos.ts`：批量导入编排和导入摘要。
- `src/components/TripSidebar.tsx`：旅行列表、新建旅行、导入入口。
- `src/components/MapView.tsx`：Leaflet 地图、点位、路线和远程瓦片提示。
- `src/components/TimelinePanel.tsx`：按日期展示照片时间轴。
- `src/components/MemberTags.tsx`：成员标签添加与筛选控件。
- `src/components/ImportSummary.tsx`：导入结果摘要。
- `src/test/setup.ts`：测试环境配置。
- `src/**/*.test.ts`、`src/**/*.test.tsx`：单元与组件测试。

## Task 1: 初始化前端工程

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: 创建 Vite/React/TypeScript 基础文件**

写入最小可运行应用，页面只显示中文标题“Trip Trace”和空状态“创建第一趟旅行”。

- [ ] **Step 2: 添加测试依赖和脚本**

`package.json` 至少包含：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: 安装依赖**

Run:

```bash
npm install react react-dom leaflet react-leaflet exifr
npm install -D @vitejs/plugin-react typescript vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event fake-indexeddb
```

Expected: 依赖安装完成，生成 `package-lock.json`。`package.json` 中应明确包含运行时依赖 `react`、`react-dom`、`leaflet`、`react-leaflet`、`exifr`，以及开发依赖 `@vitejs/plugin-react`、`typescript`、`vite`、`vitest`、`jsdom`、Testing Library 和 `fake-indexeddb`。

- [ ] **Step 4: 验证基础应用**

Run: `npm run build`

Expected: TypeScript 编译和 Vite 构建通过。

- [ ] **Step 5: 提交**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src
git commit -m "chore: scaffold Trip Trace frontend"
```

## Task 2: 定义领域类型和时间轴逻辑

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/timeline.ts`
- Create: `src/domain/timeline.test.ts`

- [ ] **Step 1: 写失败测试：按日期分组和排序**

测试覆盖：

- 有拍摄时间的照片按日期分组。
- 同一天内按 `capturedAt` 升序排序。
- 缺少拍摄时间的照片进入“未知时间”分组。

Run: `npm test -- src/domain/timeline.test.ts`

Expected: FAIL，因为 `groupPhotosByDate` 尚未实现。

- [ ] **Step 2: 定义共享类型**

在 `src/domain/types.ts` 定义：

```ts
export type ExifStatus = "parsed" | "missing-gps" | "missing-time" | "failed";

export interface Trip {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  coverPhotoId?: string;
  memberIds: string[];
  mapViewport?: { center: [number, number]; zoom: number };
}

export interface PhotoAsset {
  id: string;
  tripId: string;
  fileName: string;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
  exifStatus: ExifStatus;
  thumbnailBlob?: Blob;
  displayBlob?: Blob;
  memberIds: string[];
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  color: string;
  avatarInitial: string;
  createdAt: string;
}
```

- [ ] **Step 3: 实现时间轴分组**

实现 `groupPhotosByDate(photos: PhotoAsset[])`，返回 `{ dateLabel: string; photos: PhotoAsset[] }[]`。

- [ ] **Step 4: 验证测试通过**

Run: `npm test -- src/domain/timeline.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/domain/types.ts src/domain/timeline.ts src/domain/timeline.test.ts
git commit -m "feat: add timeline grouping domain logic"
```

## Task 3: 成员标签筛选和路线排序

**Files:**
- Create: `src/domain/members.ts`
- Create: `src/domain/members.test.ts`
- Create: `src/domain/route.ts`
- Create: `src/domain/route.test.ts`

- [ ] **Step 1: 写失败测试：成员筛选**

测试覆盖：

- 未选择成员时返回全部照片。
- 选择一个成员时返回包含该成员标签的照片。
- 选择多个成员时返回包含任一成员标签的照片。

Run: `npm test -- src/domain/members.test.ts`

Expected: FAIL。

- [ ] **Step 2: 实现 `filterPhotosByMembers`**

保持函数纯净，不访问 UI 或存储。

- [ ] **Step 3: 写失败测试：路线排序**

测试覆盖：

- 只保留同时有 `latitude`、`longitude`、`capturedAt` 的照片。
- 按 `capturedAt` 升序输出路线点。

Run: `npm test -- src/domain/route.test.ts`

Expected: FAIL。

- [ ] **Step 4: 实现 `buildRoutePoints`**

返回 `{ photoId: string; latitude: number; longitude: number; capturedAt: string }[]`。

- [ ] **Step 5: 验证相关测试**

Run: `npm test -- src/domain/members.test.ts src/domain/route.test.ts`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add src/domain/members.ts src/domain/members.test.ts src/domain/route.ts src/domain/route.test.ts
git commit -m "feat: add member filters and route ordering"
```

## Task 4: IndexedDB 存储封装

**Files:**
- Create: `src/storage/db.ts`
- Create: `src/storage/repositories.ts`
- Create: `src/storage/repositories.test.ts`

- [ ] **Step 1: 写失败测试：Trip 写入读取**

使用 Vitest 测试环境中的 IndexedDB mock。如果默认环境缺少 IndexedDB，添加 `fake-indexeddb`。

Run: `npm test -- src/storage/repositories.test.ts`

Expected: FAIL。

- [ ] **Step 2: 实现 DB 打开和 schema**

对象仓库：

- `trips`
- `photos`
- `members`

以 `id` 为 keyPath，为 `photos.tripId` 建索引。

- [ ] **Step 3: 实现仓储函数**

至少实现：

- `saveTrip`
- `listTrips`
- `savePhotos`
- `listPhotosByTrip`
- `saveMember`
- `listMembers`

- [ ] **Step 4: 验证存储测试**

Run: `npm test -- src/storage/repositories.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/storage/db.ts src/storage/repositories.ts src/storage/repositories.test.ts package.json package-lock.json
git commit -m "feat: add local IndexedDB storage"
```

## Task 5: EXIF 解析和图片副本生成

**Files:**
- Create: `src/photo-import/exif.ts`
- Create: `src/photo-import/exif.test.ts`
- Create: `src/photo-import/images.ts`
- Create: `src/photo-import/importPhotos.ts`
- Create: `src/photo-import/importPhotos.test.ts`

- [ ] **Step 1: 写失败测试：EXIF 规范化**

测试覆盖：

- 有时间和 GPS 时输出 `parsed`。
- 缺少 GPS 时输出 `missing-gps`。
- 缺少时间时输出 `missing-time`。
- 解析异常时输出 `failed`。

Run: `npm test -- src/photo-import/exif.test.ts`

Expected: FAIL。

- [ ] **Step 2: 实现 EXIF 规范化**

确认 Task 1 已安装 `exifr`。使用 `exifr` 读取文件；将 GPS 转成十进制度经纬度，将拍摄时间转成 ISO 字符串。

- [ ] **Step 3: 实现图片副本生成**

在 `images.ts` 中实现：

- `createThumbnail(file: File): Promise<Blob>`
- `createDisplayImage(file: File): Promise<Blob>`

控制展示图最长边，避免保存全尺寸原图。

- [ ] **Step 4: 写导入编排测试**

测试批量导入摘要和错误处理：

- `importedCount`
- `geotaggedCount`
- `missingLocationCount`
- `parseFailureCount`
- `skippedCount`
- 不支持或不可读取的文件会被跳过，并计入 `skippedCount`。
- EXIF 解析失败但图片可解码时，照片仍会导入，`capturedAt`、`latitude`、`longitude` 为空，`exifStatus` 为 `failed`。
- 缺少 GPS 的照片会导入到时间轴，但不会生成地图点位。

- [ ] **Step 5: 实现 `importPhotos`**

逐个文件处理，单个失败不影响整批导入；可解码但 EXIF 失败的图片仍导入为未知时间、无位置。

- [ ] **Step 6: 验证导入相关测试**

Run: `npm test -- src/photo-import/exif.test.ts src/photo-import/importPhotos.test.ts`

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add src/photo-import package.json package-lock.json
git commit -m "feat: add photo import pipeline"
```

## Task 6: 应用状态和基础工作台 UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/components/TripSidebar.tsx`
- Create: `src/components/ImportSummary.tsx`
- Create: `src/components/TripSidebar.test.tsx`

- [ ] **Step 1: 写失败组件测试：空状态与创建旅行**

测试覆盖：

- 无旅行时展示“创建第一趟旅行”。
- 输入旅行名称后可以创建旅行。
- 创建后展示导入入口。

Run: `npm test -- src/components/TripSidebar.test.tsx`

Expected: FAIL。

- [ ] **Step 2: 实现 TripSidebar**

只实现 MVP 所需交互：旅行列表、新建旅行、文件选择入口。

- [ ] **Step 3: 在 App 中接入存储和状态**

启动时读取本地旅行；创建旅行后保存到 IndexedDB。

- [ ] **Step 4: 验证组件测试**

Run: `npm test -- src/components/TripSidebar.test.tsx`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/App.tsx src/styles.css src/components/TripSidebar.tsx src/components/ImportSummary.tsx src/components/TripSidebar.test.tsx
git commit -m "feat: add trip workspace shell"
```

## Task 7: 时间轴和成员标签 UI

**Files:**
- Create: `src/components/TimelinePanel.tsx`
- Create: `src/components/TimelinePanel.test.tsx`
- Create: `src/components/MemberTags.tsx`
- Create: `src/components/MemberTags.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: 写失败测试：时间轴渲染**

测试覆盖：

- 按日期显示照片分组。
- 未知时间照片显示在“未知时间”分组。
- 点击照片触发选中回调。

Run: `npm test -- src/components/TimelinePanel.test.tsx`

Expected: FAIL。

- [ ] **Step 2: 实现 TimelinePanel**

使用 `groupPhotosByDate`，展示缩略图、文件名和成员标签。

- [ ] **Step 3: 写失败测试：成员标签筛选**

测试覆盖：

- 添加成员标签。
- 选择成员筛选后，只展示相关照片。

Run: `npm test -- src/components/MemberTags.test.tsx`

Expected: FAIL。

- [ ] **Step 4: 实现 MemberTags**

支持创建成员、为选中照片添加标签、切换筛选。

- [ ] **Step 5: 验证相关测试**

Run: `npm test -- src/components/TimelinePanel.test.tsx src/components/MemberTags.test.tsx`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add src/components/TimelinePanel.tsx src/components/TimelinePanel.test.tsx src/components/MemberTags.tsx src/components/MemberTags.test.tsx src/App.tsx src/styles.css
git commit -m "feat: add timeline and member tagging UI"
```

## Task 8: 地图视图

**Files:**
- Create: `src/components/MapView.tsx`
- Create: `src/components/MapView.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: 写失败组件测试：地图输入状态**

不要在单元测试中真实加载地图瓦片。测试覆盖：

- 无点位时展示中文空状态。
- 有带坐标照片时渲染点位数据容器。
- 展示远程地图瓦片提示文案。

Run: `npm test -- src/components/MapView.test.tsx`

Expected: FAIL。

- [ ] **Step 2: 安装 Leaflet 依赖**

确认 Task 1 已安装 `leaflet` 和 `react-leaflet`。如果实现时依赖缺失，再运行：

Run: `npm install leaflet react-leaflet`

Expected: 依赖安装完成。

- [ ] **Step 3: 实现 MapView**

实现：

- 地图瓦片层。
- 照片点位 Marker。
- 按时间排序的路线 Polyline。
- 点击点位时选中照片。
- 中文隐私提示：地图可能请求远程瓦片，但不会上传照片或旅行记录。

- [ ] **Step 4: 验证地图测试**

Run: `npm test -- src/components/MapView.test.tsx`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/MapView.tsx src/components/MapView.test.tsx src/App.tsx src/styles.css package.json package-lock.json
git commit -m "feat: add map view"
```

## Task 9: 串联照片导入到完整体验

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/TripSidebar.tsx`
- Modify: `src/components/ImportSummary.tsx`
- Modify: `src/styles.css`
- Create: `src/App.test.tsx`

- [ ] **Step 1: 写失败集成测试：导入后进入时间轴**

Mock `importPhotos` 和 storage。测试覆盖：

- 选择文件后显示“正在导入”。
- 导入完成后显示摘要。
- 已导入照片出现在时间轴。

Run: `npm test -- src/App.test.tsx`

Expected: FAIL。

- [ ] **Step 2: 实现 App 导入流程**

串联：

- 文件选择。
- `importPhotos`。
- `savePhotos`。
- 当前旅行照片刷新。
- 导入摘要显示。

- [ ] **Step 3: 实现选中联动**

时间轴点击照片后更新 `selectedPhotoId`；地图点位点击后同样更新，并使两个面板共享选中状态。

- [ ] **Step 4: 验证集成测试**

Run: `npm test -- src/App.test.tsx`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/App.tsx src/App.test.tsx src/components/TripSidebar.tsx src/components/ImportSummary.tsx src/styles.css
git commit -m "feat: connect import flow to workspace"
```

## Task 10: 最终验证和手动验收

**Files:**
- Modify as needed only for issues found during verification.

- [ ] **Step 1: 运行完整测试**

Run: `npm test`

Expected: 所有测试通过。

- [ ] **Step 2: 运行生产构建**

Run: `npm run build`

Expected: TypeScript 和 Vite 构建通过。

- [ ] **Step 3: 启动本地开发服务**

Run: `npm run dev`

Expected: 输出本地访问地址，例如 `http://localhost:5173/`。

- [ ] **Step 4: 手动验收**

在浏览器中确认：

验收文件至少包含：

- 1 张带 EXIF 拍摄时间和 GPS 的 iPhone 原图。
- 1 张可解码但没有 GPS 的图片。
- 1 个不支持或不可读取的文件，例如 `.txt` 或损坏图片。

如果当前环境拿不到真实 iPhone 原图，需要在最终验收记录中说明，并用带 EXIF GPS 的替代样例图片完成导入流程验证。

- 可以创建旅行。
- 可以选择图片文件并看到导入进度/摘要。
- 带坐标照片显示在地图上。
- 所有照片显示在时间轴中。
- 地图与时间轴选中状态同步。
- 可以添加成员标签并筛选。
- 刷新后数据仍存在。
- 界面为中文。
- 页面说明原图不会长期归档，地图瓦片可能来自远程服务。

- [ ] **Step 5: 修复验收中发现的问题**

每个问题先补测试或明确手动复现步骤，再修复。

- [ ] **Step 6: 最终提交**

```bash
git status --short
git add <changed-files>
git commit -m "test: verify Trip Trace MVP"
```

## 完成标准

- `npm test` 通过。
- `npm run build` 通过。
- 手动验收清单通过，或最终回复明确列出无法验证的项目和原因。
- 工作区没有无关改动。
- MVP 范围保持与 `docs/superpowers/specs/2026-05-06-trip-trace-design.md` 一致。
