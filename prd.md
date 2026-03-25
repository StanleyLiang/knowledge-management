# Lexical Editor/Viewer Library — Product Requirements Document

> **Version:** 1.1
> **Last Updated:** 2026-03-21
> **Status:** Draft

---

## 1. 專案概要

| 項目 | 說明 |
|------|------|
| **專案名稱** | Lexical Editor/Viewer Library |
| **目標** | 基於 Lexical.js 建立可擴展的富文字編輯閱讀器 library |
| **產出元件** | `Editor`（編輯模式）、`Viewer`（唯讀模式） |
| **組建方式** | Monorepo 內部 package |
| **Viewer 設計原則** | 基於 Editor 的結構推導而來，共用節點定義，分離渲染邏輯 |

## 2. Tech Stack

- Lexical.js (latest v0.41)
- shadcn/ui + Tailwind CSS
- dayjs
- framer-motion
- lodash-es
- lucide-react
- react-simple-maps（Landmark 地圖渲染，D3-geo + TopoJSON）
- **Event Bus:** mitt（低耦合對外溝通）
- **i18n:** i18next + react-i18next（Vite/Next.js 通用）

## 3. Editor Interface 設計原則

引用者可客製化：
- **Toolbar** — 可自訂 toolbar items 和排列
- **Plugins** — 可擴展或替換 plugins
- **Style** — 可覆寫主題樣式
- **i18n** — 可注入翻譯資源
- **UI 元件** — 優先使用 shadcn/ui 現有元件，避免重複造輪子
- **Icon** — UI 圖示優先使用 Lucide React（emoji 除外）

---

## 4. Editor Toolbar 規格

### 排列順序（`|` 為分隔線）

```
Undo Redo | Heading▾ | Bold Italic MoreFormat▾ | TextColor▾ TextBgColor▾ | TextAlign▾ | ListItem▾ | Outdent Indent | Image Table▾ CreateLink LinkToPage▾ Video Attachment MoreInsert▾
```

### 各 Toolbar Item 細節

| Item | 類型 | 內容 |
|------|------|------|
| **Undo** | Button | 復原 |
| **Redo** | Button | 重做 |
| **Heading** | Dropdown | Normal Text, H1, H2, H3, H4, H5, H6 |
| **Bold** | Toggle Button | 粗體 |
| **Italic** | Toggle Button | 斜體 |
| **MoreFormat** | Dropdown (…) | Underline, Strikethrough, Inline Code, Superscript, Subscript |
| **Text Color** | Dropdown | Color Picker |
| **Text BG Color** | Dropdown | Color Picker |
| **Text Align** | Dropdown | Align Left, Align Center, Align Right |
| **List Item** | Dropdown | Bulleted List, Numbered List |
| **Outdent** | Button | 減少縮排 |
| **Indent** | Button | 增加縮排 |
| **Image** | Button | 插入圖片 |
| **Table** | Dropdown | 表單：Row 輸入、Column 輸入、Submit 按鈕 |
| **Create Link** | Button | 建立超連結 |
| **Link to Page** | Dropdown | 搜尋輸入框，搜尋頁面 |
| **Video** | Button | 插入影片 |
| **Attachment** | Button | 插入附件 |
| **MoreInsert** | Dropdown (…) | Action Item, ──(separator)──, Divider, Collapsible Container, Quote, Code Snippet, Mermaid, Bookmark, Landmark |

### 釐清事項

- **Splitter** = toolbar/dropdown 的視覺分隔線，非可插入元素
- **Divider** = 編輯器中可插入的水平分隔線 (`<hr>`)
- **Link to Page** = 通用 page search 介面，資料來源由引用者決定（外部 wiki 或內部多頁文件皆可）
- **Video** = Editor 提供 interface，具體上傳/嵌入邏輯由引用者實作
- **Image / Attachment** = 同上，由引用者透過 interface 決定行為
- **Code Snippet** = 語法高亮由引用者決定是否啟用，但**限定使用 Prism**
- **Action Item** = checkbox/todo 勾選項目
- **Collapsible Container** = 可展開/收合的區塊
- **Mermaid** = 支援 Mermaid 語法的圖表區塊
- **Color Picker** = 預設色盤 + 完整 color wheel 自由選色，引用者可自訂預設色

---

## 5. Media 節點共通規格

### 狀態機（Image / Video / Attachment）

```
initial → uploading → converting → success
                                 → error（顯示錯誤訊息 + 重試）
```

### 上傳 Interface

引用者可透過 **function callback** 自訂檔案上傳方式：

```ts
onUpload?: (
  file: File,
  type: 'image' | 'video' | 'attachment',
  onStatusChange: (status: 'uploading' | 'converting') => void
) => Promise<{
  url: string
  width?: number
  height?: number
  fileName?: string
  fileSize?: number
  mimeType?: string
}>
```

- **有提供 `onUpload`**：呼叫引用者的 function，取得上傳後的 URL 及 metadata
- **未提供 `onUpload`（預設）**：自動將檔案轉為 **data URL** 作為節點的 source
- **狀態通知**：引用者可透過 `onStatusChange` callback 通知中間狀態變化
- **不支援進度百分比**：uploading / converting 狀態僅顯示 loading 指示
- **錯誤處理**：Promise rejection 映射到 error 狀態，顯示錯誤訊息 + 重試按鈕

### URL 裝飾 Interface

```ts
decorateUrl?: (
  url: string,
  type: 'image' | 'video' | 'attachment'
) => string | Promise<string>
```

- **有提供 `decorateUrl`**：渲染 Image/Video/Attachment 時，先透過此 callback 轉換 URL（如加 auth token、CDN prefix、query params）
- **未提供（預設）**：直接使用原始 URL

