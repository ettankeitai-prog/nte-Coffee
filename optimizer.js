// optimizer.js
import { MENUS, SKILLS, BUFF_GROUPS } from './data.js';

export const BASE_CUSTOMERS = 2400;
export const MENU_LIMIT = 5;
export const CHARACTER_LIMIT = 10;

export function evaluateCondition(condition, counts) {
    if (!condition || condition === "") return true;
    const match = condition.match(/(drink|dessert|main|sameTag)\s*>=\s*(\d+)/);
    if (!match) return false;
    const key = match[1];
    const value = Number(match[2]);
    return (counts[key] || 0) >= value;
}

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

export function getActiveSkills(selectedCharacters, menuStats) {
    const activeSkills = [];
    for (const charInput of selectedCharacters) {
        const charSkills = SKILLS.filter(
            skill => skill.character === charInput.name && skill.level <= charInput.level
        );
        for (const skill of charSkills) {
            if (skill.type === "none") continue;
            if (evaluateCondition(skill.condition, menuStats)) {
                activeSkills.push(skill);
            }
        }
    }
    return activeSkills;
}

export function calculateRevenue(menuSet, selectedCharacters, activeBuffGroupNames) {
    const menuStats = buildMenuStats(menuSet);
    const activeSkills = getActiveSkills(selectedCharacters, menuStats);

    let fixedPriceBonus = 0;
    let revenuePercent = 0; 
    let customerPercent = 0;
    let customerFlat = 0;

    for (const skill of activeSkills) {
        switch (skill.type) {
            case "fixed_price": fixedPriceBonus += Number(skill.value); break;
            case "revenue_percent": revenuePercent += Number(skill.value); break;
            case "customer_percent": customerPercent += Number(skill.value); break;
            case "customer_flat": customerFlat += Number(skill.value); break;
        }
    }

    const rawCustomers = BASE_CUSTOMERS * (1 + customerPercent) + customerFlat;
    let finalCustomers = Math.round(rawCustomers);
    if (customerPercent > 0 || customerFlat > 0) {
        finalCustomers += 1; 
    }
    const customerMultiplier = finalCustomers / BASE_CUSTOMERS;

    let totalRevenue = 0;
    const itemResults = [];

    // 有効化されているバフグループのデータ配列を取得
    const currentActiveGroups = (BUFF_GROUPS || []).filter(g => activeBuffGroupNames.includes(g.name));

    for (const menu of menuSet) {
        let dynamicBuffBonus = 0;

        // 各メニューに対して、発動中の日次バフをループ判定
        for (const groupDef of currentActiveGroups) {
            if (groupDef.group === "main" || groupDef.group === "drink" || groupDef.group === "dessert") {
                // 大項目の判定
                if (menu.type === groupDef.group) {
                    dynamicBuffBonus += groupDef.add;
                }
            } else {
                // 特殊グループ（果物など）の判定：商品名そのもの、または材料リストに含まれているか
                const hasMatch = (groupDef.items || []).some(targetItem => 
                    menu.name.includes(targetItem) || (menu.materials || []).includes(targetItem)
                );
                if (hasMatch) {
                    dynamicBuffBonus += groupDef.add;
                }
            }
        }

        const finalPrice = menu.price + fixedPriceBonus + dynamicBuffBonus;
        let itemRevenue = finalPrice * 24;
        itemRevenue *= (1 + revenuePercent);
        itemRevenue *= customerMultiplier;

        itemRevenue = Math.round(itemRevenue * 100) / 100;
        totalRevenue += itemRevenue;

        itemResults.push({ name: menu.name, revenue: itemRevenue });
    }

    return {
        revenue: Math.round(totalRevenue * 100) / 100,
        itemResults,
        activeSkills
    };
}

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

export function findBestBuildFast(allMenus, ownedCharacters, activeBuffGroupNames) {
    const menuCombos = combinations(allMenus, 5);
    
    let maxRevenue = -1;
    let bestMenuSet = [];
    let bestCharSet = [];

    for (const menuSet of menuCombos) {
        const menuStats = buildMenuStats(menuSet);
        
        const charScores = ownedCharacters.map(char => {
            const mockSkills = getActiveSkills([char], menuStats);
            let score = 0;
            mockSkills.forEach(s => {
                if (s.type === "fixed_price") score += s.value * 120;
                if (s.type === "customer_flat") score += s.value * 0.5;
                if (s.type === "revenue_percent") score += s.value * 700;
                if (s.type === "customer_percent") score += s.value * 700;
            });
            return { char, score };
        });

        charScores.sort((a, b) => b.score - a.score);
        const topChars = charScores.slice(0, 10).map(x => x.char);

        const result = calculateRevenue(menuSet, topChars, activeBuffGroupNames);
        
        if (result.revenue > maxRevenue) {
            maxRevenue = result.revenue;
            bestMenuSet = menuSet;
            bestCharSet = topChars;
        }
    }

    return {
        revenue: maxRevenue,
        menus: bestMenuSet,
        characters: bestCharSet
    };
}