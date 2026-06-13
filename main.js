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
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const saveDataCodeInput = document.getElementById('save-data-code');

const charNames = [...new Set(SKILLS.map(s => s.character))];

// --- 画面初期化処理 ---

// 1. 店舗に配置する用のキャラスロット (10枠)
for (let i = 0; i < 10; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    
    const select = document.createElement('select');
    select.className = 'char-select';
    select.innerHTML = `<option value="">-- 未配置 --</option>` + 
        charNames.map(name => `<option value="${name}">${name}</option>`).join('');
    
    const levelContainer = document.createElement('div');
    levelContainer.className = 'unlocked-container';
    levelContainer.innerHTML = `
        Lv: 
        <select class="char-level" style="width: 55px; margin-bottom: 0; padding: 2px;">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5" selected>5</option>
        </select>
    `;
    
    select.addEventListener('change', runCalculation);
    levelContainer.querySelector('.char-level').addEventListener('change', runCalculation);

    slot.appendChild(select);
    slot.appendChild(levelContainer);
    charSlotsContainer.appendChild(slot);
}

// 2. 店舗に配置する用のメニュースロット (5枠)
for (let i = 0; i < 5; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    
    const select = document.createElement('select');
    select.className = 'menu-select';
    select.innerHTML = `<option value="">-- 未設定 --</option>` + 
        MENUS.map(m => `<option value="${m.name}">${m.name} (${m.price.toFixed(2)})</option>`).join('');
    
    select.addEventListener('change', runCalculation);
    slot.appendChild(select);
    menuSlotsContainer.appendChild(slot);
}

// 3. 日次バフグループのチェックボックス自動生成
if (window.BUFF_GROUPS || BUFF_GROUPS) {
    const targetGroups = window.BUFF_GROUPS || BUFF_GROUPS;
    targetGroups.forEach(g => {
        const label = document.createElement('label');
        label.className = 'material-label';
        // 表示用にグループ名と加算値をだす (例: 果物 (+0.75))
        label.innerHTML = `<input type="checkbox" value="${g.name}"> ${g.name} (+${g.add})`;
        label.querySelector('input').addEventListener('change', runCalculation);
        materialBox.appendChild(label);
    });
}

// 4. 全キャラクター所持・育成状況の一覧
charNames.forEach(name => {
    const card = document.createElement('div');
    card.className = 'roster-item owned';
    card.innerHTML = `
        <div class="roster-header">
            <input type="checkbox" class="roster-own" checked>
            <span>${name}</span>
        </div>
        <select class="roster-level" style="margin-bottom:0; padding:3px; font-size:12px;">
            <option value="1">Lv 1</option>
            <option value="2">Lv 2</option>
            <option value="3">Lv 3</option>
            <option value="4">Lv 4</option>
            <option value="5" selected>Lv 5</option>
        </select>
    `;

    const checkbox = card.querySelector('.roster-own');
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            card.classList.add('owned');
        } else {
            card.classList.remove('owned');
        }
    });

    rosterBox.appendChild(card);
});


// --- リアルタイム売上計算処理 ---
function runCalculation() {
    const selectedCharacters = [];
    const charSlots = charSlotsContainer.querySelectorAll('.slot');
    charSlots.forEach(slot => {
        const name = slot.querySelector('.char-select').value;
        const level = parseInt(slot.querySelector('.char-level').value) || 5;
        if (name) {
            selectedCharacters.push({ name, level });
        }
    });

    const selectedMenus = [];
    const menuSelects = menuSlotsContainer.querySelectorAll('.menu-select');
    menuSelects.forEach(select => {
        const menuName = select.value;
        const menuData = MENUS.find(m => m.name === menuName);
        if (menuData) {
            selectedMenus.push(menuData);
        }
    });

    const activeBuffGroupNames = [];
    const checkboxes = materialBox.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        activeBuffGroupNames.push(cb.value);
    });

    if (selectedMenus.length < 5) {
        totalRevenueEl.innerHTML = `0.00<span>/h (5品選んでください)</span>`;
        itemBreakdownEl.innerHTML = '';
        return;
    }

    const result = calculateRevenue(selectedMenus, selectedCharacters, activeBuffGroupNames);
    totalRevenueEl.innerHTML = `${result.revenue.toFixed(2)}<span>/h</span>`;

    itemBreakdownEl.innerHTML = result.itemResults.map(item => {
        const originMenu = MENUS.find(m => m.name === item.name);
        const typeClass = originMenu ? originMenu.type : '';
        return `
            <div class="item-card ${typeClass}">
                <div class="item-card-name">${item.name}</div>
                <div class="item-card-rev">+${item.revenue.toFixed(2)}</div>
            </div>
        `;
    }).join('');
}

