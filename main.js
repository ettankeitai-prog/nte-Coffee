// main.js
import { MENUS, SKILLS, BUFF_GROUPS } from './data.js';
import { calculateRevenue, findBestBuildFast, combinations } from './optimizer.js';

const charSlotsContainer = document.getElementById('char-slots');
const menuSlotsContainer = document.getElementById('menu-slots');
const materialBox = document.getElementById('material-box');
const rosterBox = document.getElementById('roster-box');

const totalRevenueEl = document.getElementById('total-revenue');
const itemBreakdownEl = document.getElementById('item-breakdown');

const btnOptimize = document.getElementById('btn-optimize');
const btnBruteForce = document.getElementById('btn-brute-force'); // ★追加
const btnRecommend = document.getElementById('btn-recommend');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const saveDataCodeInput = document.getElementById('save-data-code');

const charNames = [...new Set(SKILLS.map(s => s.character))];
const LOCAL_STORAGE_KEY = 'cafe_optimizer_roster_data';

// --- 画面初期化処理 ---
for (let i = 0; i < 10; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    const select = document.createElement('select');
    select.className = 'char-select';
    select.innerHTML = `<option value="">-- 未配置 --</option>` + charNames.map(name => `<option value="${name}">${name}</option>`).join('');
    
    const levelContainer = document.createElement('div');
    levelContainer.className = 'unlocked-container';
    levelContainer.innerHTML = `Lv: <select class="char-level" style="width: 55px; margin-bottom: 0; padding: 2px;"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5" selected>5</option></select>`;
    
    select.addEventListener('change', runCalculation);
    levelContainer.querySelector('.char-level').addEventListener('change', runCalculation);
    slot.appendChild(select);
    slot.appendChild(levelContainer);
    charSlotsContainer.appendChild(slot);
}

for (let i = 0; i < 5; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    const select = document.createElement('select');
    select.className = 'menu-select';
    select.innerHTML = `<option value="">-- 未設定 --</option>` + MENUS.map(m => `<option value="${m.name}">${m.name} (${m.price.toFixed(2)})</option>`).join('');
    select.addEventListener('change', runCalculation);
    slot.appendChild(select);
    menuSlotsContainer.appendChild(slot);
}

if (window.BUFF_GROUPS || BUFF_GROUPS) {
    const targetGroups = window.BUFF_GROUPS || BUFF_GROUPS;
    targetGroups.forEach(g => {
        const label = document.createElement('label');
        label.className = 'material-label';
        label.innerHTML = `<input type="checkbox" value="${g.name}"> ${g.name} (+${g.add})`;
        label.querySelector('input').addEventListener('change', runCalculation);
        materialBox.appendChild(label);
    });
}

charNames.forEach(name => {
    const card = document.createElement('div');
    card.className = 'roster-item owned';
    card.innerHTML = `
        <div class="roster-header"><input type="checkbox" class="roster-own" checked><span>${name}</span></div>
        <select class="roster-level" style="margin-bottom:0; padding:3px; font-size:12px;">
            <option value="1">Lv 1</option><option value="2">Lv 2</option><option value="3">Lv 3</option><option value="4">Lv 4</option><option value="5" selected>Lv 5</option>
        </select>
    `;
    const checkbox = card.querySelector('.roster-own');
    const levelSelect = card.querySelector('.roster-level');
    checkbox.addEventListener('change', () => {
        checkbox.checked ? card.classList.add('owned') : card.classList.remove('owned');
        saveToLocalStorage();
    });
    levelSelect.addEventListener('change', () => saveToLocalStorage());
    rosterBox.appendChild(card);
});