**流程範例（Video）：**
1. Editor 呼叫 `onUpload(file, 'video', statusCallback)`
2. 節點自動進入 `uploading` 狀態
3. 上傳完成 → 引用者呼叫 `statusCallback('converting')` → 節點進入 `converting` 狀態
4. 轉換完成 → Promise resolve `{ url: streamUrl }` → 節點進入 `success` 狀態
5. 任何錯誤 → Promise reject → 節點進入 `error` 狀態

---

## 6. Image 節點詳細規格

### 浮動工具列（Block Selection Popover）

選取 Image 時，上方浮現 popover toolbar，由左至右：

| # | Item | 類型 | 說明 |
|---|------|------|------|
| 1 | Align Left | Button | 圖片靠左對齊 |
| 2 | Align Center | Button | 圖片置中對齊 |
| 3 | Align Right | Button | 圖片靠右對齊 |
| 4 | Width Input | Number Input | 圖片寬度（px） |
| 5 | Height Input | Number Input | 圖片高度（px） |
| 6 | Image Viewer | Button | 開啟 Portal 模式的圖片檢視器 |
| 7 | Caption | Toggle Button | 點擊後在圖片下方顯示/隱藏 caption 輸入框 |

### 寬高控制（Width / Height）

- **永遠鎖定等比例** — Width 和 Height 永遠連動
- 修改 Width → Height 自動按原始比例調整，反之亦然
- 浮動工具列的 input 與圖片實際尺寸雙向同步

### 選取外框 & 拖曳縮放（Resize Handle）

- 選取 Image 時，圖片外圍顯示 **選取外框**（highlight border）
- **四角** 各有一個拖曳控制點
- 拖曳角落 → **等比例縮放**
- 縮放結果即時反映到浮動工具列的 Width / Height Input

### 尺寸限制

- **最小尺寸**：50px（寬或高不可小於 50px）
- **最大尺寸**：不超過編輯器容器寬度
- 拖曳縮放與 Width/Height Input 皆受此限制

### Caption

- **觸發方式**：浮動工具列上的 Caption 按鈕（toggle）
- 點擊按鈕 → 圖片下方出現可編輯的 caption 區域
- 再次點擊 → **直接清除** caption 內容並隱藏（不保留、不確認）
- Caption 內容為純文字或簡單 inline formatting

### Image Viewer（Portal 模式）

點擊浮動工具列的 Image Viewer 按鈕後，開啟全螢幕 portal overlay：

| 功能 | 說明 |
|------|------|
| **Zoom In / Zoom Out 按鈕** | +/- 按鈕，固定級距縮放 |
| **滑鼠滾輪縮放** | 滾輪上下控制縮放 |
| **Pinch-to-Zoom** | 觸控裝置手勢縮放 |
| **Fit-to-Screen 按鈕** | 一鍵將圖片縮放至適合螢幕大小 |
| **Zoom Percentage 顯示** | 顯示當前縮放百分比 |
| **拖曳平移** | 圖片放大超過可見範圍時，可拖曳圖片平移查看不同區域 |
| **關閉** | ESC 鍵或點擊 overlay 外部關閉 |

- **不支援多圖切換** — 每次只檢視當前一張

---

## 7. Video 節點詳細規格

### 顯示形式

- **嵌入式播放器** — 直接在編輯器內顯示影片播放器，可直接播放

### 支援格式

- **MP4** — 原生 `<video>` 標籤直接播放
- **HLS (m3u8)** — 使用 **hls.js** 播放串流格式
- MP4 → m3u8 轉換由**伺服器端**處理（透過引用者的 `onUpload` callback），Editor 只負責播放
- 轉換過程中節點顯示 `converting` 狀態（引用者透過 `onStatusChange('converting')` 通知）

### 開發測試用轉換服務

- **方案**：Node.js + fluent-ffmpeg（FFmpeg 的 Node.js wrapper）
- 建一個簡單的 Express API 接收 MP4、執行 HLS 轉換、回傳 m3u8 URL
- 作為 monorepo 中的 dev tool
- 前提：本地需安裝 FFmpeg（`brew install ffmpeg`）
- 生產環境由引用者替換為自己的轉換服務

### 浮動工具列（Block Selection Popover）

選取 Video 時，上方浮現 popover toolbar，由左至右：

| # | Item | 類型 | 說明 |
|---|------|------|------|
| 1 | Align Left | Button | 影片靠左對齊 |
| 2 | Align Center | Button | 影片置中對齊 |
| 3 | Align Right | Button | 影片靠右對齊 |
| 4 | Width Input | Number Input | 影片寬度（px） |
| 5 | Height Input | Number Input | 影片高度（px） |
| 6 | Delete | Button | 刪除影片節點 |

### 選取外框 & 拖曳縮放

- **同 Image** — 選取時顯示外框 + 四角拖曳控制點
- 拖曳角落 → 等比例縮放
- 與 Width/Height Input 雙向同步
- **永遠鎖定等比例**

### 尺寸限制

- **同 Image** — 最小 50px、最大不超過編輯器容器寬度

---

## 8. Attachment 節點詳細規格

### 顯示形式

- **行內連結** — 類似超連結的行內樣式，顯示檔案類型 icon + 檔案名稱

### 浮動工具列（Block Selection Popover）

選取 Attachment 時，上方浮現 popover toolbar：

| # | Item | 類型 | 說明 |
|---|------|------|------|
| 1 | Download | Button | 下載檔案 |
| 2 | Delete | Button | 刪除附件節點 |

### 下載 Interface

```ts
onDownload?: (
  attachment: { url: string; fileName?: string; fileSize?: number; mimeType?: string }
) => void | Promise<void>
```

- **有提供 `onDownload`**：引用者自行處理下載邏輯（如加認證、產生臨時 URL、追蹤下載）
- **未提供（預設）**：瀏覽器原生下載（`<a download>`）

---

## 9. Mermaid 節點詳細規格

### 顯示形式

