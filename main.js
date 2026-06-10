// main.js
import { MENUS, SKILLS } from './data.js';
import { calculateRevenue, findBestBuildFast } from './optimizer.js';

const charSlotsContainer = document.getElementById('char-slots');
const menuSlotsContainer = document.getElementById('menu-slots');
const materialBox = document.getElementById('material-box');
const totalRevenueEl = document.getElementById('total-revenue');
const itemBreakdownEl = document.getElementById('item-breakdown');

const btnOptimize = document.getElementById('btn-optimize');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const saveDataCodeInput = document.getElementById('save-data-code');

const charNames = [...new Set(SKILLS.map(s => s.character))];
const allMaterials = [...new Set(MENUS.flatMap(m => m.materials || []))];

// --- 画面初期化処理 ---

// 1. キャラ枠 (10スロット) の生成
for (let i = 0; i < 10; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    
    const select = document.createElement('select');
    select.className = 'char-select';
    select.innerHTML = `<option value="">-- 未配置 --</option>` + 
        charNames.map(name => `<option value="${name}">[従業員] ${name}</option>`).join('');
    
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

// 2. メニュー枠 (5スロット) の生成
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

// 3. 原材料バフのチェックボックス生成
allMaterials.forEach(mat => {
    const label = document.createElement('label');
    label.className = 'material-label';
    label.innerHTML = `<input type="checkbox" value="${mat}"> ${mat}`;
    label.querySelector('input').addEventListener('change', runCalculation);
    materialBox.appendChild(label);
});


// --- リアルタイム計算処理 ---
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

    const activeMaterialBuffs = [];
    const checkboxes = materialBox.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        activeMaterialBuffs.push(cb.value);
    });

    if (selectedMenus.length < 5) {
        totalRevenueEl.innerHTML = `0.00<span>/h (5品選んでください)</span>`;
        itemBreakdownEl.innerHTML = '';
        return;
    }

    const result = calculateRevenue(selectedMenus, selectedCharacters, activeMaterialBuffs);

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
    const charSlots = charSlotsContainer.querySelectorAll('.slot');
    const userCharacterStatus = charNames.map(name => {
        let currentLevel = 5;
        const slots = charSlotsContainer.querySelectorAll('.slot');
        for (const slot of slots) {
            if (slot.querySelector('.char-select').value === name) {
                currentLevel = parseInt(slot.querySelector('.char-level').value);
                break;
            }
        }
        return { name, level: currentLevel };
    });

    const activeMaterialBuffs = [];
    const checkboxes = materialBox.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => activeMaterialBuffs.push(cb.value));

    // 最適化ロジックの呼び出し
    const best = findBestBuildFast(MENUS, userCharacterStatus, activeMaterialBuffs);

    // メニューの自動反映
    const menuSelects = menuSlotsContainer.querySelectorAll('.menu-select');
    best.menus.forEach((menu, index) => {
        if (menuSelects[index]) menuSelects[index].value = menu.name;
    });

    // キャラクターの自動反映
    const charSlotsElements = charSlotsContainer.querySelectorAll('.slot');
    charSlotsElements.forEach(slot => slot.querySelector('.char-select').value = "");
    
    best.characters.forEach((char, index) => {
        if (charSlotsElements[index]) {
            const selectEl = charSlotsElements[index].querySelector('.char-select');
            const levelEl = charSlotsElements[index].querySelector('.char-level');
            selectEl.value = char.name;
            levelEl.value = char.level;
        }
    });

    runCalculation();
    alert(`最強編成を自動配置しました！\n最高予測時給: ${best.revenue.toFixed(2)}/h`);
});

// --- ② エクスポート（コード作成） ---
btnExport.addEventListener('click', () => {
    // 画面の10個のスロットの状態（配置されているキャラ名とレベル）をそのまま保存する
    const slots = charSlotsContainer.querySelectorAll('.slot');
    const statusArray = [];
    
    slots.forEach(slot => {
        const name = slot.querySelector('.char-select').value || "EMPTY";
        const level = slot.querySelector('.char-level').value || "5";
        statusArray.push(`${name}:${level}`);
    });

    const code = btoa(encodeURIComponent(statusArray.join(',')));
    saveDataCodeInput.value = code;
    saveDataCodeInput.select();
    alert("現在の配置とレベルの保存コードを作成しました！コピーして保存してください。");
});

// --- ② インポート（コード読込） ---
btnImport.addEventListener('click', () => {
    const code = prompt("保存したコードをここに貼り付けてください：");
    if (!code) return;
    try {
        const decoded = decodeURIComponent(atob(code));
        const pairs = decoded.split(',');
        
        const slots = charSlotsContainer.querySelectorAll('.slot');
        
        // 10個のスロットの状態を完全復元する
        pairs.forEach((pair, index) => {
            if (index < 10 && slots[index]) {
                const [name, level] = pair.split(':');
                const selectEl = slots[index].querySelector('.char-select');
                const levelEl = slots[index].querySelector('.char-level');
                
                selectEl.value = (name === "EMPTY") ? "" : name;
                levelEl.value = level;
            }
        });

        runCalculation();
        alert("キャラクターの配置とレベル状況を復元しました！");
    } catch (e) {
        alert("正しい保存コードではありません。");
    }
});

runCalculation();