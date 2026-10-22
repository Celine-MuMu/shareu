# 設計文件

> 狀態：✅ v1.2 已確認（2026-10-22：押金打折規則）

---

## 1. 整體架構

```
瀏覽器（手機或電腦）
 ├── 畫面：HTML + CSS
 ├── 邏輯：JavaScript
 └── 資料：data.js（假資料）→ 第一次打開時複製到 localStorage → 之後都讀寫 localStorage
```

- **沒有伺服器、沒有資料庫**：直接用瀏覽器打開，或之後放到 GitHub Pages
- **單頁網站**：用網址的 `#` 切換頁面（例如 `#/item/12`），不需要後端

## 2. 檔案結構（預計）

```
shareu/
├── index.html      畫面骨架（頂部導覽列＋內容區）
├── style.css       外觀（ShareU 紫色系）
├── icons.js        線條 icon（從 Lucide 複製，不用連網路）
├── app.js          切換頁面、目前登入的人
├── data.js         假資料：使用者、物品、取件點、訂單、評價  ← 很適合你來寫
├── store.js        存取資料（之後換資料庫只改這裡）
├── i18n.js         中英文字對照表＋切換語言
├── ui.js           共用小零件：物品卡片、評分、標籤、價格
├── pages/
│   ├── home.js       首頁＋三大場景
│   ├── browse.js     列表＋搜尋＋篩選
│   ├── item.js       物品詳細頁＋租借表單
│   ├── list-item.js  上架表單
│   ├── me.js         我的租借／我的上架／評價
│   ├── login.js      學校信箱認證（模擬）＋快速切換身分
│   ├── rent.js       租借表單＋預約成功頁
│   └── about.js      關於我們＋贊助（團隊成員寫在最上面的 TEAM）
├── img/            物品照片
└── docs/           規格文件
```

## 3. 頁面

| 網址 | 頁面 | 對應需求 |
|---|---|---|
| `#/` | 首頁 | R1 |
| `#/browse?scene=concert&tags=beginner&price=50-150&pickup=p1` | 物品列表＋搜尋＋篩選（條件會寫在網址上，重新整理不會不見） | R2 |
| `#/item/:id` | 物品詳細＋租借 | R3、R4 |
| `#/login?next=rent/i1` | 學校信箱認證＋快速切換身分（登入後跳回 next） | R5、R9 |
| `#/rent/:id` | 租借表單：日期、取件點、損壞保障、費用明細、模擬付款 | R4 |
| `#/order/:id` | 預約成功：取件碼、取件資訊 | R4 |
| `#/new` | 上架物品（可上傳照片，縮成 800px 存在瀏覽器） | R6 |
| `#/me?tab=listings` | 我的租借／我的上架（分頁）、訂單「下一步」、雙向評價、我收到的評價 | R7、R8 |
| `#/about` | 關於我們（使命、問題、安心機制、團隊）＋贊助（選金額、模擬付款、感謝畫面） | R12 |

## 4. 資料長相

```js
user   = { id, name, dept, email, verified, rating, avatar }
item   = { id, ownerId, title: {zh, en}, category, scene, desc: {zh, en}, pricePerDay, deposit,
           pickupPoints: [], tags: [], photo, photoData, official, minRenterRating }
         // photoData：上架時上傳的照片（縮小後的圖片資料）
tag    = { id, name: {zh, en} }   // beginner 新手友善、accessories 附配件、long-term 可長租、
                                   // tutorial 可教學、near-dorm 近宿舍、official ShareU 官方
order  = { id, itemId, renterId, start, end, pickupPoint, protection,
           rent, serviceFee, protectionFee, deposit, pickupCode, status, createdAt }
         // status: pending / active / returned；deposit 是打折後實際收的押金；pickupCode 是 6 位數置物櫃取件碼
donation = { id, amount, name, message, createdAt }   // 贊助（模擬）
review = { id, orderId, fromId, toId, stars, text: {zh, en} }   // 新增評價時會更新 toId 那個人的 rating、reviewCount
pickupPoint = { id, name }   // 例如：政大中正圖書館置物櫃、學生會辦公室
```

## 5. 外觀

