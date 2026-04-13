# TACTIC MONITOR V2 — FAE 工程師進度監控系統

## 專案概述
透過讀取 Google Sheets，即時監控 FAE 工程師的工作進度。
整體 UI 為現代軍事風格，綠色基調，簡潔可視化介面，部署於 Vercel。

## 技術架構
- 前端：React + Vite
- 後端：Node.js Serverless Functions
- 資料來源：Google Sheets API v4

## Layer 2 MAIN(CAR) Alert 規則
- **日期來源**：`Last Update` 欄位前 8 碼（YYYYMMDD 格式）
- **Status 過濾**：僅 `Open`、`In Progress`、`Pending` 進入天數檢查，其餘 status 一律 NORMAL
- **等級判定**（純看工作天，排除六日）：
  - `CRITICAL`：>= 5 個工作天未更新
  - `WARNING`：>= 3 個工作天未更新
  - `NORMAL`：< 3 個工作天
- 前後端邏輯需保持一致：
  - 前端：`frontend/src/utils/alertRules.js`
  - 後端：`frontend/api/_lib/googleSheets.js`