- 在編輯器內顯示 **Mermaid 渲染後的圖表**

### 寬高控制（同 Image）

- **拖曳縮放** — 四角 + 四邊 resize handles
- **等比縮放** — 拖角等比縮放，拖邊自由縮放（或按 Shift 切換）
- **最小寬度** — 限制最小寬度（如 200px），最大不超過編輯區
- **縮放方式** — SVG 等比縮放（`viewBox` + `preserveAspectRatio`），不重新 render
- **效果** — 拖曳過程流暢即時，SVG 向量不失真

### 浮動工具列（Block Selection Popover）

選取 Mermaid 時，上方浮現 popover toolbar：

| # | Item | 類型 | 說明 |
|---|------|------|------|
| 1 | Edit Source | Button | 開啟 Portal 全螢幕編輯器 |
| 2 | Delete | Button | 刪除 Mermaid 節點 |

### Mermaid Editor（Portal 全螢幕模式）

點擊 Edit Source 後，開啟全螢幕 portal overlay：

- **佈局**：左右分割
  - 左側：**CodeMirror 6** 原始碼編輯器（語法高亮、行號）
  - 右側：**mermaid.js** 即時渲染預覽
- **預覽模式**：即時預覽 + debounce（輸入後約 500ms 自動更新右側渲染）
- **底部按鈕**：儲存（Save）/ 取消（Cancel）
- **關閉**：ESC 鍵或點擊 Cancel
- **錯誤處理**：Mermaid 語法錯誤時，右側顯示錯誤訊息而非空白

---

## 10. Bookmark 節點詳細規格

### 顯示形式

- **卡片樣式** — 顯示通用連結圖示（如 globe icon）+ 標題 + URL
- 不做 Open Graph 自動抓取（基於內部系統保安原則）

### 建立方式

- 從 MoreInsert dropdown 選擇 Bookmark
- 彈出輸入表單：標題、URL 兩個欄位

### 點擊行為

- 點擊卡片 → **新分頁開啟 URL**

### 浮動工具列（Block Selection Popover）

選取 Bookmark 時，上方浮現 popover toolbar：

| # | Item | 類型 | 說明 |
|---|------|------|------|
| 1 | Edit | Button | 編輯標題和 URL |
| 2 | Delete | Button | 刪除 Bookmark 節點 |

---

## 11. Landmark 節點詳細規格

### 顯示形式

- **地圖卡片** — 靜態世界地圖 + 標記 pin + 地點名稱
- 引用者可透過設定切換為**純文字模式**（僅顯示地點名稱，不渲染地圖）
- 地圖使用 **react-simple-maps**（D3-geo + TopoJSON，純前端、無外部服務依賴）

### 建立方式

- 從 MoreInsert dropdown 選擇 Landmark
- 彈出靜態世界地圖 overlay，顯示引用者預定義的所有 landmark 標記
- 點擊地圖上的 pin → 選取該 landmark → 插入節點

### Landmark 資料 Interface

引用者提供預定義的 landmark 清單：

```ts
landmark?: {
  // 預定義的 landmark 列表
  items: Array<{
    id: string
    name: string
    latitude: number
    longitude: number
  }>

  // 顯示模式（預設 'map'）
  displayMode?: 'map' | 'text'
}
```

### 浮動工具列（Block Selection Popover）

選取 Landmark 時，上方浮現 popover toolbar：

| # | Item | 類型 | 說明 |
|---|------|------|------|
| 1 | Edit | Button | 重新開啟地圖選取介面，更換 landmark |
| 2 | Delete | Button | 刪除 Landmark 節點 |

---

## 12. Code Snippet 節點詳細規格

### 顯示形式

- 功能**內嵌在 Code Snippet 區塊內**（非浮動工具列）
- 區塊頂部/右上角顯示：Language Selector + Copy 按鈕
- 程式碼區域顯示行號 + 語法高亮

### 語法高亮

- 使用 **Prism**（限定）
- **Lazy load** 策略：
  - 預設打包核心 + 基本語言（markup, css, javascript, typescript）
  - 其他語言透過 dynamic import 按需載入（`import('prismjs/components/prism-${lang}')`)
  - 已載入的語言快取在記憶體，不重複載入
  - 首次切換新語言延遲約 50-100ms，先顯示純文字，載入後自動套用高亮

### 引用者擴充 Interface

```ts
codeSnippet?: {
  // 覆寫可選語言清單
  languages?: Array<{ id: string; label: string }>

  // 註冊額外的自訂語言定義（不在 Prism 標準庫中的）
  registerLanguages?: Array<{
    id: string
    label: string
    definition: Prism.Grammar
  }>

  // 預設語言
  defaultLanguage?: string

  // 是否顯示行號（預設 true）
  showLineNumbers?: boolean
}
```

---

## 13. Table 節點詳細規格

### 觸發時機

- 點擊 Table **任意位置** 即顯示浮動工具列
- 操作針對當前所在的儲存格/行/欄

### 浮動工具列（Block Selection Popover）

選取 Table 時，上方浮現 popover toolbar，使用 **Dropdown 分組**：

| # | Item | 類型 | 內容 |
|---|------|------|------|
| 1 | Row ▾ | Dropdown | Insert Row Above, Insert Row Below, Delete Row |
| 2 | Column ▾ | Dropdown | Insert Column Left, Insert Column Right, Delete Column |
| 3 | Merge Cells | Button | 合併選取的儲存格（需先多選） |
| 4 | Split Cell | Button | 拆分已合併的儲存格 |
| 5 | Cell BG Color | Dropdown | Color Picker（儲存格背景色） |
| 6 | Cell Align | Dropdown | Align Left, Align Center, Align Right（儲存格內文字對齊） |
| 7 | Toggle Header | Toggle Button | 切換第一行是否為 header row |
| 8 | Delete Table | Button | 刪除整個表格 |