- 配色（2026-10-22 定案，中間試過紫色、高級藍＋香檳金、Color Hunt 淺色版、調亮的深色版）：
  - **深色底** 靛藍黑 `#0E1424`（科技感）
  - **卡片、選項是半透明灰白**（毛玻璃）：白色 7% 透明度＋細白框，看得到後面一點點底
  - **按鈕** 靛藍 `#5873C4`（從 Color Hunt 色票的 `#425B9A` 調亮）
  - **點綴用高級的紅藍金**：寶石紅 `#E06C78`（演唱會）、藍寶石 `#7FA3EC`（出國交換、連結、小圓點）、香檳金 `#D4AF6A`（課業作品、「ShareU 官方」標籤）
  - 價格用象牙白 `#F5F1E6`，不用金色，才不會跟課業的金色混在一起
  - Logo 是藍寶石到香檳金的漸層字；卡片滑過去會發藍光
  - 底部導覽、手機篩選面板、付款視窗不能透明，用實色 `#172038`
  - 改深色之前的淺色版本備份在 `docs/style-light-backup.css`
- **首頁輪播大圖**（`pages/home.js` 的 `HERO_SLIDES`）：
  - 三張 Unsplash 免費圖（演唱會舉手機拍、機場拉行李、拍片現場），每 4 秒往左滑到下一張，圖片同時慢慢放大
  - 標語「Share with U」和搜尋框疊在圖上不動；下面小圓點可以點，手機可以左右滑；點圖進該場景
  - 系統設定「減少動態效果」的人不會自動換圖；沒網路時顯示場景色
  - 想換照片：放進 `img/`，改 `HERO_SLIDES` 的 `image`
- 顏色都寫在 `style.css` 最上面的 `:root`（`--primary`、`--accent`、`--cream`、`--point`、`--concert`…），想換色只改那裡
- 字體：Noto Sans TC
- Icon：Lucide（線條 icon），存在 `icons.js`
- 手機：底部導覽列；電腦：頂部導覽列

## 6. 找東西頁的篩選（R2）

```
手機                         電腦
┌──────────────────┐        ┌────────────┬──────────────────────┐
│ [搜尋框        ] │        │ 場景        │ [搜尋框            ] │
│ [篩選 (2)] [排序]│        │ 標籤        │ 找到 8 個  [排序 ▾]  │
│ 找到 8 個        │        │ 取件點      │ ┌────┐┌────┐┌────┐   │
│ ┌──────────────┐ │        │ 價格 [不限▾]│ │物品││物品││物品│   │
│ │ 物品卡片      │ │        │ [清除篩選]  │ └────┘└────┘└────┘   │
└──────────────────┘        └────────────┴──────────────────────┘
```

- 所有條件是「而且」：例如場景＝演唱會 **而且** 標籤有「附配件」**而且** 價格在 150–300
- 同一種條件裡是「或」：例如勾了兩個取件點，在其中任一個都算
- 價格範圍是下拉選單：不限／50 以下／50–150／150–300／300 以上（每日租金，NT$）

## 7. 中英切換

- 畫面上的固定文字都寫在 `i18n.js`：`{ zh: {...}, en: {...} }`，程式用 `t('rent_now')` 取字
- 物品的名稱、說明在 `data.js` 裡直接寫兩種語言
- 選的語言存在 localStorage，下次打開還是同一種

## 8. 計價規則

- 租金 = 每日租金 × 天數
- 損壞保障 = 租金 × 10%（最低 NT$30），可選
- 天數 = 歸還日 − 取件日（週五取、週日還 = 2 天）。日期不能和還沒歸還的訂單重疊；還東西那天，下一個人可以來拿
- 物主設定「只租給評分 N 分以上」時，評分不夠（或新用戶）的人看不到租借表單
- 押金：歸還後退回。物品上寫的是「原本押金」，實際押金照下面打折：
  - 租客評分 4.5 以上 → × 0.5
  - 有加購損壞保障 → 再 × 0.5
  - 例：S25 Ultra 原本押金 NT$2,000，Mia（4.9 分）加購保障 → 2,000 × 0.5 × 0.5 = NT$500
  - 原本押金 NT$0 的物品顯示「免押金」
- 服務費 5%：租客付（租金 × 5%）
- 平台抽成 10%：從物主收入扣（物主實拿 = 租金 × 90%）
- 租客總付 = 租金＋服務費＋損壞保障（若勾選）＋押金
