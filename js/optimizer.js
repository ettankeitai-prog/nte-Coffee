// optimizer.js

export const BASE_CUSTOMERS = 2400;
export const MENU_LIMIT = 5;
export const CHARACTER_LIMIT = 10;

/************************************************
 * 条件判定
 ************************************************/
export function evaluateCondition(condition, counts) {

    if (!condition || condition === "") {
        return true;
    }

    const match =
        condition.match(
            /(drink|dessert|main|sameTag)\s*>=\s*(\d+)/
        );

    if (!match) {
        return false;
    }

    const key = match[1];
    const value = Number(match[2]);

    return (counts[key] || 0) >= value;
}

/************************************************
 * メニュー集計
 ************************************************/
export function buildMenuStats(menuSet) {

    const stats = {
        drink: 0,
        dessert: 0,
        main: 0,
        sameTag: 0
    };

    const tagCount = {};

    for (const menu of menuSet) {

        if (menu.type === "drink") {
            stats.drink++;
        }

        if (menu.type === "dessert") {
            stats.dessert++;
        }

        if (menu.type === "main") {
            stats.main++;
        }

        tagCount[menu.type] =
            (tagCount[menu.type] || 0) + 1;
    }

    stats.sameTag =
    Math.max(
        0,
        ...Object.values(tagCount)
    );

    return stats;
}

/************************************************
 * 有効スキル取得
 ************************************************/
export function getActiveSkills(
    selectedCharacters,
    skills,
    menuStats
) {

    const activeSkills = [];

    for (const character of selectedCharacters) {

        const charSkills =
            skills.filter(
                skill =>
                    skill.character === character.name &&
                    skill.level <= character.unlocked
            );

        for (const skill of charSkills) {

            if (
                evaluateCondition(
                    skill.condition,
                    menuStats
                )
            ) {
                activeSkills.push(skill);
            }
        }
    }

    return activeSkills;
}

/************************************************
 * 時給計算
 ************************************************/
export function calculateRevenue(
    menuSet,
    selectedCharacters,
    skills,
    activeMaterialBuffs
) {

    const menuStats =
        buildMenuStats(menuSet);

    const activeSkills =
        getActiveSkills(
            selectedCharacters,
            skills,
            menuStats
        );

    let fixedPriceBonus = 0;
    let revenuePercent = 0;
    let customerPercent = 0;
    let customerFlat = 0;

    for (const skill of activeSkills) {

        switch (skill.type) {

            case "fixed_price":
                fixedPriceBonus += Number(skill.value);
                break;

            case "revenue_percent":
                revenuePercent += Number(skill.value);
                break;

            case "customer_percent":
                customerPercent += Number(skill.value);
                break;

            case "customer_flat":
                customerFlat += Number(skill.value);
                break;
        }
    }

    const customerMultiplier =
        (
            BASE_CUSTOMERS *
            (1 + customerPercent)
            + customerFlat
        ) / BASE_CUSTOMERS;

    let totalRevenue = 0;

    const itemResults = [];

    for (const menu of menuSet) {

        let materialBonus = 0;

        const hasBuffMaterial =
    (menu.materials || []).some(
        material =>
            activeMaterialBuffs.includes(material)
    );

        if (hasBuffMaterial) {
            materialBonus += 0.75;
        }

        const finalPrice =
            menu.price +
            fixedPriceBonus +
            materialBonus;

        let itemRevenue =
            finalPrice * 24;

        itemRevenue *=
            (1 + revenuePercent);

        itemRevenue *=
            customerMultiplier;

        totalRevenue += itemRevenue;

        itemResults.push({
            name: menu.name,
            revenue:
                Math.round(itemRevenue * 100) / 100
        });
    }

    return {
        revenue:
            Math.round(totalRevenue * 100) / 100,
        itemResults,
        activeSkills,
        menuStats
    };
}

/************************************************
 * 組み合わせ生成
 ************************************************/
export function combinations(arr, k) {

    const result = [];

    function helper(start, current) {

        if (current.length === k) {
            result.push([...current]);
            return;
        }

        for (
            let i = start;
            i < arr.length;
            i++
        ) {

            current.push(arr[i]);

            helper(
                i + 1,
                current
            );

            current.pop();
        }
    }

    helper(0, []);

    return result;
}

/************************************************
 * 最適編成探索
 ************************************************/
export function findBestBuild(
    menus,
    characters,
    skills,
    activeMaterialBuffs,
    topN = 10
) {

    const usableCharacters =
        characters.filter(
            c => c.unlocked > 0
        );

    const menuCombos =
        combinations(
            menus,
            MENU_LIMIT
        );

    const charCount =
        Math.min(
            CHARACTER_LIMIT,
            usableCharacters.length
        );

    const characterCombos =
        combinations(
            usableCharacters,
            charCount
        );

    const bestResults = [];

    for (const menuSet of menuCombos) {

        for (const characterSet of characterCombos) {

            const result =
                calculateRevenue(
                    menuSet,
                    characterSet,
                    skills,
                    activeMaterialBuffs
                );

            bestResults.push({
                revenue: result.revenue,
                menus: menuSet,
                characters: characterSet,
                activeSkills: result.activeSkills,
                itemResults: result.itemResults
            });
        }
    }

    bestResults.sort(
        (a, b) =>
            b.revenue - a.revenue
    );

    return bestResults.slice(
        0,
        topN
    );
}
/************************************************
 * 結果表示用
 ************************************************/
export function formatBuild(build) {

    return {
        revenue: build.revenue,

        menus:
            build.menus.map(
                m => m.name
            ).join(" / "),

        characters:
            build.characters.map(
                c => c.name
            ).join(" / "),

        skillCount:
            build.activeSkills.length
    };
}