### 多選儲存格

- **拖曳選取** — 滑鼠拖曳經過的儲存格自動選取
- 選取後可進行合併、設定背景色、設定對齊等操作

### 欄寬調整

- **可拖曳欄位邊界** 來調整欄寬

### Row / Column 拖曳移動

- **觸發**：focus 在任一 Table cell 時
- **Row Drag Handle**：出現在該行的 **左側外部**
- **Column Drag Handle**：出現在該欄的 **上方外部**
- **拖曳行為**：拖動 handle 可重新排列 row 或 column 的順序
- **視覺回饋**：拖曳時顯示 **插入位置指示線** + 被拖曳的行/欄 **半透明陰影**

### Header Row

- 浮動工具列上的 Toggle Header 按鈕切換
- Header row 有特殊樣式（粗體、背景色區分）

### 巢狀 Table

- **不支援** — Table cell 中不可嵌入另一個 Table
- 參考：Notion / Google Docs / CKEditor 5 的做法

### 合併儲存格（colspan/rowspan）衝突處理

**選取行為**：
- 拖曳選取時，若選取範圍與合併儲存格部分重疊 → **自動擴展選取範圍**以完整包含所有受影響的合併儲存格

**操作衝突處理**（禁止操作 + 提示）：
- 當 move row/column、insert/delete row/column 等操作會破壞合併儲存格結構時 → **禁止執行** + 顯示 toast 提示（如「請先拆分合併儲存格」）
- 用戶需先手動拆分受影響的合併儲存格，再執行操作
- 參考：Google Docs / Excel 的主流做法

---

## 14. Table of Contents 規格

### 位置

- **側邊欄 (Sidebar)** — 固定在編輯器側邊的獨立面板

### 功能

- 根據文件中的 Heading 節點（H1-H6）自動產生巢狀目錄
- 點擊目錄項目可跳轉到對應位置（`scrollIntoView()`）
- Heading 新增/修改/刪除時即時更新（透過 Lexical mutation listener）
- **不追蹤閱讀位置** — 不隨滾動 highlight 當前可見的 Heading

### Collapsible Heading

- **所有 Heading（H1-H6）預設支援收合**
- Heading 前方有 ▶/▼ toggle 箭頭
- **箭頭顯示時機**：
  - 預設 **hover 時才顯示**
  - 已收合的 Heading **永遠顯示箭頭**（提示用戶有隱藏內容）
- **收合範圍**：從該 Heading 到下一個**同級或更高級** Heading 之間的所有內容
  - 例如：收合 H2 → 隱藏所有內容直到下一個 H2 或 H1
  - 嵌套的 H3、H4 等子標題及其內容也會被隱藏
- 收合狀態儲存在節點資料中（重新載入時保持收合/展開狀態）

### URL Hash 整合

- 每個 Heading 使用 **nanoid** 產生短 ID（如 `#h-V1StGXR8`），不使用標題文字做 slug
- 點擊 TOC 項目 → 更新 `window.location.hash`
- 頁面載入/重新整理時 → 偵測 hash → 自動滾動到對應位置
- ID 在 Heading 節點建立時產生並儲存在節點資料中，確保穩定不變

### 長標題處理

- TOC Sidebar 中長標題使用 **truncate**（CSS `text-overflow: ellipsis`），hover 顯示完整標題（tooltip）

### Layout Shift 防護

- Image 節點在 `<img>` 上預設 `width` / `height` 屬性（來自節點儲存的尺寸），即使圖片未載入也預留空間
- **安全網**：hash 滾動後監聽圖片 `load` 事件，如有偏移則重新滾動一次

### 實作方式

- 基於 Lexical 的 `TableOfContentsPlugin` 模式
- 遍歷 `$getRoot()` 篩選 HeadingNode
- 註冊 mutation listener 監聽 Heading 變動

---

## 15. Slash Command (/) 規格

### 觸發

- 在編輯器中輸入 `/` 後彈出浮動選單

### UI 行為

- **浮動選單 + 搜尋過濾**
- 輸入 `/` 後彈出選單，繼續輸入可即時過濾項目
- 上下鍵選取，Enter 確認插入
- ESC 或點擊外部關閉

### 選單項目

對應 Toolbar 所有插入項：

| 項目 | 說明 |
|------|------|
| Heading 1-6 | 插入對應層級標題 |
| Image | 插入圖片 |
| Table | 插入表格 |
| Video | 插入影片 |
| Attachment | 插入附件 |
| Action Item | 插入勾選項目 |
| Divider | 插入水平分隔線 |
| Collapsible Container | 插入可展開/收合區塊 |
| Quote | 插入引用區塊 |
| Code Snippet | 插入程式碼區塊 |
| Mermaid | 插入 Mermaid 圖表 |
| Bulleted List | 插入無序列表 |
| Numbered List | 插入有序列表 |
| Bookmark | 插入連結卡片 |
| Landmark | 插入地點標記 |

---

## 16. Mention (@) 規格

### 觸發

- 在編輯器中輸入 `@` 後彈出搜尋選單

### UI 行為

- **浮動搜尋選單**，預設顯示最近/建議的人員列表
- 輸入名字即時搜尋過濾
- 上下鍵選取，Enter 確認插入
- ESC 或點擊外部關閉

### 資料來源

- 引用者提供 **async search callback**（接收 query string，回傳結果陣列）

### 插入後顯示

- **標籤樣式** — 顯示為 `@名字` 的標籤（有背景色/底線區分）

### 點擊/Hover 行為

- **彈出人員資訊卡片**
- **固定欄位格式**：頭像、名字、部門、email
- 資料由引用者透過 search callback 回傳的資料提供

---

## 17. Page Tags

### 定位

- **頁面級元資料** — 不是 Lexical 文件內容，不儲存在 Lexical JSON 中
- 顯示在**編輯器下方**

