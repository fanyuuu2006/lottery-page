/**
 * @file BGC Lottery 抽獎輪盤核心程式碼
 * @description 優化版本：增加 JSDoc、提升 DOM 更新效能、改善邏輯可讀性及音效效能
 */

// ==========================================
// 1. 設定與常數定義 (Constants)
// ==========================================

/**
 * 輪盤色塊顏色庫
 * @constant {string[]}
 */
const COLORS = [
  "#0d6bb8", // BGC 品牌藍
  "#df2a34", // BGC 品牌紅
  "#f6b412", // BGC 品牌黃
  "#38a245", // BGC 品牌綠
  "#8e44ad", // 點綴紫 (桌遊感，質感想搭配)
  "#e67e22", // 品牌延伸橘 (增加豐富度同時避免刺眼)
];
/**
 * 輪盤旋轉總時間 (毫秒)
 * @constant {number}
 */
const SPIN_DURATION = 6500;

// ==========================================
// 2. 型別定義 (JSDoc Types)
// ==========================================

/**
 * @typedef {Object} Participant
 * @property {string} name - 參與者名稱
 * @property {number} weight - 權重 (重複出現的次數)
 * @property {string} color - 分配到的色塊顏色
 */

/**
 * @typedef {Object} AppState
 * @property {Participant[]} participants - 參與者名單陣列
 * @property {number} totalWeight - 總權重數
 * @property {Participant[]} history - 歷史中獎名單
 * @property {boolean} isSpinning - 是否正在旋轉中
 * @property {number} currentRotation - 輪盤當前旋轉角度 (弧度)
 * @property {number} hoveredIndex - 當前滑鼠懸停的切片索引
 * @property {HTMLElement|null} tooltip - 懸停時顯示的提示框
 */

// ==========================================
// 3. 全局變數與狀態 (Global State)
// ==========================================

/**
 * @type {AppState}
 */
const appState = {
  participants: [],
  totalWeight: 0,
  history: [],
  isSpinning: false,
  currentRotation: 0,
  hoveredIndex: -1,
  tooltip: null,
};

// ==========================================
// 4. DOM 元素快取 (DOM Cache)
// ==========================================
const DOM = {
  nameInput: /** @type {HTMLTextAreaElement} */ (
    document.getElementById("nameInput")
  ),
  updateBtn: /** @type {HTMLButtonElement} */ (
    document.getElementById("updateBtn")
  ),
  spinBtn: /** @type {HTMLButtonElement} */ (
    document.getElementById("spinBtn")
  ),
  resetBtn: /** @type {HTMLButtonElement} */ (
    document.getElementById("resetBtn")
  ),
  uniqueCount: /** @type {HTMLElement} */ (
    document.getElementById("uniqueCount")
  ),
  totalWeight: /** @type {HTMLElement} */ (
    document.getElementById("totalWeight")
  ),
  wheelCanvas: /** @type {HTMLCanvasElement} */ (
    document.getElementById("wheelCanvas")
  ),
  winnerDisplay: /** @type {HTMLElement} */ (
    document.getElementById("winnerDisplay")
  ),
  winnerText: /** @type {HTMLElement} */ (
    document.getElementById("winnerText")
  ),
  historyList: /** @type {HTMLElement} */ (
    document.getElementById("historyList")
  ),
  centerText: /** @type {HTMLElement} */ (
    document.getElementById("centerText")
  ),
};

// Canvas API Context 與基礎繪圖參數快取
const ctx = /** @type {CanvasRenderingContext2D} */ (
  DOM.wheelCanvas.getContext("2d")
);
const W = DOM.wheelCanvas.width;
const H = DOM.wheelCanvas.height;
const CENTER = { x: W / 2, y: H / 2 };
const RADIUS = Math.min(W, H) / 2 - 10;
const TWO_PI = Math.PI * 2;

// 啟動音效上下文 (延遲到使用者互動後再 Resume)
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContextClass();

// ==========================================
// 5. 初始化與事件監聽 (Initialization)
// ==========================================

/**
 * 初始化抽獎應用
 */