function saveToLocalStorage() {
    const rosterItems = rosterBox.querySelectorAll('.roster-item');
    const saveData = {};
    rosterItems.forEach(item => {
        const name = item.querySelector('span').innerText;
        const isOwned = item.querySelector('.roster-own').checked;
        const level = item.querySelector('.roster-level').value;
        saveData[name] = { isOwned, level };
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
}

function loadFromLocalStorage() {
    const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!rawData) return;
    try {
        const saveData = JSON.parse(rawData);
        const rosterItems = rosterBox.querySelectorAll('.roster-item');
        rosterItems.forEach(item => {
            const name = item.querySelector('span').innerText;
            if (saveData[name]) {
                const checkEl = item.querySelector('.roster-own');
                const levelEl = item.querySelector('.roster-level');
                checkEl.checked = saveData[name].isOwned;
                levelEl.value = saveData[name].level;
                checkEl.checked ? item.classList.add('owned') : item.classList.remove('owned');
            }
        });
    } catch (e) { console.error("LocalStorageからの読込に失敗", e); }
}

function runCalculation() {
    const selectedCharacters = [];
    charSlotsContainer.querySelectorAll('.slot').forEach(slot => {
        const name = slot.querySelector('.char-select').value;
        const level = parseInt(slot.querySelector('.char-level').value) || 5;
        if (name) selectedCharacters.push({ name, level });
    });
    const selectedMenus = [];
    menuSlotsContainer.querySelectorAll('.menu-select').forEach(select => {
        const menuData = MENUS.find(m => m.name === select.value);
        if (menuData) selectedMenus.push(menuData);
    });
    const activeBuffGroupNames = [];
    materialBox.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => activeBuffGroupNames.push(cb.value));

    if (selectedMenus.length < 5) {
        totalRevenueEl.innerHTML = `0.00<span>/h (5品選んでください)</span>`;
        itemBreakdownEl.innerHTML = '';
        return;
    }
    const result = calculateRevenue(selectedMenus, selectedCharacters, activeBuffGroupNames);
    totalRevenueEl.innerHTML = `${result.revenue.toFixed(2)}<span>/h</span>`;
    itemBreakdownEl.innerHTML = result.itemResults.map(item => {
        const originMenu = MENUS.find(m => m.name === item.name);
        return `<div class="item-card ${originMenu ? originMenu.type : ''}"><div class="item-card-name">${item.name}</div><div class="item-card-rev">+${item.revenue.toFixed(2)}</div></div>`;
    }).join('');
}

// --- ① 最適配置の自動計算 (スマート・高速版) ---
btnOptimize.addEventListener('click', () => {
    const ownedCharacters = [];
    rosterBox.querySelectorAll('.roster-item').forEach(item => {
        if (item.querySelector('.roster-own').checked) {
            ownedCharacters.push({
                name: item.querySelector('span').innerText,
                level: parseInt(item.querySelector('.roster-level').value) || 5
            });
        }
    });

    if (ownedCharacters.length === 0) {
        alert("所持キャラクターに1人もチェックが入っていません！");
        return;
    }

    const activeBuffGroupNames = [];
    materialBox.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => activeBuffGroupNames.push(cb.value));

    const best = findBestBuildFast(MENUS, ownedCharacters, activeBuffGroupNames);

    const menuSelects = menuSlotsContainer.querySelectorAll('.menu-select');
    best.menus.forEach((menu, index) => { if (menuSelects[index]) menuSelects[index].value = menu.name; });

    const charSlotsElements = charSlotsContainer.querySelectorAll('.slot');
    charSlotsElements.forEach(slot => {
        slot.querySelector('.char-select').value = "";
        slot.querySelector('.char-level').value = "5";
    });
    
    best.characters.forEach((char, index) => {
        if (charSlotsElements[index]) {
            charSlotsElements[index].querySelector('.char-select').value = char.name;
            charSlotsElements[index].querySelector('.char-level').value = char.level;
        }
    });
    runCalculation();
    alert(`最強編成の自動セットが完了しました！\n最高予測時給: ${best.revenue.toFixed(2)}/h`);
});

