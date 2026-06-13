// data.js

// メニュー（商品）のマスターデータ
export const MENUS = [
    { name: "ココナツラテ", price: 10.20, type: "drink", materials: ["「9℃」コーヒ豆", "ココナッツ"] },
    { name: "アイスモカ", price: 10.60, type: "drink", materials: ["「9℃」コーヒ豆", "ココアパウダー"] },
    { name: "アップルパイ", price: 11.00, type: "dessert", materials: ["小麦粉", "リンゴ"] },
    { name: "トマトエッグクロワッサン", price: 11.40, type: "main", materials: ["小麦粉", "リンゴ", "生卵"] },
    { name: "ツナサンド", price: 11.80, type: "main", materials: ["小麦粉", "レタス", "海の魚"] },
    { name: "琥珀ミルクティー", price: 12.20, type: "drink", materials: ["「9℃」コーヒ豆", "牛乳", "スターキャンディ", "みかん"] },
    { name: "抹茶溶岩ムース", price: 12.60, type: "dessert", materials: ["小麦粉", "牛乳", "抹茶パウダー"] },
    { name: "チョコアイスラテ", price: 13.00, type: "drink", materials: ["「9℃」コーヒ豆", "牛乳", "生クリーム", "ココアパウダー"] },
    { name: "厚切ビーフサンド", price: 13.50, type: "main", materials: ["小麦粉", "新鮮な牛肉", "レタス", "ハードバター"] },
    { name: "小豆バターワッサン", price: 14.00, type: "main", materials: ["小麦粉", "ハードバター", "あんこ"] },
    { name: "イチゴボックスケーキ", price: 14.50, type: "dessert", materials: ["小麦粉", "イチゴ", "生クリーム"] },
    { name: "オレンジ珈琲", price: 15.00, type: "drink", materials: ["「9℃」コーヒ豆", "みかん", "リンゴ"] },
    { name: "カツサンド", price: 15.50, type: "main", materials: ["小麦粉", "タマネギ", "新鮮なぶた肉", "「砂糖or塩」海塩"] },
    { name: "ココナツマキアート", price: 16.00, type: "drink", materials: ["「9℃」コーヒ豆", "牛乳", "ビーンズクッキー", "ココナッツ"] },
    { name: "クリーム抹茶ラテ", price: 16.50, type: "drink", materials: ["「9℃」コーヒ豆", "牛乳", "生クリーム", "抹茶パウダー"] },
    { name: "ティラミス", price: 17.00, type: "dessert", materials: ["小麦粉", "ビーンズクッキー", "「T&J」ブロックチーズ", "「9℃」コーヒ豆"] },
    { name: "ハムワッサン", price: 17.50, type: "main", materials: ["小麦粉", "レタス", "ハム", "チーズ"] },
    { name: "キャラメルココフィー", price: 18.00, type: "dessert", materials: ["小麦粉", "生クリーム", "「砂糖or塩」海塩", "ココアパウダー"] }
];