function init() {
  DOM.updateBtn.addEventListener("click", handleUpdateList);
  DOM.spinBtn.addEventListener("click", handleStartSpin);
  DOM.resetBtn.addEventListener("click", handleReset);

  // 綁定輪盤 Hover 事件
  DOM.wheelCanvas.addEventListener("mousemove", handleWheelHover);
  DOM.wheelCanvas.addEventListener("mouseleave", handleWheelLeave);

  // 初始化 Tooltip
  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.pointerEvents = "none";
  tooltip.style.background = "rgba(0, 0, 0, 0.85)";
  tooltip.style.color = "#fff";
  tooltip.style.padding = "6px 12px";
  tooltip.style.borderRadius = "6px";
  tooltip.style.fontSize = "14px";
  tooltip.style.fontFamily = "sans-serif";
  tooltip.style.display = "none";
  tooltip.style.zIndex = "1000";
  tooltip.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)";
  document.body.appendChild(tooltip);
  appState.tooltip = tooltip;

  // 初始化畫布
  drawWheel();
}

// ==========================================
// 6. 核心處理邏輯 (Core Handlers)
// ==========================================

/**
 * 處理輪盤滑鼠懸停邏輯
 * @param {MouseEvent} e
 */
function handleWheelHover(e) {
  if (appState.isSpinning || appState.participants.length === 0) return;

  const rect = DOM.wheelCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 計算至中心的距離
  const dx = x - CENTER.x;
  const dy = y - CENTER.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 若滑鼠超出輪盤半徑，隱藏 tooltip 並返回
  if (dist > RADIUS || dist === 0) {
    handleWheelLeave();
    return;
  }

  // 計算滑鼠所在的原始角度 (加上 PI / 2 後再調整為 0~2PI)
  let mouseAngle = Math.atan2(dy, dx);
  if (mouseAngle < 0) mouseAngle += TWO_PI;

  // 退回旋轉造成的偏移
  let normalizedAngle =
    (mouseAngle - (appState.currentRotation % TWO_PI) + TWO_PI) % TWO_PI;

  let currentAngle = 0;
  let foundIndex = -1;

  for (let i = 0; i < appState.participants.length; i++) {
    const sliceAngle =
      (appState.participants[i].weight / appState.totalWeight) * TWO_PI;
    if (
      normalizedAngle >= currentAngle &&
      normalizedAngle < currentAngle + sliceAngle
    ) {
      foundIndex = i;
      break;
    }
    currentAngle += sliceAngle;
  }

  if (foundIndex !== -1 && foundIndex !== appState.hoveredIndex) {
    appState.hoveredIndex = foundIndex;
    drawWheel(); // 觸發重繪以凸顯
  }

  // 顯示並移動 Tooltip
  if (foundIndex !== -1) {
    const item = appState.participants[foundIndex];
    const percentage = ((item.weight / appState.totalWeight) * 100).toFixed(1);
    appState.tooltip.innerHTML = `<strong>${item.name}</strong><br/>權重: ${item.weight}<br/>機率: ${percentage}%`;
    appState.tooltip.style.left = `${e.pageX + 15}px`;
    appState.tooltip.style.top = `${e.pageY + 15}px`;
    appState.tooltip.style.display = "block";
  }
}

/**
 * 處理滑鼠離開輪盤範圍
 */
function handleWheelLeave() {
  if (appState.tooltip) {
    appState.tooltip.style.display = "none";
  }
  if (appState.hoveredIndex !== -1) {
    appState.hoveredIndex = -1;
    drawWheel();
  }
}

/**
 * 處理更新名單邏輯
 */
