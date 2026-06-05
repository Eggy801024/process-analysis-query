# process-analysis-query

製程異常分析查詢網站。

## 功能

- 依線別、日期、班別、模組等級、MES 降規原因查詢
- 降規原因選項來自 MES 異常代碼資料
- 查詢結果顯示 `database.xlsx` 內對應的所有異常分析
- 英文 MES 名稱比對不分大小寫

## 資料來源

- `Database`：從 Google Sheets 即時讀取
- `MES_REASONS`：由 `MES_異常代碼_依照片順序_新版.xlsx` 匯出到 `data.js`

網站是純前端靜態頁，可直接用 GitHub Pages 發佈。