// --- ★新設：完全総当たりモード (100%精度のゴリ押し計算) ---
btnBruteForce.addEventListener('click', async () => {
    const ownedCharacters = [];
    rosterBox.querySelectorAll('.roster-item').forEach(item => {
        if (item.querySelector('.roster-own').checked) {
            ownedCharacters.push({
                name: item.querySelector('span').innerText,
                level: parseInt(item.querySelector('.roster-level').value) || 5
            });
        }
    });

    if (ownedCharacters.length === 0) return alert("所持キャラクターがいません！");

    const activeBuffGroupNames = [];
    materialBox.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => activeBuffGroupNames.push(cb.value));

    // メニューとキャラの全組み合わせを生成
    const menuCombos = combinations(MENUS, 5);
    const charLimit = Math.min(10, ownedCharacters.length);
    const charCombos = combinations(ownedCharacters, charLimit);
    const totalIterations = menuCombos.length * charCombos.length;

    // 警告ダイアログ
    const confirmMsg = `【警告】完全総当たり計算を開始します。\n\n総計算回数: 約 ${totalIterations.toLocaleString()} 回\n※お使いの端末や所持キャラ数によっては、数分以上かかる場合があります。\n\nよろしいですか？`;
    if (!confirm(confirmMsg)) return;

    // UIを計算中モードに変更
    const originalText = btnBruteForce.innerText;
    btnBruteForce.disabled = true;
    btnBruteForce.style.background = "#b91c1c";

    let maxRevenue = -1;
    let bestMenuSet = [];
    let bestCharSet = [];
    let processedMenuCount = 0;

    try {
        // メニューの組み合わせごとにループ
        for (const menuSet of menuCombos) {
            // キャラクターの組み合わせごとにループ
            for (const charSet of charCombos) {
                const result = calculateRevenue(menuSet, charSet, activeBuffGroupNames);
                if (result.revenue > maxRevenue) {
                    maxRevenue = result.revenue;
                    bestMenuSet = menuSet;
                    bestCharSet = charSet;
                }
            }

            processedMenuCount++;
            
            // 100メニュー計算するごとにUIを更新し、ブラウザのフリーズを防ぐ（非同期チャンク処理）
            if (processedMenuCount % 100 === 0) {
                const progress = ((processedMenuCount / menuCombos.length) * 100).toFixed(1);
                btnBruteForce.innerText = `🔥 激重計算中... (${progress}%)`;
                await new Promise(r => setTimeout(r, 0)); // ここで一瞬スレッドを解放する
            }
        }

        // 画面のセレクトボックスに結果を反映
        const menuSelects = menuSlotsContainer.querySelectorAll('.menu-select');
        bestMenuSet.forEach((menu, index) => { if (menuSelects[index]) menuSelects[index].value = menu.name; });

        const charSlotsElements = charSlotsContainer.querySelectorAll('.slot');
        charSlotsElements.forEach(slot => {
            slot.querySelector('.char-select').value = "";
            slot.querySelector('.char-level').value = "5";
        });
        
        bestCharSet.forEach((char, index) => {
            if (charSlotsElements[index]) {
                charSlotsElements[index].querySelector('.char-select').value = char.name;
                charSlotsElements[index].querySelector('.char-level').value = char.level;
            }
        });

        runCalculation();
        alert(`完全総当たり計算が完了しました！\n（屋根裏の取りこぼしは0%です！）\n\n最高予測時給: ${maxRevenue.toFixed(2)}/h`);

    } catch (e) {
        alert("計算中にエラーが発生しました。");
        console.error(e);
    } finally {
        // ボタンを元に戻す
        btnBruteForce.innerText = originalText;
        btnBruteForce.disabled = false;
        btnBruteForce.style.background = "#ef4444";
    }
});


// --- 育成おすすめキャラ診断 ---
function getMaterialCost(currentLv, targetLv) {
    const costs = { 1: 4, 2: 10, 3: 16, 4: 24 };
    let total = 0;
    for (let i = currentLv; i < targetLv; i++) total += costs[i] || 0;
    return total;
}