### UI

- **Tag Chips** — 已新增的 tags 顯示為 chip/badge 樣式（可點擊 x 移除）
- **輸入框** — 自由輸入文字新增 tag（Enter 確認）
- 支援多個 tags

### Interface

```ts
// Editor Props
tags?: {
  // 當前頁面的 tags
  value: string[]

  // tag 變動時的 callback
  onChange: (tags: string[]) => void

  // 可選：預設/建議的 tags 列表（輸入時顯示為建議選項）
  suggestions?: string[]
}
```

- **有提供 `suggestions`**：輸入框 focus 或輸入時，顯示建議列表（可搜尋過濾），點擊或 Enter 選取
- **未提供 `suggestions`**：純自由輸入模式
- **兩者皆可自由輸入新 tag** — suggestions 只是建議，不限制輸入
- **資料管理完全由引用者負責** — Editor 只負責 UI 渲染和觸發 `onChange`
- Viewer 中 tags 為**唯讀顯示**（chip 樣式，無輸入框，無移除按鈕）

---

## 18. Floating Link Toolbar

### 觸發

- 游標位於超連結內時，自動顯示浮動 popover

### 顯示內容

| # | Item | 類型 | 說明 |
|---|------|------|------|
| 1 | URL 顯示 | Text | 顯示連結 URL（truncate 過長 URL） |
| 2 | Edit | Button | 開啟編輯表單（可修改 URL 和顯示文字） |
| 3 | Remove Link | Button | 移除超連結格式，保留文字 |
| 4 | Open Link | Button | 在新分頁開啟連結 |

### 行為

- 點擊 Edit → popover 切換為編輯模式（URL + Text 輸入框 + 確認/取消按鈕）
- 點擊編輯器其他位置 → popover 自動關閉
- ESC → 關閉 popover

---

## 19. Markdown 支援

### Markdown 打字快捷鍵

使用 Lexical 內建 `MarkdownShortcutPlugin`，打字時自動轉換：

| 輸入 | 自動轉換 |
|------|---------|
| `# ` + 空格 | H1 |
| `## ` ~ `###### ` | H2 ~ H6 |
| `**text**` | 粗體 |
| `*text*` | 斜體 |
| `- ` + 空格 | 無序列表 |
| `1. ` + 空格 | 有序列表 |
| `---` | 分隔線 (Divider) |
| `> ` + 空格 | 引用區塊 (Quote) |
| `` `code` `` | 行內程式碼 |
| ` ```lang ` | 程式碼區塊 (Code Snippet) |
| `- [ ]` | Action Item |

### Markdown 匯入

- 支援從 Markdown 文字匯入為 Editor 內容（`$convertFromMarkdownString`）
- 標準 Markdown / GFM 語法映射到對應節點
- 無法映射的自訂節點（Video、Attachment、Mention 等）匯入時忽略或保留為純文字
- ` ```mermaid ` 圍欄程式碼塊 → 特殊處理轉為 Mermaid 節點

### 不支援 Markdown 匯出

- 不提供 Editor → Markdown 匯出功能（避免資訊遺失問題）

---

## 20. Drag & Drop 規格

### 支援範圍

- **所有 block-level 節點** 都支援拖曳排序（Paragraph, Heading, Image, Video, Table, Attachment, Mermaid, Quote, Code Snippet, Collapsible Container, Divider, Action Item, List Item, Bookmark, Landmark）

### 觸發方式

- **Hover 顯示 Drag Handle** — hover 任一 block 時，左側出現 `⠿`（六點 grip icon）drag handle
- 必須透過 drag handle 拖曳，不可直接拖曳 block 內容
- Drag handle **只用於拖曳**，點擊不會開啟選單

### 視覺回饋

- **插入指示線**：目標位置顯示藍色插入指示線
- **半透明陰影**：被拖曳的 block 顯示半透明陰影跟隨滑鼠

---

## 21. 效能優化策略

- **不做虛擬化** — 不實作 block-level virtual windowing（複雜度極高）
- **Media Lazy Load** — Image / Video 使用 `loading="lazy"` 延遲載入
- **Debounce 更新** — TOC、Heading 收合等需要遍歷節點的操作使用 debounce
- **Memo 優化** — React 元件使用 `React.memo` 避免不必要的 re-render
- **Prism Lazy Load** — 語法高亮語言按需動態載入（已定義）
- **Mermaid Lazy Render** — Mermaid 圖表僅在可見時渲染

---

## 22. 組建方式與技術基礎設施

### Monorepo 結構

```
lexical-editor/
├── packages/
│   └── editor/              # Editor/Viewer library（核心 package）
├── apps/
│   └── demo/                # Next.js demo app（開發驗證用）
├── tools/
│   └── video-converter/     # MP4 → m3u8 轉換服務（開發用）
├── package.json
└── tsconfig.base.json
```

- **npm workspaces** — 套件管理
- **Rslib**（基於 Rspack）— Editor library 打包（ESM + CJS + CSS，支援 tree-shaking）

### Demo App

- **Next.js** — 作為開發、驗證、展示的 demo 應用
- 包含 Editor 和 Viewer 的使用範例
- `'use client'` 標記確保 Lexical 在 client-side 執行

### 測試策略

- **Unit Tests**（Vitest）— Node classes、serialization/deserialization、utility functions、狀態機
- **E2E Tests**（Playwright）— 完整使用者流程（插入、格式化、拖曳、快捷鍵等）
- 重點測試場景：
  - 各 node type 序列化 / 反序列化一致性
  - Undo / Redo 正確性
  - Table 合併/拆分/選取/移動
  - Markdown shortcuts 轉換
  - Media 上傳狀態機流程
  - Editor ↔ Viewer 資料相容性

### 技術考量