function handleUpdateList() {
  if (appState.isSpinning) return;

  const rawText = DOM.nameInput.value;
  // 透過正規表達式過濾空格及換行，並移除空白字串（優化：改為以逗號及換行分割，容許姓名中帶空白如英文名）
  const lines = rawText
    .split(/[\r\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    alert("請輸入名單！");
    return;
  }

  // 1. 計算權重 (字典統計 O(N))
  const counts = Object.create(null); // 使用無原型對象避免屬性污染且提升讀取效能
  for (let i = 0; i < lines.length; i++) {
    const name = lines[i];
    counts[name] = (counts[name] || 0) + 1;
  }

  // 2. 轉換為陣列並設定顏色
  const keys = Object.keys(counts);
  appState.totalWeight = 0;
  appState.participants = keys.map((name, index) => {
    const weight = counts[name];
    appState.totalWeight += weight; // 於同一次迴圈內順便加總權重，減少遍歷次數
    return {
      name,
      weight,
      color: COLORS[index % COLORS.length],
    };
  });

  updateUIManager();
}

/**
 * 處理開始旋轉邏輯
 */
function handleStartSpin() {
  if (appState.isSpinning || appState.participants.length === 0) return;

  // 啟動音效環境防瀏覽器阻擋策略
  if (audioCtx.state === "suspended") audioCtx.resume();
  playBeep(400, "sine", 0.1);

  setSpinningState(true);

  // 決定中獎者
  const winnerIndex = calculateWinnerIndex();
  const winner = appState.participants[winnerIndex];

  // 計算目標旋轉角度
  const targetRotation = calculateTargetRotation(winnerIndex, winner);

  // 執行旋轉動畫
  animateSpin(targetRotation, winnerIndex);
}

/**
 * 處理重置清空邏輯
 */
function handleReset() {
  if (appState.isSpinning) return;
  if (!confirm("確定要清空所有紀錄嗎？")) return;

  appState.participants = [];
  appState.totalWeight = 0;
  appState.history = [];
  appState.currentRotation = 0;

  DOM.nameInput.value = "";
  DOM.historyList.innerHTML = '<div class="empty-state">尚未有中獎者產生</div>';
  updateUIManager();
}

// ==========================================
// 7. 內部功能與運算演算法 (Internal Logics)
// ==========================================

/**
 * 依據權重比例隨機決定獲勝者陣列索引
 * @returns {number} 中獎者的陣列索引
 */
function calculateWinnerIndex() {
  let rand = Math.random() * appState.totalWeight;
  let sum = 0;
  for (let i = 0; i < appState.participants.length; i++) {
    sum += appState.participants[i].weight;
    if (rand <= sum) return i;
  }
  return 0; // Fallback
}

/**
 * 計算需旋轉的角度，確保最終中獎者區塊正對上方 (指針處)
 * @param {number} winnerIndex - 中獎者索引
 * @param {Participant} winner - 中獎者物件
 * @returns {number} 目標總弧度
 */
function calculateTargetRotation(winnerIndex, winner) {
  let startAngle = 0;
  // 累加該區塊之前的角度佔比
  for (let i = 0; i < winnerIndex; i++) {
    startAngle +=
      (appState.participants[i].weight / appState.totalWeight) * TWO_PI;
  }

  const sliceAngle = (winner.weight / appState.totalWeight) * TWO_PI;
  // 以切片正中央對準指針
  const sliceCenterAngle = startAngle + sliceAngle / 2;

  // 圓盤上方點(指針)的角度位於 270度，對應 Math.PI * 1.5 弧度
  const targetPointerAngle = Math.PI * 1.5;

  // 加上隨機的整體圈數 (讓輪盤每次都多轉 8~11 圈，避免短程停止)
  const baseSpins = 8 + Math.floor(Math.random() * 4);
  const extraSpins = TWO_PI * baseSpins;

  // 目標角度 = 額外轉數 + (指針目標角度 - 該切片偏離 0 度的角度)
  let targetRotation = extraSpins + (targetPointerAngle - sliceCenterAngle);

  // 防衛：維持角度的連續疊加以便於動畫不發生反轉
  while (targetRotation < appState.currentRotation) {
    targetRotation += TWO_PI;
  }

  return targetRotation;
}

/**
 * 使用 requestAnimationFrame 執行平滑動畫處理
 * @param {number} targetRotation - 最終目標角度
 * @param {number} winnerIndex - 中獎者陣列索引
 */
function animateSpin(targetRotation, winnerIndex) {
  const startTime = performance.now();
  const startRotation = appState.currentRotation;
  const distance = targetRotation - startRotation;

  const tickCoefficient = (appState.participants.length * 2) / TWO_PI;
  let lastTickScore = 0;

  /**
   * 遞迴 Frame 執行函式
   * @param {number} currentTime
   */
  function frame(currentTime) {
    const elapsed = currentTime - startTime;
    let progress = Math.min(elapsed / SPIN_DURATION, 1);

    // Easing 運算: Ease-Out-Quint (產生明顯又柔和的減速停靠感)
    const easeOut = 1 - Math.pow(1 - progress, 5);
    appState.currentRotation = startRotation + distance * easeOut;

    // --- 音頻模擬: 利用虛擬刻度運算減少過密集的觸發 ---
    const currentTick = Math.floor(appState.currentRotation * tickCoefficient);
    if (currentTick > lastTickScore && progress < 0.95) {
      playBeep(600 + progress * 200, "triangle", 0.02);
      lastTickScore = currentTick;
    }

    drawWheel(); // 重繪畫布影像

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      finishSpin(winnerIndex); // 傳接結束收尾
    }
  }

  requestAnimationFrame(frame);
}

