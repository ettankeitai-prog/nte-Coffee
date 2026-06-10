
import { loadCsv } from "./csvLoader.js";
import {
    findBestBuild,
    formatBuild
} from "./optimizer.js";

async function init() {

    // =========================
    // CSVロード
    // =========================
    const menusRaw =
        await loadCsv("./csv/menus.csv");

    const charsRaw =
        await loadCsv("./csv/characters.csv");

    const skillsRaw =
        await loadCsv("./csv/skills.csv");

    // =========================
    // パース（重要）
    // =========================

    const menus = parseMenus(menusRaw);
    const characters = parseCharacters(charsRaw);
    const skills = parseSkills(skillsRaw);

    // =========================
    // UIダミー（後で差し替え）
    // =========================

    const activeMaterials = []; // ← UIで後から入れる

    console.log("Loaded:", {
        menus,
        characters,
        skills
    });

    // =========================
    // 最適化実行
    // =========================

    const results =
        findBestBuild(
            menus,
            characters,
            skills,
            activeMaterials,
            10
        );

    // =========================
    // 表示
    // =========================

    console.log("=== TOP RESULTS ===");

    results.forEach((r, i) => {

        const formatted =
            formatBuild(r);

        console.log(
            `#${i + 1}`,
            formatted
        );
    });
}


/************************************************
 * CSVパース群
 ************************************************/

function parseMenus(rows) {

    const [, ...data] = rows;

    return data.map(r => ({
        name: r[0],
        price: Number(r[1]),
        type: r[2],
        materials: r.slice(3).filter(Boolean)
    }));
}

function parseCharacters(rows) {

    const [, ...data] = rows;

    return data.map(r => ({
        name: r[0],
        unlocked: 3 // ← 仮（後でUI連動）
    }));
}

function parseSkills(rows) {

    const [, ...data] = rows;

    return data.map(r => ({
        character: r[0],
        level: Number(r[1]),
        type: r[2],
        value: Number(r[3]),
        condition: r[4] || ""
    }));
}


/************************************************
 * 起動
 ************************************************/

init();