// --- ① 最適配置の自動計算 ---
btnOptimize.addEventListener('click', () => {
    const ownedCharacters = [];
    const rosterItems = rosterBox.querySelectorAll('.roster-item');
    
    rosterItems.forEach(item => {
        const isOwned = item.querySelector('.roster-own').checked;
        const name = item.querySelector('span').innerText;
        const level = parseInt(item.querySelector('.roster-level').value) || 5;
        
        if (isOwned) {
            ownedCharacters.push({ name, level });
        }
    });

    if (ownedCharacters.length === 0) {
        alert("所持キャラクターに1人もチェックが入っていません！");
        return;
    }

    const activeBuffGroupNames = [];
    const checkboxes = materialBox.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => activeBuffGroupNames.push(cb.value));

    const best = findBestBuildFast(MENUS, ownedCharacters, activeBuffGroupNames);

    const menuSelects = menuSlotsContainer.querySelectorAll('.menu-select');
    best.menus.forEach((menu, index) => {
        if (menuSelects[index]) menuSelects[index].value = menu.name;
    });

    const charSlotsElements = charSlotsContainer.querySelectorAll('.slot');
    charSlotsElements.forEach(slot => {
        slot.querySelector('.char-select').value = "";
        slot.querySelector('.char-level').value = "5";
    });
    
    best.characters.forEach((char, index) => {
        if (charSlotsElements[index]) {
            const selectEl = charSlotsElements[index].querySelector('.char-select');
            const levelEl = charSlotsElements[index].querySelector('.char-level');
            selectEl.value = char.name;
            levelEl.value = char.level;
        }
    });

    runCalculation();
    alert(`最強編成の自動セットが完了しました！\n最高予測時給: ${best.revenue.toFixed(2)}/h`);
});

// --- ② セーブ（エクスポート用コード作成） ---
btnExport.addEventListener('click', () => {
    const rosterItems = rosterBox.querySelectorAll('.roster-item');
    const statusArray = [];

    rosterItems.forEach(item => {
        const isOwned = item.querySelector('.roster-own').checked ? "1" : "0";
        const name = item.querySelector('span').innerText;
        const level = item.querySelector('.roster-level').value;
        statusArray.push(`${name}:${isOwned}:${level}`);
    });

    const code = btoa(encodeURIComponent(statusArray.join(',')));
    saveDataCodeInput.value = code;
    saveDataCodeInput.select();
    alert("あなたのキャラクター所持状況をコード化しました！メモ帳などに保存してください。");
});

// --- ② ロード（インポートコード読込） ---
btnImport.addEventListener('click', () => {
    const code = prompt("保存したコードをここに貼り付けてください：");
    if (!code) return;
    try {
        const decoded = decodeURIComponent(atob(code));
        const pairs = decoded.split(',');
        const rosterItems = rosterBox.querySelectorAll('.roster-item');

        pairs.forEach(pair => {
            const [name, isOwned, level] = pair.split(':');
            
            rosterItems.forEach(item => {
                if (item.querySelector('span').innerText === name) {
                    const checkEl = item.querySelector('.roster-own');
                    const levelEl = item.querySelector('.roster-level');
                    
                    checkEl.checked = (isOwned === "1");
                    levelEl.value = level;

                    if (checkEl.checked) {
                        item.classList.add('owned');
                    } else {
                        item.classList.remove('owned');
                    }
                }
            });
        });

        runCalculation();
        alert("全キャラクターの所持・レベル状況を完璧に復元しました！");
    } catch (e) {
        alert("正しい保存コードではありません。");
    }
});

runCalculation();