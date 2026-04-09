# TACTIC MONITOR V2 — Vercel 部署指南

## 1. 在 Vercel 連結 GitHub
前往 Vercel Dashboard → Add Project → 選擇 `cloudstar-crypto/tactic-monitor-v2`

## 2. 設定部署
- **Root Directory**: `frontend`
- **Framework Preset**: Vite（自動偵測）
- **Build Command**: `vite build`（已由 `vercel.json` 指定）
- **Output Directory**: `dist`（已由 `vercel.json` 指定）
- **Install Command**: `npm install`（預設）

## 3. Google Service Account 前置作業

在設定環境變數之前,需要先建立 Service Account:

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立或選擇一個 Project
3. 啟用 **Google Sheets API**:APIs & Services → Library → 搜尋「Google Sheets API」→ Enable
4. 建立 Service Account:IAM & Admin → Service Accounts → Create Service Account
5. 建立 JSON 金鑰:選擇剛建立的 Service Account → Keys → Add Key → Create new key → JSON
6. 下載的 JSON 檔案內含 `client_email` 與 `private_key` 兩個欄位,等下會用到
7. **重要**:把目標 Google Sheet 分享給 Service Account 的 email(Viewer 權限即可),否則 API 會回 403

## 4. 環境變數

在 Vercel Dashboard → Project Settings → Environment Variables 設定以下四個變數,建議 scope 選擇 **Production + Preview + Development**:

| 變數名稱 | 說明 | 取得方式 |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service Account 的 email | JSON 檔案中的 `client_email` 欄位 |
| `GOOGLE_PRIVATE_KEY` | Service Account 的私鑰 | JSON 檔案中的 `private_key` 欄位 |
| `GOOGLE_SHEET_ID` | 目標 Google Sheet 的 ID | Sheet URL `https://docs.google.com/spreadsheets/d/{這一段}/edit` |
| `ADMIN_PASSWORD` | 前端登入密碼 | 自訂字串,用於 `/api/authenticate` |

### ⚠️ `GOOGLE_PRIVATE_KEY` 格式(最容易踩雷)

私鑰包含多行文字,Vercel 環境變數有兩種填法:

**方式 A(推薦):貼上完整多行內容**
- 直接把 JSON 裡 `private_key` 欄位的值(包含 `-----BEGIN PRIVATE KEY-----` 到 `-----END PRIVATE KEY-----`)完整貼入
- Vercel 介面支援多行輸入,換行會被保留

**方式 B:使用字面 `\n`(兩個字元)**
- 如果環境只支援單行,把所有換行替換成字面 `\n`
- 程式碼 `frontend/api/_lib/googleSheets.js:14` 會自動用 `.replace(/\\n/g, '\n')` 還原

**兩種方式都可以**,但**不要**同時混用,也不要在前後加雙引號包起來。

### 常見錯誤
- ❌ 只貼 BEGIN/END 中間的 base64 → 缺頭尾無法解析
- ❌ 前後加了 `"..."` 雙引號 → 會變成字串字面值
- ❌ 使用方式 B 但只換了部分 `\n` → 格式錯誤
- ❌ Sheet 沒分享給 Service Account email → 403 Permission denied

## 5. Deploy

設定完成後,觸發 Deploy。首次部署後:

- 前往 `https://{your-project}.vercel.app/api/health` 驗證 API 運作
- 前往根路徑驗證前端與 Google Sheets 整合

## 6. 除錯

- Vercel → Deployments → 點擊該次部署 → Functions → 查看 runtime logs
- 常見錯誤訊息對照:
  - `Missing Google Sheets credentials` → 環境變數未設定
  - `Google Sheets metadata error` → Sheet ID 錯誤或 Service Account 沒權限
  - `Server misconfigured`(401) → `ADMIN_PASSWORD` 未設定
