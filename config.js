// ============================================================
//  CONFIG.JS — カスタマイズファイル
//  このファイルだけ編集すればサイトの内容が更新されます。
// ============================================================

const CONFIG = {

  // ----------------------------------------------------------
  //  基本情報
  // ----------------------------------------------------------
  siteName:     "YOUR NAME",           // サイト名・作家名（ナビとヒーローに表示）
  tagline:      "Art & Photography",   // キャッチフレーズ
  storesUrl:    "https://yourname.stores.jp",           // STORESショップURL
  instagramUrl: "https://instagram.com/yourname",       // Instagram URL（不要なら "" に）

  // ----------------------------------------------------------
  //  ヒーローセクション（トップ画面）
  //  backgroundImage: トップに薄く敷く背景画像パス
  //  不要なら "" のままで純粋タイポグラフィになります
  // ----------------------------------------------------------
  hero: {
    backgroundImage: "", // 例: "images/hero.jpg"
  },

  // ----------------------------------------------------------
  //  About セクション
  // ----------------------------------------------------------
  about: {
    photo: "",  // アーティスト写真パス。例: "images/artist.jpg"  不要なら ""
    bio: `ここに作家紹介文を書いてください。<br><br>
複数の段落を入れることもできます。`,
  },

  // ----------------------------------------------------------
  //  作品リスト
  //  ▼ 作品を追加するときは { } ブロックをコピーして増やしてください
  //  category は "原画" / "写真作品" / "グッズ" のいずれかを推奨
  //  (別の文字列でも可 — フィルターボタンに自動反映されます)
  //  sold: true にすると SOLD 表示になりSTORESリンクが無効化されます
  // ----------------------------------------------------------
  works: [
    {
      id: 1,
      title: "Untitled No.01",
      category: "原画",
      medium: "Oil on canvas",
      size: "600 × 800 mm",
      year: "2024",
      price: "¥50,000",
      image: "images/work-01.jpg",
      storesUrl: "https://yourname.stores.jp/items/xxxxx",
      sold: false,
    },
    {
      id: 2,
      title: "Untitled No.02",
      category: "原画",
      medium: "Acrylic on canvas",
      size: "455 × 530 mm",
      year: "2024",
      price: "¥38,000",
      image: "images/work-02.jpg",
      storesUrl: "https://yourname.stores.jp/items/yyyyy",
      sold: false,
    },
    {
      id: 3,
      title: "Series I — Red",
      category: "写真作品",
      medium: "Archival Pigment Print",
      size: "A3",
      year: "2024",
      price: "¥12,000",
      image: "images/work-03.jpg",
      storesUrl: "https://yourname.stores.jp/items/zzzzz",
      sold: false,
    },
    {
      id: 4,
      title: "Series I — Black",
      category: "写真作品",
      medium: "Archival Pigment Print",
      size: "A3",
      year: "2024",
      price: "¥12,000",
      image: "images/work-04.jpg",
      storesUrl: "https://yourname.stores.jp/items/aaaaa",
      sold: true,   // ← 売り切れ
    },
    {
      id: 5,
      title: "Postcard Set A",
      category: "グッズ",
      medium: "Postcard",
      size: "148 × 100 mm, 5枚セット",
      year: "2024",
      price: "¥1,200",
      image: "images/work-05.jpg",
      storesUrl: "https://yourname.stores.jp/items/bbbbb",
      sold: false,
    },
  ],

  // ----------------------------------------------------------
  //  カラー設定
  //  アクセントカラーのみ変更可。基本は赤 #cc0000
  // ----------------------------------------------------------
  colors: {
    accent: "#cc0000",
  },

};
