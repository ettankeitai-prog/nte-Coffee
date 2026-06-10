// main.js
import { MENUS, SKILLS } from './data.js';
import { calculateRevenue } from './optimizer.js';

// 画面の各要素を取得
const charSlotsContainer = document.getElementById('char-slots');
const menuSlotsContainer = document.getElementById('menu-slots');
const materialBox = document.getElementById('material-box');
const totalRevenueEl = document.getElementById('total-revenue');
const itemBreakdownEl = document.getElementById('item-breakdown');

// キャラクター一覧の名前リスト（重複を除外して綺麗に並べる）
const charNames = [...new Set(SKILLS.map(s => s.character))];

// メニューに登場する全原材料のリストを自動抽出
const allMaterials = [...new Set(MENUS.flatMap(m => m.materials || []))];

// --- 画面初期化処理 ---

// 1. キャラ枠 (10スロット) の生成
for (let i = 0; i < 10; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    
    // キャラ選択セレクトボックス
    const select = document.createElement('select');
    select.className = 'char-select';
    select.innerHTML = `<option value="">-- 未配置 --</option>` + 
        charNames.map(name => `<option value="${name}">[従業員] ${name}</option>`).join('');
    
    // 能力解放数入力 (1〜3)
    const unlockedContainer = document.createElement('div');
    unlockedContainer.className = 'unlocked-container';
    unlockedContainer.innerHTML = `能力枠:<input type="number" class="unlocked-input" min="1" max="3" value="3">`;
    
    // イベント設定（変更されたら再計算）
    select.addEventListener('change', runCalculation);
    unlockedContainer.querySelector('input').addEventListener('input', runCalculation);

    slot.appendChild(select);
    slot.appendChild(unlockedContainer);
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
    // 画面から選択されたキャラの情報を集める
    const selectedCharacters = [];
    const charSlots = charSlotsContainer.querySelectorAll('.slot');
    charSlots.forEach(slot => {
        const name = slot.querySelector('.char-select').value;
        const unlocked = parseInt(slot.querySelector('.unlocked-input').value) || 3;
        if (name) {
            selectedCharacters.push({ name, unlocked });
        }
    });

    // 画面から選択されたメニューの情報を集める
    const selectedMenus = [];
    const menuSelects = menuSlotsContainer.querySelectorAll('.menu-select');
    menuSelects.forEach(select => {
        const menuName = select.value;
        const menuData = MENUS.find(m => m.name === menuName);
        if (menuData) {
            selectedMenus.push(menuData);
        }
    });

    // チェックのついた原材料バフを集める
    const activeMaterialBuffs = [];
    const checkboxes = materialBox.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        activeMaterialBuffs.push(cb.value);
    });

    // 5品すべて選ばれていない場合は計算結果を0にして処理を抜ける
    if (selectedMenus.length < 5) {
        totalRevenueEl.innerHTML = `0.00<span>/h (5品選んでください)</span>`;
        itemBreakdownEl.innerHTML = '';
        return;
    }

    // optimizer.jsのロジックを呼び出して計算！
    const result = calculateRevenue(selectedMenus, selectedCharacters, activeMaterialBuffs);

    // 画面に合計時給を反映
    totalRevenueEl.innerHTML = `${result.revenue.toFixed(2)}<span>/h</span>`;

    // 画面に商品ごとの内訳カードを生成
    itemBreakdownEl.innerHTML = result.itemResults.map(item => {
        // 属性色分け用のクラス名を取得するため、元のメニューデータを検索
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

// 起動時に一回計算を走らせて初期化
runCalculation();