- **SSR 相容** — Editor/Viewer 元件需 `'use client'` 或 dynamic import（`next/dynamic` + `ssr: false`）
- **CSS 策略** — Tailwind CSS 使用 prefix 避免與消費端衝突，library 輸出獨立 CSS 檔
- **Serialization 版本控制** — Lexical JSON 加上 version 欄位，支援未來 migration
- **Error Boundary** — Media 節點（Image / Video / Mermaid）包裹 React Error Boundary
- **Accessibility** — 鍵盤導航、ARIA 屬性、螢幕閱讀器支援

---

## 23. Viewer 元件規格

### 定位

- Editor 的**唯讀版本** — 使用相同的 Lexical 序列化資料（JSON）渲染內容
- **不載入任何編輯功能**：無 Toolbar、Slash Command、Mention 觸發、Drag Handle、浮動工具列、Resize Handle 等
- Lexical 以 `editable={false}` 模式初始化

---

### Editor → Viewer 功能對照表

以下系統性列出 Editor 的每項功能在 Viewer 中的對應行為：

#### Toolbar 與編輯操作

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **Toolbar**（所有按鈕） | ❌ 不載入 |
| **Undo / Redo** | ❌ 不載入 |
| **Heading Dropdown** | ❌ 不載入（Heading 節點正常渲染） |
| **Bold / Italic / MoreFormat** | ❌ 不載入（已套用的格式正常顯示） |
| **Text Color / BG Color Picker** | ❌ 不載入（已套用的顏色正常顯示） |
| **Text Align** | ❌ 不載入（已套用的對齊正常顯示） |
| **List Item Dropdown** | ❌ 不載入（列表正常渲染） |
| **Outdent / Indent** | ❌ 不載入（已套用的縮排正常顯示） |

#### 節點渲染

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **Paragraph** | ✅ 原樣渲染 |
| **Heading (H1-H6)** | ✅ 原樣渲染 + 收合功能保留（見下方） |
| **Quote** | ✅ 原樣渲染 |
| **Bulleted / Numbered List** | ✅ 原樣渲染 |
| **Action Item** | ✅ 顯示勾選狀態，**唯讀 checkbox**（不可切換） |
| **Divider** | ✅ 原樣渲染水平分隔線 |
| **Collapsible Container** | ✅ 可展開/收合（**保留互動**） |
| **Inline formatting** | ✅ Bold、Italic、Underline、Strikethrough、Inline Code、Superscript、Subscript、Text Color、Text BG Color 全部保留渲染 |

#### Image

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **Image 渲染** | ✅ 顯示圖片，保留 width/height/alignment |
| **Caption** | ✅ 顯示 caption 文字（唯讀） |
| **Image Viewer (lightbox)** | ✅ **點擊圖片直接開啟 lightbox**（無需先選取，因為 Viewer 無選取機制） |
| **Lightbox 功能** | ✅ 同 Editor：Zoom In/Out、滾輪縮放、Pinch-to-Zoom、Fit-to-Screen、Zoom %、拖曳平移、ESC 關閉 |
| **浮動工具列** | ❌ 不載入（無 Align、Width/Height Input、Caption toggle） |
| **選取外框 + Resize Handle** | ❌ 不載入 |
| **Layout Shift 防護** | ✅ `<img>` 預設 width/height 屬性（同 Editor） |

#### Video

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **Video 播放** | ✅ 嵌入式播放器，可直接播放 |
| **MP4 / HLS (m3u8)** | ✅ 同 Editor，MP4 原生播放 + HLS 使用 hls.js |
| **浮動工具列** | ❌ 不載入（無 Align、Width/Height、Delete） |
| **選取外框 + Resize Handle** | ❌ 不載入 |

#### Attachment

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **Attachment 顯示** | ✅ 行內連結樣式（檔案類型 icon + 檔案名稱） |
| **點擊下載** | ✅ 點擊觸發下載（透過 `onDownload` 或瀏覽器原生下載） |
| **浮動工具列** | ❌ 不載入（無 Delete 按鈕） |

#### Table

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **Table 渲染** | ✅ 原樣渲染，保留 Header Row 樣式、合併儲存格、儲存格背景色、文字對齊 |
| **浮動工具列** | ❌ 不載入（無 Row/Column/Merge/Split 等操作） |
| **儲存格編輯** | ❌ 不可編輯 |
| **欄寬調整** | ❌ 不可拖曳 |
| **Row/Column 拖曳移動** | ❌ 不載入 |
| **多選儲存格** | ❌ 不載入 |

#### Code Snippet

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **語法高亮** | ✅ Prism 高亮（同 Editor，含 lazy load） |
| **行號** | ✅ 保留顯示 |
| **Copy 按鈕** | ✅ **保留**（讀者可複製程式碼） |
| **Language Selector** | ❌ 不可切換（顯示目前語言名稱但不可互動） |

#### Mermaid

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **Mermaid 圖表渲染** | ✅ 使用 mermaid.js 渲染圖表 |
| **浮動工具列** | ❌ 不載入（無 Edit Source、Delete） |
| **Mermaid Editor (Portal)** | ❌ 不載入 |

#### Bookmark

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **卡片渲染** | ✅ 顯示 globe icon + 標題 + URL |
| **點擊行為** | ✅ 點擊新分頁開啟 URL |
| **浮動工具列** | ❌ 不載入（無 Edit、Delete） |

#### Landmark

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **地圖/文字卡片渲染** | ✅ 依 `displayMode` 設定渲染（同 Editor） |
| **浮動工具列** | ❌ 不載入（無 Edit、Delete） |

#### Mention

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **@名字 標籤渲染** | ✅ 顯示為有背景色的標籤 |
| **Hover 人員卡片** | ✅ 顯示頭像、名字、部門、email（透過 `onMentionHover`） |
| **@ 觸發搜尋選單** | ❌ 不載入 |