/**
 * 旋轉結束後的收尾清理動作
 * @param {number} winnerIndex - 中獎者索引
 */
function finishSpin(winnerIndex) {
  const winner = appState.participants[winnerIndex];

  // 撥出連續的中獎提示雙音效
  playBeep(800, "square", 0.1);
  setTimeout(() => playBeep(1000, "square", 0.2), 150);

  // 1. 新增歷史紀錄 (只更動 DOM 局部點)
  appState.history.push(winner);
  addHistoryItemToDOM(winner, appState.history.length);

  // 2. 將贏家從畫布及輸入框剔除
  removeWinnerFromList(winnerIndex, winner.name);

  // 3. UI 得獎版面顯示
  DOM.winnerText.innerHTML = `恭喜 <strong style="color: ${winner.color};">${winner.name}</strong> 抽中！`;
  DOM.winnerDisplay.classList.add("highlight");

  setSpinningState(false);
  updateUIManager();
}

/**
 * 從內部狀態及使用者介面上安全地拔除該中獎者
 * @param {number} winnerIndex
 * @param {string} winnerName
 */
function removeWinnerFromList(winnerIndex, winnerName) {
  // 從記憶體陣列移除
  appState.participants.splice(winnerIndex, 1);
  appState.totalWeight = appState.participants.reduce(
    (sum, p) => sum + p.weight,
    0,
  );

  // 從輸入文字框移除：改用陣列過濾避免了以 RegExp Replace 多行匹配可能帶來的異常空行漏洞
  const currentLines = DOM.nameInput.value
    .split(/[\r\n,]+/)
    .map((s) => s.trim());
  const nextLines = currentLines.filter((name) => name && name !== winnerName);
  DOM.nameInput.value = nextLines.join("\n");
}

// ==========================================
// 8. 顯示更新與繪圖區塊 (View / Rendering)
// ==========================================

/**
 * 集中管理與觸發不佔主邏輯且單純的數值更新
 */
function updateUIManager() {
  const count = appState.participants.length;

  DOM.uniqueCount.textContent = String(count);
  DOM.totalWeight.textContent = String(appState.totalWeight);
  DOM.spinBtn.disabled = count === 0 || appState.isSpinning;

  // 非旋轉且非獲獎公告狀況下隱藏得獎窗
  if (
    !appState.isSpinning &&
    !DOM.winnerDisplay.classList.contains("highlight")
  ) {
    DOM.winnerDisplay.classList.remove("show", "highlight");
  }

  appState.currentRotation = 0; // 重置輪盤以回到原始 0 度
  drawWheel();
}

/**
 * 切換並同步旋轉模式中的按鈕防呆與畫布公告
 * @param {boolean} spinning
 */
function setSpinningState(spinning) {
  appState.isSpinning = spinning;
  DOM.spinBtn.disabled = spinning;
  DOM.updateBtn.disabled = spinning;
  DOM.nameInput.disabled = spinning;

  if (spinning) {
    DOM.winnerDisplay.classList.remove("show", "highlight");
    DOM.winnerText.textContent = "抽獎中...";
    DOM.winnerDisplay.classList.add("show");
  }
}

/**
 * 新增歷史紀錄物件到畫面上，運用 insertAdjacentHTML 達到 O(1) 更新效能
 * 取代過去使用全陣列重繪
 * @param {Participant} participant - 參與者物件
 * @param {number} rank - 名次序號
 */
function addHistoryItemToDOM(participant, rank) {
  // 第一次插入時清除「尚未有中獎者產生」字眼
  if (appState.history.length === 1) DOM.historyList.innerHTML = "";

  const html = `
    <div class="history-item" style="--c: ${participant.color};">
        <span class="rank">#${rank}</span>
        <span class="name">${participant.name}</span>
        <span class="weight-badge">權重: x${participant.weight}</span>
    </div>
  `;
  // 從最上方插入即可達反轉呈現的效果
  DOM.historyList.insertAdjacentHTML("afterbegin", html);
}

