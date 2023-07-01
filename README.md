# Google Maps Platform WebGL Codelab

This repo contains the project template and finished code for the Google Maps Platform WebGL codelab.

參考來源：https://developers.google.com/codelabs/maps-platform/webgl?hl=zh-tw

## Getting Started
1. 在  Google Cloud Console 的「憑證」頁面中產生 API 金鑰，並將 /server/.env-example 改為 .env，其中 Your_API_Key 修改成剛申請的 API 金鑰

參考步驟：https://www.youtube.com/watch?v=n1UorU1PALk

2. 執行 npm install，這會安裝 package.json 中列出的所有必要依附元件。若執行仍有其他模組未安裝，請自行安裝。
3. 在目錄先執行 node server/server.js，這會在 http://localhost:8080 執行 server 端。網址輸入 http://localhost:8080/api/key 可確認 Api Key 是否被 server 端正確傳輸
4. 再另開一個 Terminal 執行 npm start，這會在 http://localhost:8081 執行 client 端。client 端出現以下畫面就算成功：
![螢幕擷取畫面 (1310)](https://github.com/JOE-CHOU88/MIS-Final-Project-Webgl-Three/assets/62171839/d744a144-85b1-41ec-a64e-f771a393ac25)
5. 以上操作需在有網路連線的狀況下執行

## 如何使用路線規劃功能
### 方法一
1. 在左上角輸入框輸入關鍵字，輸入過程會同時跳出推薦地標名（目前推薦地標名限縮在台灣，若要拉至國外之後可再行調整）
2. 點擊適合地標名，再按 Search
3. 點擊 Plan Route 按鈕，畫面應自動跳出路線規劃圖
### 方法二
1. 在地圖上任選一地標
2. 點擊 Plan Route 按鈕，畫面應自動跳出路線規劃圖