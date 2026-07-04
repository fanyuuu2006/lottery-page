# 🎲 臺科桌遊社抽獎系統

一個臺灣科技大學桌上遊戲研究社製作的線上抽獎工具，解決傳統抽獎輪盤重複抽取、有限制名單人數等問題。

🔗 **線上網址：** [https://bgc-lottery.vercel.app/](https://bgc-lottery.vercel.app/)

---

## 📖 Overview

「臺科桌遊社抽獎系統」是一個為臺灣科技大學桌上遊戲研究社社團活動打造的網頁抽獎工具。

在社課或活動中進行抽獎時，常見的線上抽獎輪盤工具容易發生「重複抽到同一人」或「有限制名單人數」的狀況，導致抽獎流程不公平或需要人工介入排除已中獎者。本專案的建立目的，就是為了提供一個簡單、直接、可控制抽獎邏輯的網頁工具，讓社團幹部能夠更順暢地進行抽獎活動。

此工具適合以下使用情境：

- 社團活動、社課的獎品抽獎
- 需要避免重複中獎的抽獎場合
- 無名單人數上限

核心設計理念是「簡單好用、邏輯正確」：不需要複雜的操作介面，也不需要額外安裝任何程式，只要開啟網頁即可使用，並確保抽獎結果符合預期（不重複、可限制人數）。

---

## 🚀 Demo

Demo Website

<https://bgc-lottery.vercel.app/>

---

## ✨ Features

- ✅ 抽獎不重複：已中獎名單不會再次被抽出
- ✅ 介面簡潔：開啟即可使用，無需額外操作說明
- ✅ 純前端運作：不需伺服器或資料庫，開啟網頁即可抽獎
- ✅ 輕量快速：純 HTML / CSS / JavaScript 打造，載入快速
- ✅ 響應式設計：可依裝置螢幕大小自動調整版面

---

## 🛠️ Tech Stack

| Category | Technology |
| -------- | ---------- |
| Language | HTML       |
| Style    | CSS        |
| Script   | JavaScript |
| Hosting  | Vercel     |

---

## 📁 Project Structure

```text
lottery-page/
│
├── index.html
├── css/
├── js/
├── assets/
│   └── images/
├── README.md
└── LICENSE
```

| Folder / File     | Description         |
| ------------------| --------------------|
| `index.html`      | 網站主頁面          |
| `css/`            | 樣式表              |
| `js/`             | 抽獎邏輯與互動程式碼|
| `assets/images/`  | 圖片與圖示等靜態資源|
| `README.md`       | 專案說明文件        |
| `LICENSE`         | 授權條款            |

---

## 📦 Installation

本專案為純 HTML / CSS / JavaScript 網頁，不需要安裝任何套件或建置工具。

```bash
git clone https://github.com/fanyuuu2006/lottery-page.git
```

```bash
cd lottery-page
```

下載完成後，直接以瀏覽器開啟 `index.html` 即可使用，或參考下方「線上體驗」直接使用部署版本：

👉 <https://bgc-lottery.vercel.app/>

---

## 📘 Usage

1. 開啟 [線上網址](https://bgc-lottery.vercel.app/) 或本機開啟 `index.html`
2. 依畫面指示輸入 / 匯入抽獎名單
3. 設定抽獎人數（依活動需求）
4. 開始抽獎，系統會自動避免重複抽取已中獎者
5. 抽獎結束後即可查看中獎名單

---

## 🌐 Browser Support

| Browser | Support |
| ------- | ------- |
| Chrome  | ✅      |
| Edge    | ✅      |
| Firefox | ✅      |
| Safari  | ✅      |

---

## 📱 Responsive Design

本專案支援以下裝置：

- 🖥️ Desktop
- 💻 Laptop
- 📱 Tablet
- 📱 Mobile

---

## 🤝 Contributing

歡迎社團成員或任何有興趣的開發者參與貢獻！

- 發現 Bug 或有功能建議，歡迎開 [Issue](https://github.com/fanyuuu2006/lottery-page/issues)
- 想直接貢獻程式碼，歡迎發送 [Pull Request](https://github.com/fanyuuu2006/lottery-page/pulls)

貢獻流程：

1. Fork 本專案
2. 建立新分支（例如 `feature/xxx`）
3. 提交修改並撰寫清楚的 commit message
4. 發送 Pull Request 並描述變更內容

---

## 📄 License

本專案採用 [MIT License](./LICENSE) 授權。

```text
MIT License
```
