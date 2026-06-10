// optimizer.js
import { MENUS, SKILLS } from './data.js';

export const BASE_CUSTOMERS = 2400;
export const MENU_LIMIT = 5;
export const CHARACTER_LIMIT = 10;

/************************************************
 * 条件判定（ドリンク、デザート、主食、同じタグの個数）
 ************************************************/
export function evaluateCondition(condition, counts) {
    if (!condition || condition === "") return true;

    const match = condition.match(/(drink|dessert|main|sameTag)\s*>=\s*(\d+)/);
    if (!match) return false;

    const key = match[1];
    const value = Number(match[2]);

    return (counts[key] || 0) >= value;
}

/************************************************
 * メニューの属性集計
 ************************************************/
export function buildMenuStats(menuSet) {
    const stats = { drink: 0, dessert: 0, main: 0, sameTag: 0 };
    const tagCount = {};

    for (const menu of menuSet) {
        if (menu.type === "drink") stats.drink++;
        if (menu.type === "dessert") stats.dessert++;
        if (menu.type === "main") stats.main++;

        tagCount[menu.type] = (tagCount[menu.type] || 0) + 1;
    }

    stats.sameTag = Math.max(0, ...Object.values(tagCount));
    return stats;
}

/************************************************
 * 有効なスキルの取得
 ************************************************/
export function getActiveSkills(selectedCharacters, menuStats) {
    const activeSkills = [];

    for (const charInput of selectedCharacters) {
        const charSkills = SKILLS.filter(
            skill => skill.character === charInput.name && skill.slot <= charInput.unlocked
        );

        for (const skill of charSkills) {
            if (evaluateCondition(skill.condition, menuStats)) {
                activeSkills.push(skill);
            }
        }
    }
    return activeSkills;
}

/************************************************
 * 時給・売上計算（メインロジック）
 ************************************************/
export function calculateRevenue(menuSet, selectedCharacters, activeMaterialBuffs) {
    const menuStats = buildMenuStats(menuSet);
    const activeSkills = getActiveSkills(selectedCharacters, menuStats);

    let fixedPriceBonus = 0;
    let revenuePercent = 0; // キャラによる全体の割合バフ合計
    let customerPercent = 0;
    let customerFlat = 0;

    // スキル効果を分類・合算
    for (const skill of activeSkills) {
        switch (skill.type) {
            case "fixed_price":
                fixedPriceBonus += Number(skill.value);
                break;
            case "revenue_percent":
                revenuePercent += Number(skill.value); // 全製品にかかる倍率として合算
                break;
            case "customer_percent":
                customerPercent += Number(skill.value);
                break;
            case "customer_flat":
                customerFlat += Number(skill.value);
                break;
        }
    }

    // 集客倍率の計算（実測値ズレ補正込み）
    const rawCustomers = BASE_CUSTOMERS * (1 + customerPercent) + customerFlat;
    let finalCustomers = Math.round(rawCustomers);
    if (customerPercent > 0 || customerFlat > 0) {
        finalCustomers += 1; // 2505 → 2506 への実測補正
    }
    const customerMultiplier = finalCustomers / BASE_CUSTOMERS;

    let totalRevenue = 0;
    const itemResults = [];

    for (const menu of menuSet) {
        let materialBonus = 0;

        // 【仕様通り】特定の原材料が含まれているメニューのみ +0.75
        const hasBuffMaterial = (menu.materials || []).some(
            material => activeMaterialBuffs.includes(material)
        );
        if (hasBuffMaterial) {
            materialBonus += 0.75;
        }

        // 1. 最終単価の算出（基礎単価 ＋ 固定バフ ＋ 対象なら原材料バフ）
        const finalPrice = menu.price + fixedPriceBonus + materialBonus;

        // 2. 商品表示値（基礎）にする
        let itemRevenue = finalPrice * 24;

        // 3. 【仕様通り】割合バフ（レクイエム等）を「全製品」に適用
        itemRevenue *= (1 + revenuePercent);

        // 4. 集客補正の反映
        itemRevenue *= customerMultiplier;

        // メニューごとの時給を小数点第2位で丸める
        itemRevenue = Math.round(itemRevenue * 100) / 100;
        totalRevenue += itemRevenue;

        itemResults.push({
            name: menu.name,
            revenue: itemRevenue
        });
    }

    return {
        revenue: Math.round(totalRevenue * 100) / 100,
        itemResults,
        activeSkills,
        menuStats
    };
}

/************************************************
 * 組み合わせ生成
 * ************************************************/
export function combinations(arr, k) {
    const result = [];
    function helper(start, current) {
        if (current.length === k) {
            result.push([...current]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            current.push(arr[i]);
            helper(i + 1, current);
            current.pop();
        }
    }
    helper(0, []);
    return result;
}