/**
 * 主要 Render：依照畫布設定繪製目前輪盤圖形
 */
function drawWheel() {
  ctx.clearRect(0, 0, W, H);

  // 空輪盤
  if (appState.participants.length === 0) {
    drawEmptyWheel();
    return;
  }

  // 優化防過載考量：當名單超過 30，避免繪圖文字重疊及效能不佳，僅標記圓餅圖
  const isSimplified = appState.participants.length > 30;
  let currentAngle = appState.currentRotation;

  // 於主結構外定義這些共享樣式，減少迴圈重新宣告
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = "bold 20px sans-serif";

  appState.participants.forEach((item, index) => {
    const sliceAngle = (item.weight / appState.totalWeight) * TWO_PI;
    const isHovered = appState.hoveredIndex === index;

    // 1. 畫當下切片扇形
    ctx.beginPath();
    ctx.moveTo(CENTER.x, CENTER.y);

    // hovered 狀態放大半徑產生效果
    const drawRadius = isHovered ? RADIUS + 6 : RADIUS;

    ctx.arc(
      CENTER.x,
      CENTER.y,
      drawRadius,
      currentAngle,
      currentAngle + sliceAngle,
    );
    ctx.closePath();

    ctx.fillStyle = item.color;

    // 針對非 hover 區塊稍微增加透明度凸顯主體
    if (appState.hoveredIndex !== -1 && !isHovered) {
      ctx.globalAlpha = 0.7;
    } else {
      ctx.globalAlpha = 1.0;
    }

    ctx.fill();

    // 繪製輪廓線
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.strokeStyle = isHovered ? "#ffffff" : "rgba(255,255,255,0.5)";
    ctx.stroke();

    ctx.globalAlpha = 1.0; // 恢復預設透明度

    // 2. 畫內文字 (占比太小的小於 0.05 弧度避免字與字疊加因此不畫)
    if (!isSimplified && sliceAngle > 0.05) {
      ctx.save();
      ctx.translate(CENTER.x, CENTER.y);
      ctx.rotate(currentAngle + sliceAngle / 2);

      ctx.fillStyle = "#ffffff";
      if (isHovered) ctx.font = "bold 23px sans-serif";

      const printText =
        item.weight > 1 ? `${item.name} (x${item.weight})` : item.name;
      ctx.fillText(printText, drawRadius - 20, 0);

      ctx.restore();
    }

    currentAngle += sliceAngle; // 疊加角進度
  });

  DOM.centerText.textContent = isSimplified
    ? `${appState.participants.length} 人`
    : "BGC";
}

/**
 * 當沒有資料時，繪製一顆原型的空白預設輪盤
 */
function drawEmptyWheel() {
  ctx.beginPath();
  ctx.moveTo(CENTER.x, CENTER.y);
  ctx.arc(CENTER.x, CENTER.y, RADIUS, 0, TWO_PI);
  ctx.fillStyle = "#2c353f"; // 使用深色背景搭配夜間模式
  ctx.fill();
  ctx.strokeStyle = "#4b5563"; // 深色邊框
  ctx.lineWidth = 2;
  ctx.stroke();

  DOM.centerText.textContent = "BGC";
}

// ==========================================
// 9. 共用工具類 (Utils)
// ==========================================

/**
 * 觸發並生成基礎波形音效，利用 AudioContext 控制
 * 注: 生成 Oscillator 後用例皆須進行垃圾回收機制避免積累卡頓
 * @param {number} frequency - 發聲頻率 (Hz)
 * @param {"sine"|"square"|"sawtooth"|"triangle"} [type="sine"] - 波形模式
 * @param {number} [duration=0.1] - 持續時間 (秒)
 */
function playBeep(frequency, type = "sine", duration = 0.1) {
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + duration,
  );

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);

  // 優化效能：播放完畢後進行分離以確保資源迅速獲得解脫
  setTimeout(
    () => {
      oscillator.disconnect();
      gainNode.disconnect();
    },
    duration * 1000 + 50,
  );
}

// 執行應用初始化
init();
