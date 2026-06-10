// main.js
import { MENUS, SKILLS } from './data.js';
import { calculateRevenue } from './optimizer.js';

const charSlotsContainer = document.getElementById('char-slots');
const menuSlotsContainer = document.getElementById('menu-slots');
const materialBox = document.getElementById('material-box');
const totalRevenueEl = document.getElementById('total-revenue');
const itemBreakdownEl = document.getElementById('item-breakdown');

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
    
    // 【修正点】能力枠の数値入力から、Lv1〜5を選択するセレクトボックスに変更
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
        // 【修正点】セレクトボックスから選択されたレベル値を取得
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

runCalculation();