// main.js
import { MENUS, SKILLS, BUFF_GROUPS } from './data.js';
import { calculateRevenue, findBestBuildFast } from './optimizer.js';

const charSlotsContainer = document.getElementById('char-slots');
const menuSlotsContainer = document.getElementById('menu-slots');
const materialBox = document.getElementById('material-box');
const rosterBox = document.getElementById('roster-box');

const totalRevenueEl = document.getElementById('total-revenue');
const itemBreakdownEl = document.getElementById('item-breakdown');

const btnOptimize = document.getElementById('btn-optimize');
const btnRecommend = document.getElementById('btn-recommend'); // 追加
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

// --- ① 最適配置の自動計算 ---
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

// --- ★新設：育成おすすめキャラ診断 ---
btnRecommend.addEventListener('click', () => {
    const ownedCharacters = [];
    rosterBox.querySelectorAll('.roster-item').forEach(item => {
        if (item.querySelector('.roster-own').checked) {
            ownedCharacters.push({
                name: item.querySelector('span').innerText,
                level: parseInt(item.querySelector('.roster-level').value) || 5
            });
        }
    });

    // 伸びしろがある（Lv5未満）のキャラを抽出
    const candidates = ownedCharacters.filter(c => c.level < 5);
    if (candidates.length === 0) {
        alert("現在所持しているキャラクターは全員レベル5（最大）です！育成完了おめでとうございます！");
        return;
    }

    const activeBuffGroupNames = [];
    materialBox.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => activeBuffGroupNames.push(cb.value));

    // 計算に数秒かかるため、ボタンの見た目を変えてUIが固まった不安をなくす
    const originalText = btnRecommend.innerText;
    btnRecommend.innerText = "⏳ 膨大な組み合わせから育成ポテンシャルを計算中... (数十秒かかる場合があります)";
    btnRecommend.disabled = true;
    btnRecommend.style.background = "#6b7280";

    // ブラウザの描画を更新させるためにsetTimeoutで処理を遅延させる
    setTimeout(() => {
        try {
            // 現在の育成状況での最高時給（ベースライン）
            const baseResult = findBestBuildFast(MENUS, ownedCharacters, activeBuffGroupNames);
            const baseRevenue = baseResult.revenue;

            const recommendations = [];

            // 各候補キャラについて「仮にこの子だけLv5になったら」をシミュレーション
            for (const candidate of candidates) {
                const simCharacters = ownedCharacters.map(c => {
                    if (c.name === candidate.name) {
                        return { name: c.name, level: 5 }; // Lv5のポテンシャルを測る
                    }
                    return c;
                });

                const simResult = findBestBuildFast(MENUS, simCharacters, activeBuffGroupNames);
                const increase = simResult.revenue - baseRevenue;

                // 時給が1円以上伸びるならリストに入れる
                if (increase > 0) {
                    recommendations.push({
                        name: candidate.name,
                        increase: increase
                    });
                }
            }

            // 伸び幅が大きい順にソート
            recommendations.sort((a, b) => b.increase - a.increase);

            // アラートで結果を発表
            if (recommendations.length === 0) {
                alert("現在の編成と日次バフ状況では、残りのキャラのレベルを上げても時給は増加しないようです。");
            } else {
                const top3 = recommendations.slice(0, 3);
                let msg = "💡 育成おすすめキャラクター TOP3 💡\n\n";
                top3.forEach((rec, index) => {
                    msg += `第${index + 1}位: ${rec.name}\n`;
                    msg += `▶ レベルを 5 に上げることで、時給が約 +${rec.increase.toFixed(2)} /h 増加します！\n\n`;
                });
                msg += "※現在の日次バフと所持状況に基づいた最大ポテンシャルです。";
                alert(msg);
            }
        } catch (e) {
            alert("計算中にエラーが発生しました。");
            console.error(e);
        } finally {
            // 処理が終わったらボタンを元に戻す
            btnRecommend.innerText = originalText;
            btnRecommend.disabled = false;
            btnRecommend.style.background = "#8b5cf6";
        }
    }, 100);
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