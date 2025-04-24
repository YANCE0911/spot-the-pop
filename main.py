from spotipy.oauth2 import SpotifyClientCredentials
import spotipy

# 認証
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id="ef03ba8e7cd84e9ba3dbbb08193528b0",
    client_secret="83b6180b09d04e73a417297691387fc5"
))

# popularity取得関数
def get_popularity(artist_name):
    result = sp.search(q=artist_name, type="artist", limit=1)
    items = result["artists"]["items"]
    if not items:
        return None, None
    artist = items[0]
    return artist["name"], artist["popularity"]

# ゲーム開始
base_name = input("🎯 お題のアーティスト名は？：")
base_artist, base_pop = get_popularity(base_name)

if base_pop is None:
    print("⚠️ お題アーティストが見つかりませんでした")
    exit()

print(f"🎵 お題：{base_artist}（popularity {base_pop}）")

# プレイヤー入力（今回は3人）
players = []
for i in range(3):
    guess = input(f"👤 プレイヤー{i+1}のアーティスト名：")
    name, pop = get_popularity(guess)
    if pop is None:
        print("⚠️ 見つからなかったのでスキップ")
        continue
    diff = abs(pop - base_pop)
    players.append((name, pop, diff))

# 結果発表
if not players:
    print("😢 有効なエントリーがありませんでした")
else:
    players.sort(key=lambda x: x[2])  # 差が小さい順
    print("\n🏆 結果発表")
    for name, pop, diff in players:
        print(f"{name}: popularity {pop}（差：{diff}）")

    winner = players[0]
    print(f"\n🎉 優勝：{winner[0]}（popularity {winner[1]}）")
