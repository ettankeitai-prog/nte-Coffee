export async function loadCsv(path) {

    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(
            `CSV load failed: ${path}`
        );
    }

    const text = await response.text();

    return text
        .trim()
        .split(/\r?\n/)   // ← Windows対応
        .map(row =>
            row
                .split(",")
                .map(cell =>
                    cell.trim()
                )
        );
}