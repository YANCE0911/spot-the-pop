// lib/fetchPopularityBatch.ts
import { getSpotifyToken } from './spotify';
import fs from 'fs';

const artistNames = [
    // 日本のメジャー・ロックアーティスト
    "米津玄師", "King Gnu", "RADWIMPS", "Official髭男dism", "あいみょん",
    "BUMP OF CHICKEN", "back number", "Mrs. GREEN APPLE", "SEKAI NO OWARI", "ヨルシカ",
    "Aimer", "緑黄色社会", "ずっと真夜中でいいのに。", "KANA-BOON", "ポルカドットスティングレイ",
    "マカロニえんぴつ", "UNISON SQUARE GARDEN", "スピッツ", "サカナクション", "フジファブリック",
    "くるり", "ASIAN KUNG-FU GENERATION", "the pillows", "ELLEGARDEN", "10-FEET",
    "SiM", "coldrain", "MAN WITH A MISSION", "ONE OK ROCK", "BLUE ENCOUNT",
    "TOTALFAT", "Nothing's Carved In Stone", "the band apart", "Base Ball Bear",
    "NICO Touches the Walls", "cinema staff", "凛として時雨", "ART-SCHOOL",
    "ACIDMAN", "RADIO FISH", "サンボマスター", "モンゴル800", "ORANGE RANGE",
    "Hi-STANDARD", "銀杏BOYZ", "チャットモンチー", "SHISHAMO", "go!go!vanillas",
    "sumika", "My Hair is Bad", "tacica", "People In The Box", "mol-74",
    "カネコアヤノ", "崎山蒼志", "Rei", "ヒグチアイ", "wacci",
    "Saucy Dog", "Novelbright", "ヤバイTシャツ屋さん", "ネクライトーキー", "クリープハイプ",
    "SUPER BEAVER", "マキシマム ザ ホルモン", "Fear, and Loathing in Las Vegas", "WANIMA",
    "Creepy Nuts", "YOASOBI", "Vaundy", "UVERworld", "LiSA",
    "水樹奈々", "西野カナ", "Uru", "aiko", "椎名林檎",
    "東京事変", "中島みゆき", "中森明菜", "松任谷由実", "安室奈美恵",
    "宇多田ヒカル", "浜崎あゆみ", "藤井風", "星野源", "斉藤和義",
    "槇原敬之", "山下達郎", "小田和正", "徳永英明", "井上陽水",
    "久保田利伸", "福山雅治", "平井堅", "秦基博", "JUJU",
    "絢香", "家入レオ", "いきものがかり", "コブクロ", "ゆず",
    "大塚愛", "MISIA", "Every Little Thing", "ケツメイシ",
    "DREAMS COME TRUE", "モーニング娘。", "Perfume", "BABYMETAL", "ももいろクローバーZ",
    "AKB48", "乃木坂46", "日向坂46", "櫻坂46", "SixTONES",
    "Snow Man", "Hey! Say! JUMP", "King & Prince", "ジャニーズWEST", "三代目 J SOUL BROTHERS",
    "EXILE", "DA PUMP", "CHAGE and ASKA", "ZARD", "FIELD OF VIEW",
    "DEEN", "WANDS", "T-BOLAN", "B'z", "GLAY",
    "L'Arc〜en〜Ciel", "Janne Da Arc", "シド", "the GazettE", "MUCC",
    "PIERROT", "LUNA SEA", "X JAPAN", "BUCK-TICK", "黒夢",
    "SOPHIA", "JUDY AND MARY", "大黒摩季", "相川七瀬",
    "華原朋美", "倉木麻衣", "中島美嘉", "SUPERFLY", "miwa",
    "阿部真央", "YUI", "EGO-WRAPPIN'", "LOVE PSYCHEDELICO", "スガシカオ",
    "BONNIE PINK", "Cocco"
  ];
  
async function main() {
  const token = await getSpotifyToken();
  const results: { name: string; id: string; popularity: number }[] = [];

  for (const name of artistNames) {
    try {
      const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      const artist = data.artists?.items?.[0];

      if (artist) {
        results.push({ name: artist.name, id: artist.id, popularity: artist.popularity });
        console.log(`🎧 ${artist.name} → ${artist.popularity}`);
      } else {
        console.warn(`⚠️ Not found: ${name}`);
      }

    } catch (e) {
      console.error(`❌ Error fetching ${name}:`, e);
    }
  }

  fs.writeFileSync(
    'lib/japaneseArtists.ts',
    `export const LARGE_JAPANESE_ARTISTS = ${JSON.stringify(results, null, 2)};`
  );

  console.log(`✅ 保存完了: ${results.length}組`);
}

main();