#### Link

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **超連結渲染** | ✅ 可點擊，新分頁開啟 |
| **Floating Link Toolbar** | ❌ 不載入（無 URL 預覽、編輯/移除按鈕） |
| **Create Link 功能** | ❌ 不載入 |

#### Heading 收合

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **收合/展開** | ✅ 讀者可展開/收合 Heading |
| **箭頭顯示** | ✅ 同 Editor：hover 時顯示，已收合永遠顯示 |
| **初始狀態** | ✅ 來自 Editor 儲存的節點資料 |
| **收合範圍** | ✅ 同 Editor：到下一個同級或更高級 Heading |

#### Table of Contents

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **TOC Sidebar** | ✅ 保留（可透過 `showTableOfContents` 關閉） |
| **點擊跳轉** | ✅ `scrollIntoView()` |
| **URL Hash 整合** | ✅ nanoid hash、頁面載入自動滾動 |
| **長標題處理** | ✅ truncate + tooltip |
| **Layout Shift 防護** | ✅ 同 Editor |

#### Page Tags

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **Tags 顯示** | ✅ 唯讀 chip 樣式，顯示在內容下方 |
| **Tags 新增/移除** | ❌ 不可互動（無輸入框、無 x 移除按鈕） |

#### 其他 Editor 功能

| Editor 功能 | Viewer 行為 |
|------------|------------|
| **Slash Command (/)** | ❌ 不載入 |
| **Markdown 打字快捷鍵** | ❌ 不載入 |
| **Markdown 匯入** | ❌ 不載入 |
| **Drag & Drop** | ❌ 不載入（無 Drag Handle） |
| **Link to Page** | ❌ 不載入 |
| **上傳功能 (onUpload)** | ❌ 不載入（Viewer 不產生新內容） |

---

### Viewer 效能優化

- **同 Editor** — Media Lazy Load、Debounce 更新、React.memo、Prism Lazy Load、Mermaid Lazy Render
- **更輕量** — Viewer 不載入 Toolbar、Plugin、Slash Command 等模組，bundle size 更小

---

### 幻燈片模式 (Presentation Mode)

#### 觸發

- Viewer 提供一個按鈕或 API 進入全螢幕幻燈片模式（Portal overlay）

#### 兩種模式

| 模式 | 說明 |
|------|------|
| **分頁模式 (Slide)** | 依 H1 / H2 分割為多頁，每頁顯示該 Heading 及其下方內容直到下一個 H1/H2 |
| **捲動模式 (Scroll)** | 整份文件在全螢幕中垂直捲動瀏覽，不分頁 |

#### 分頁邏輯

- **分割點**：每個 H1 或 H2 Heading 作為一頁幻燈片的起始
- H1/H2 之前的內容（如開頭沒有 Heading 的段落）→ 作為**第一頁**
- 每頁包含：該 H1/H2 + 其下所有內容，直到下一個 H1/H2
- 頁面內的 H3-H6 及其內容屬於當前頁（不分割）

#### 控制功能

| 功能 | 說明 |
|------|------|
| **上一頁 / 下一頁** | 按鈕 + 左右鍵切換（分頁模式） |
| **頁碼顯示** | 顯示「第 N / M 頁」（分頁模式） |
| **模式切換** | 分頁 ↔ 捲動模式切換按鈕 |
| **雷射筆** | Toggle 按鈕開啟/關閉。開啟時滑鼠游標替換為紅色圓點（帶發光效果），跟隨滑鼠移動，用於指示內容位置 |
| **ESC 關閉** | 按 ESC 或點擊關閉按鈕退出幻燈片模式 |

#### 內容渲染

- 幻燈片中的節點渲染**同 Viewer**（唯讀、Image 可點擊開 lightbox、Video 可播放等）
- 每頁內容置中顯示，適當 padding

---

### Viewer Interface

```ts
interface ViewerProps {
  // 必要：Lexical 序列化 JSON 資料
  initialEditorState: SerializedEditorState

  // 可選：URL 裝飾（同 Editor）
  decorateUrl?: (
    url: string,
    type: 'image' | 'video' | 'attachment'
  ) => string | Promise<string>

  // 可選：Attachment 下載處理（同 Editor）
  onDownload?: (
    attachment: { url: string; fileName?: string; fileSize?: number; mimeType?: string }
  ) => void | Promise<void>

  // 可選：Mention hover 資料查詢
  onMentionHover?: (
    mentionId: string
  ) => Promise<{
    avatar?: string
    name: string
    department?: string
    email?: string
  }>

  // 可選：Bookmark 點擊處理（預設新分頁開啟 URL）
  onBookmarkClick?: (url: string) => void

  // 可選：自訂主題樣式
  theme?: Partial<EditorTheme>

  // 可選：i18n 翻譯資源
  i18nResources?: Record<string, Record<string, string>>

  // 可選：Code Snippet 設定（同 Editor）
  codeSnippet?: {
    languages?: Array<{ id: string; label: string }>
    registerLanguages?: Array<{
      id: string
      label: string
      definition: Prism.Grammar
    }>
    showLineNumbers?: boolean
  }

  // 可選：Landmark 設定（同 Editor）
  landmark?: {
    items: Array<{
      id: string
      name: string
      latitude: number
      longitude: number
    }>
    displayMode?: 'map' | 'text'
  }

  // 可選：Page Tags（唯讀顯示）
  tags?: string[]

  // 可選：是否顯示 TOC sidebar（預設 true）
  showTableOfContents?: boolean

  // 可選：是否啟用幻燈片模式按鈕（預設 true）
  showPresentationButton?: boolean
}
```

---

### 架構關係

- **共用節點定義** — Editor 和 Viewer 使用相同的 custom node classes（ImageNode、VideoNode 等）
- **Node 渲染分離** — 每個 node 有 `EditorComponent` 和 `ViewerComponent` 兩套 decorator component
  - Editor 版本包含選取、浮動工具列、resize 等互動
  - Viewer 版本為精簡的唯讀渲染