// キャラクタースキルのマスターデータ (Lv1〜Lv5対応版)
// 時給に関係のないスキルは type: "none" としています。
export const SKILLS = [
    // ミント
    { character: "ミント", level: 1, type: "fixed_price", value: 0.12, condition: "" },
    { character: "ミント", level: 2, type: "none", value: 0, condition: "" },
    { character: "ミント", level: 3, type: "none", value: 0, condition: "" },
    { character: "ミント", level: 4, type: "none", value: 0, condition: "" },
    { character: "ミント", level: 5, type: "fixed_price", value: 0.18, condition: "" },

    // ハニア
    { character: "ハニア", level: 1, type: "fixed_price", value: 0.12, condition: "" },
    { character: "ハニア", level: 2, type: "none", value: 0, condition: "" },
    { character: "ハニア", level: 3, type: "fixed_price", value: 0.12, condition: "" },
    { character: "ハニア", level: 4, type: "none", value: 0, condition: "" },
    { character: "ハニア", level: 5, type: "fixed_price", value: 0.18, condition: "" },

    // ナナリ（ご提示の例：Lv1とLv5のみ時給に関係あり）
    { character: "ナナリ", level: 1, type: "fixed_price", value: 0.20, condition: "main>=1" },
    { character: "ナナリ", level: 2, type: "none", value: 0, condition: "" },
    { character: "ナナリ", level: 3, type: "none", value: 0, condition: "" },
    { character: "ナナリ", level: 4, type: "none", value: 0, condition: "" },
    { character: "ナナリ", level: 5, type: "fixed_price", value: 0.30, condition: "main>=2" },

    // エドガー
    { character: "エドガー", level: 1, type: "customer_flat", value: 18, condition: "" },
    { character: "エドガー", level: 2, type: "none", value: 0, condition: "" },
    { character: "エドガー", level: 3, type: "customer_flat", value: 18, condition: "" },
    { character: "エドガー", level: 4, type: "none", value: 0, condition: "" },
    { character: "エドガー", level: 5, type: "customer_flat", value: 27, condition: "" },

    // アドレー
    { character: "アドレー", level: 1, type: "fixed_price", value: 0.12, condition: "" },
    { character: "アドレー", level: 2, type: "none", value: 0, condition: "" },
    { character: "アドレー", level: 3, type: "none", value: 0, condition: "" },
    { character: "アドレー", level: 4, type: "none", value: 0, condition: "" },
    { character: "アドレー", level: 5, type: "fixed_price", value: 0.18, condition: "" },

    // 翳
    { character: "翳", level: 1, type: "customer_flat", value: 18, condition: "" },
    { character: "翳", level: 2, type: "none", value: 0, condition: "" },
    { character: "翳", level: 3, type: "none", value: 0, condition: "" },
    { character: "翳", level: 4, type: "none", value: 0, condition: "" },
    { character: "翳", level: 5, type: "customer_flat", value: 27, condition: "" },

    // ダフォディール
    { character: "ダフォディール", level: 1, type: "customer_flat", value: 18, condition: "" },
    { character: "ダフォディール", level: 2, type: "none", value: 0, condition: "" },
    { character: "ダフォディール", level: 3, type: "none", value: 0, condition: "" },
    { character: "ダフォディール", level: 4, type: "none", value: 0, condition: "" },
    { character: "ダフォディール", level: 5, type: "customer_flat", value: 27, condition: "" },

    // 海月
    { character: "海月", level: 1, type: "fixed_price", value: 0.12, condition: "" },
    { character: "海月", level: 2, type: "customer_percent", value: 0.01, condition: "drink>=2" },
    { character: "海月", level: 3, type: "none", value: 0, condition: "" },
    { character: "海月", level: 4, type: "none", value: 0, condition: "" },
    { character: "海月", level: 5, type: "customer_percent", value: 0.015, condition: "drink>=2" },

    // ちぃちゃん
    { character: "ちぃちゃん", level: 1, type: "customer_flat", value: 18, condition: "" },
    { character: "ちぃちゃん", level: 2, type: "none", value: 0, condition: "" },
    { character: "ちぃちゃん", level: 3, type: "none", value: 0, condition: "" },
    { character: "ちぃちゃん", level: 4, type: "none", value: 0, condition: "" },
    { character: "ちぃちゃん", level: 5, type: "customer_flat", value: 27, condition: "" },

    // 早霧
    { character: "早霧", level: 1, type: "fixed_price", value: 0.12, condition: "" },
    { character: "早霧", level: 2, type: "none", value: 0, condition: "" },
    { character: "早霧", level: 3, type: "none", value: 0, condition: "" },
    { character: "早霧", level: 4, type: "none", value: 0, condition: "" },
    { character: "早霧", level: 5, type: "fixed_price", value: 0.30, condition: "sameTag>=3" },

    // 白蔵
    { character: "白蔵", level: 1, type: "customer_flat", value: 18, condition: "" },
    { character: "白蔵", level: 2, type: "none", value: 0, condition: "" },
    { character: "白蔵", level: 3, type: "none", value: 0, condition: "" },
    { character: "白蔵", level: 4, type: "none", value: 0, condition: "" },
    { character: "白蔵", level: 5, type: "customer_flat", value: 27, condition: "" },

    // レクイエム
    { character: "レクイエム", level: 1, type: "revenue_percent", value: 0.01, condition: "dessert>=1" },
    { character: "レクイエム", level: 2, type: "none", value: 0, condition: "" },
    { character: "レクイエム", level: 3, type: "none", value: 0, condition: "" },
    { character: "レクイエム", level: 4, type: "none", value: 0, condition: "" },
    { character: "レクイエム", level: 5, type: "revenue_percent", value: 0.015, condition: "dessert>=2" },

];

// data.js の末尾にこれを追加（または admin.html から自動出力）
export const BUFF_GROUPS = [
    { name: "主食", group: "main", add: 1.0, items: [] },
    { name: "ドリンク", group: "drink", add: 1.0, items: [] },
    { name: "デザート", group: "dessert", add: 1.0, items: [] },
    { name: "果物", group: "fruit", add: 0.75, items: ["みかん", "イチゴ", "リンゴ", "ココナッツ"] },
    { name: "小麦粉", group: "flour", add: 0.75, items: ["小麦粉"] },
    { name: "「9℃」コーヒ豆", group: "CoffeeBeans", add: 0.75, items: ["「9℃」コーヒ豆"] }
];