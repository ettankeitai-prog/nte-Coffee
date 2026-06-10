
import { loadCsv } from "./csvLoader.js";
import {
    findBestBuild,
    formatBuild
} from "./optimizer.js";

async function init() {

    const menusRaw =
        await loadCsv("./csv/menus.csv");

    const charsRaw =
        await loadCsv("./csv/characters.csv");

    const skillsRaw =
        await loadCsv("./csv/skills.csv");

    const menus = parseMenus(menusRaw);
    const characters = parseCharacters(charsRaw);
    const skills = parseSkills(skillsRaw);

    // ⭐ ここ重要（DOM保証）
    if (document.readyState === "loading") {
        await new Promise(resolve =>
            document.addEventListener("DOMContentLoaded", resolve)
        );
    }

    renderMaterials(menus);
    renderCharacters(characters);

    console.log("Loaded:", { menus, characters, skills });

    const activeMaterials = [];

    const results =
        findBestBuild(
            menus,
            characters,
            skills,
            activeMaterials,
            10
        );

    console.log("=== TOP RESULTS ===");

    results.forEach((r, i) => {

        console.log(`#${i + 1}`, formatBuild(r));
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

/************************************************
 * UI生成Materials
 ************************************************/
function renderMaterials(menus) {

    const materials =
        new Set(
            menus.flatMap(m => m.materials)
        );

    const area =
        document.getElementById("materialArea");

    area.innerHTML = "";

    materials.forEach(mat => {

        const label = document.createElement("label");

        label.innerHTML = `
            <input type="checkbox" value="${mat}">
            ${mat}
        `;

        area.appendChild(label);
    });
}
/************************************************
 * UI生成Characters
 ************************************************/
function renderCharacters(chars) {

    const area =
        document.getElementById("characterArea");

    area.innerHTML = "";

    chars.forEach(c => {

        const div = document.createElement("div");

        div.innerHTML = `
            ${c.name}
            <input type="number"
                min="0"
                max="3"
                value="3"
                data-name="${c.name}">
        `;

        area.appendChild(div);
    });
}