btnRecommend.addEventListener('click', async () => {
    const ownedCharacters = [];
    rosterBox.querySelectorAll('.roster-item').forEach(item => {
        if (item.querySelector('.roster-own').checked) {
            ownedCharacters.push({
                name: item.querySelector('span').innerText,
                level: parseInt(item.querySelector('.roster-level').value) || 5
            });
        }
    });

    const candidates = ownedCharacters.filter(c => c.level < 5);
    if (candidates.length === 0) return alert("現在所持しているキャラクターは全員レベル5（最大）です！育成完了おめでとうございます！");

    const activeBuffGroupNames = [];
    materialBox.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => activeBuffGroupNames.push(cb.value));

    const originalText = btnRecommend.innerText;
    btnRecommend.disabled = true;
    btnRecommend.style.background = "#6b7280";

    try {
        btnRecommend.innerText = "⏳ ベース時給を計算中...";
        await new Promise(r => setTimeout(r, 10)); 
        
        const baseResult = findBestBuildFast(MENUS, ownedCharacters, activeBuffGroupNames);
        const baseRevenue = baseResult.revenue;

        const tasks = [];
        for (const candidate of candidates) {
            for (let targetLv = candidate.level + 1; targetLv <= 5; targetLv++) {
                tasks.push({ name: candidate.name, targetLevel: targetLv });
            }
        }

        const resultsByChar = {};
        candidates.forEach(c => {
            resultsByChar[c.name] = { currentLevel: c.level, maxIncrease: 0, steps: [] };
        });

        let completed = 0;
        for (const task of tasks) {
            btnRecommend.innerText = `⏳ ポテンシャルを計算中... (${completed + 1}/${tasks.length})`;
            await new Promise(r => setTimeout(r, 0));

            const simCharacters = ownedCharacters.map(c => 
                c.name === task.name ? { name: c.name, level: task.targetLevel } : c
            );

            const simResult = findBestBuildFast(MENUS, simCharacters, activeBuffGroupNames);
            const increase = simResult.revenue - baseRevenue;

            if (increase > 0.01) {
                const isDuplicateIncrease = resultsByChar[task.name].steps.some(step => Math.abs(step.increase - increase) < 0.1);
                if (!isDuplicateIncrease) {
                    resultsByChar[task.name].steps.push({ level: task.targetLevel, increase: increase });
                    if (increase > resultsByChar[task.name].maxIncrease) {
                        resultsByChar[task.name].maxIncrease = increase;
                    }
                }
            }
            completed++;
        }

        const recommendations = Object.keys(resultsByChar)
            .map(name => ({ name, ...resultsByChar[name] }))
            .filter(c => c.maxIncrease > 0)
            .sort((a, b) => b.maxIncrease - a.maxIncrease);

        if (recommendations.length === 0) {
            alert("現在の編成と日次バフ状況では、残りのキャラのレベルを上げても時給は増加しないようです。");
        } else {
            const top3 = recommendations.slice(0, 3);
            let msg = "💡 次に育成すべきおすすめキャラクター TOP3 💡\n\n";
            top3.forEach((rec, index) => {
                msg += `第${index + 1}位: ${rec.name} (現在Lv${rec.currentLevel})\n`;
                rec.steps.sort((a, b) => a.level - b.level).forEach(step => {
                    const cost = getMaterialCost(rec.currentLevel, step.level);
                    msg += `▶ Lv ${step.level} に上げることで、時給が約 +${step.increase.toFixed(2)} /h 増加！\n`;
                    msg += `   (必要素材: 夢なき果核 × ${cost}個)\n`;
                });
                msg += "\n";
            });
            msg += "※現在の日次バフと所持状況に基づいた最大ポテンシャルです。";
            alert(msg);
        }

    } catch (e) {
        alert("計算中にエラーが発生しました。");
        console.error(e);
    } finally {
        btnRecommend.innerText = originalText;
        btnRecommend.disabled = false;
        btnRecommend.style.background = "#8b5cf6";
    }
});

// --- エクスポート / インポート ---
btnExport.addEventListener('click', () => {
    const statusArray = [];
    rosterBox.querySelectorAll('.roster-item').forEach(item => {
        const isOwned = item.querySelector('.roster-own').checked ? "1" : "0";
        const name = item.querySelector('span').innerText;
        const level = item.querySelector('.roster-level').value;
        statusArray.push(`${name}:${isOwned}:${level}`);
    });
    saveDataCodeInput.value = btoa(encodeURIComponent(statusArray.join(',')));
    saveDataCodeInput.select();
    alert("手持ち状況をコード化しました！");
});

btnImport.addEventListener('click', () => {
    const code = prompt("保存したコードをここに貼り付けてください：");
    if (!code) return;
    try {
        const pairs = decodeURIComponent(atob(code)).split(',');
        const rosterItems = rosterBox.querySelectorAll('.roster-item');
        pairs.forEach(pair => {
            const [name, isOwned, level] = pair.split(':');
            rosterItems.forEach(item => {
                if (item.querySelector('span').innerText === name) {
                    const checkEl = item.querySelector('.roster-own');
                    const levelEl = item.querySelector('.roster-level');
                    checkEl.checked = (isOwned === "1");
                    levelEl.value = level;
                    checkEl.checked ? item.classList.add('owned') : item.classList.remove('owned');
                }
            });
        });
        saveToLocalStorage();
        runCalculation();
        alert("コードから手持ち状況を復元しました！");
    } catch (e) { alert("正しい保存コードではありません。"); }
});

loadFromLocalStorage();
runCalculation();