- **共用基礎設施** — Theme、i18n、decorateUrl 等機制共用
- **獨立入口** — `import { Editor } from 'lexical-editor'` / `import { Viewer } from 'lexical-editor'`
- **Tree-shakable** — 只引用 Viewer 時不應打包 Editor 的 Toolbar、Plugin 等程式碼

---

## 24. Copy-Paste 規格（Image / Video / Attachment）

### Editor 內部 copy-paste（複製已有節點）

- Lexical 序列化節點 JSON（URL + 所有 metadata），貼上時反序列化為新節點
- **不觸發 `onUpload`** — 媒體已有 URL，直接引用相同 URL
- data URL 來源亦直接複製

### 從外部貼上圖片（剪貼簿 binary，如截圖）

- 偵測剪貼簿中的圖片 File/Blob
- **有 `onUpload`** → 呼叫 `onUpload(file, 'image', statusCallback)`，走完整上傳狀態機流程
- **無 `onUpload`** → 轉為 data URL 插入
- 與 Toolbar「插入圖片」走相同流程

### 從外部貼上含圖片的 HTML（如從網頁複製）

- 解析 HTML 中的 `<img src>` 外部圖片 URL
- **下載圖片** → 轉為 File → 走 `onUpload` 流程（或預設轉 data URL）
- 若 fetch 失敗（CORS 限制等）→ 節點進入 `error` 狀態，顯示錯誤訊息 + 重試按鈕
- Video / Attachment 不適用此場景（外部 HTML 中缺少對應語意，忽略或保留為純文字/連結）

---

## 25. Emoji Picker 規格

### 觸發方式

- 在編輯器中輸入 `:` 後彈出浮動搜尋選單
- 繼續輸入文字即時搜尋過濾（如 `:smile` → 笑臉相關 emoji）
- 上下鍵選取，Enter 確認插入
- ESC 或點擊外部關閉

### 觸發字元保留規則（同 Notion）

- 選擇 emoji → `:` + 搜尋文字被替換為 emoji
- 按 ESC / 點擊外部 / 輸入空格 → picker 關閉，`:` 保留為普通文字
- 搜尋無匹配結果 → picker 自動關閉，`:` + 文字保留為普通文字
- 與 Slash Command `/` 和 Mention `@` 行為模式一致

### Emoji 資料來源

- **自建精簡資料**：收錄常用 ~500 個 emoji（含名稱、關鍵字、分類）
- 使用系統原生 Unicode emoji，不需自訂圖片

### 插入後

- emoji 為普通 Unicode 文字字元，直接插入 TextNode
- 不需要特殊節點類型

### 入口

- 僅透過 `:` 觸發，不在 Toolbar 或 Slash Command 中提供額外入口

---

## 26. React Best Practices（基於 Vercel React Best Practices）

> 來源：[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)，64 條規則，以下為與本專案相關的規則。

### Bundle Size（CRITICAL）

| 規則 | 說明 |
|------|------|
| **bundle-barrel-imports** | 避免 barrel file（`index.ts` re-export），直接從模組路徑 import。`lucide-react` 特別注意 |
| **bundle-dynamic-imports** | Mermaid Editor、CodeMirror、react-simple-maps 等重型模組使用 `lazy()` / dynamic import |
| **bundle-defer-third-party** | Prism、mermaid.js 等第三方在 hydration 後才載入 |
| **bundle-conditional** | 只在功能啟用時才載入模組（如 Landmark 地圖、Presentation mode） |

### Re-render Optimization（MEDIUM）

| 規則 | 說明 |
|------|------|
| **rerender-no-inline-components** | 不在 parent 內定義 child component（Lexical decorator components 注意） |
| **rerender-memo** | 複雜節點渲染（Image、Video、Table）使用 `React.memo` |
| **rerender-memo-with-default-value** | 非 primitive default props 提升到 component 外部 |
| **rerender-lazy-state-init** | `useState` 使用 callback 初始化昂貴計算 |
| **rerender-derived-state-no-effect** | 衍生狀態在 render 時計算，不用 useEffect |
| **rerender-functional-setstate** | 使用 functional setState 避免 stale closure |
| **rerender-use-ref-transient-values** | 頻繁變動值（drag position、resize）存在 ref |
| **rerender-defer-reads** | 只在 event callback 中讀取的 state 不要訂閱 |
| **rerender-transitions** | 非緊急更新用 `startTransition`（TOC 高亮、搜尋過濾） |

### Rendering Performance（MEDIUM）

| 規則 | 說明 |
|------|------|
| **rendering-content-visibility** | 長文件離螢幕區塊使用 `content-visibility: auto` |
| **rendering-hoist-jsx** | 靜態 JSX 提升到 component function 外部 |
| **rendering-conditional-render** | 使用三元運算子取代 `&&` 條件渲染 |

### JavaScript Performance（LOW-MEDIUM）

| 規則 | 說明 |
|------|------|
| **js-batch-dom-css** | CSS 修改用 class 或 `cssText` 批次處理，避免 layout thrashing |
| **js-set-map-lookups** | 大量查找用 Set/Map（Mention 搜尋、Slash Command 過濾） |
| **js-early-exit** | 函式提前 return 避免不必要計算 |

### Async / Waterfalls（CRITICAL）

| 規則 | 說明 |
|------|------|
| **async-parallel** | 多個 `decorateUrl` 呼叫應用 `Promise.all()` 並行 |
| **async-defer-await** | `await` 移到真正需要結果的分支 |

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.1 | 2026-03-21 | 新增 Copy-Paste 規格、Emoji Picker、Mermaid 寬高控制、React Best Practices |
| 1.0 | 2026-03-12 | Initial PRD — Editor/Viewer 完整規格 |
