# process-analysis-query

製程異常分析查詢網站。

## 資料來源

網站會直接讀取 Google Sheets：

- `Database`
- `MES_Cold`

Google Sheets ID：

```text
1uxlACZ3sXNZoTaZjEmixYCosIj-aGViXF5pJ_Z3Z2QM
```

## 登入帳號

- `P1339 / P1339`
- `P0949 / P0949`

## 欄位建議

`MES_Cold`

```text
異常代碼, 中文名稱, 英文名稱, 分類, 站點, 備註
```

`Database`

```text
日期, 線別, 班別, 模組等級, 降規原因, 模組序號, 現象描述, 異常root cause, 異常分析
```
