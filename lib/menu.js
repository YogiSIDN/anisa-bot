const fs = require("fs")
const chalk = require("chalk")

exports.faq = faq = (prefix, getGreeting, pushName) => {
	return `👋 (❤ω❤) ${getGreeting()} ${pushName}

Dukung saya dengan cara ikuti saluran whatsapp dibawah:
https://whatsapp.com/channel/0029Vaxi9HT9sBIGdOjcP815

Berikut adalah pertanyaan yang sering ditanyakan:

== *Tentang BOT* ==

Q: Namamu siapa ?
	A: Yue Deviluke ❤❤

Q: Itu nama asli kamu ?
	A: Ya bukanlah XD. Itu nama dari karakter anime.

Q: Apakah kamu manusia ?
	A: Iya, saya keduanya

Q: Siapa nama asli kamu ?
	A: Di google banyak. HAHAHA!

== *Peraturan* ==

1) Dilarang keras menelpon bot!

2) Dilarang spaming dan Gunakan akal sehat saat menggunakan perintah bot.

3) Dilarang menggunakan perintah yang tidak ada didalam daftar ${prefix}help atau ${prefix}menu.

4) Jika kamu ke Blocked atau ingin mengobrol dengan Pengembang, kamu bisa bergabung ke dalam Group Bot Support kami dengan cara ${prefix}support.

== *Pertanyaan dan Jawaban* ==

Q: Bagaimana caranya saya menambahkan bot kedalam group ?
	A: Mudah, Kirim link tautan group kalian pada bot, Tunggu 1 sampai 2 menit bot akan masuk ke group kamu.

Q: Bagaimana bot ini bekerja ?
	A: Sebenarnya sangat mudah, semua daftar perintah ada didalam ${prefix}help atau ${prefix}menu beserta cara menggunakannya. Kami meningkatkan perintah seiring berjalannya waktu.

Q: Kenapa bot tidak bisa dipakai melalui pesan pribadi ?
	A: Karena aturan whatsapp kami tidak bisa menyimpan kontak orang banyak jadi kamu hanya bisa menggunakannya didalam group.

Q: Ada beberapa perintah yang hilang atau tidak bekerja kenapa begitu ?
	A: Biasanya karena banyak yang menggunakannya atau perintahnya kami hapus.

Q: Kenapa bot mengirim iklan, dan bagaimana cara mematikannya ?
	A: Kami juga tidak suka iklan tapi kami harus bayar biaya server, dan untuk saat ini iklan yang terdapat pada bot tidak dapat dimatikan.

Q: Apa saja Tipe pengguna yang ada? Dan gimana cara meningkatkannya?
	A: Terdapat 3 Tipe pengguna yaitu:

Tipe: Free
Tipe: Pro
Tipe: Unlimited

Untuk saat ini Tipe pengguna hanya sekedar formalitas dan masih dalam tahap pengembangan.`
}

exports.menu = menu = (prefix, getGreeting, pushName) => {
    return `👋 (❤ω❤) ${getGreeting()} ${pushName}

Dukung saya dengan cara ikuti saluran whatsapp dibawah:
https://whatsapp.com/channel/0029Vaxi9HT9sBIGdOjcP815

Rest API tanpa batas:
https://rest.api-otakuwibu.my.id

━━❰･Bagian📮Catatan･❱━━

*Hentai DIFILTER tetapi sekarang Anda dapat mengaktifkanya*

Nama saya adalah Kaguya Deviluke ❤❤

Awalan saya adalah ${prefix}


1 | Dilarang keras menelpon bot!

2 | Dilarang spaming dan Gunakan akal sehat saat menggunakan perintah bot.

3 | Dilarang menggunakan perintah yang tidak ada didalam daftar ${prefix}help atau ${prefix}menu.


━━❰･Bagian🤖Bot･❱━━

1 | ${prefix}help / ${prefix}menu
*Info:* Memberikan daftar command. 
*Gunakan:* ${prefix}help. / ${prefix}menu.
*Contoh:* ${prefix}help / ${prefix}menu

2 | ${prefix}faq
*Info:* Memberikan pertanyaan yang sering ditanyakan. 
*Gunakan:* ${prefix}faq. 
*Contoh:* ${prefix}faq

3 | ${prefix}support
*Info:* Memberikan link Bot support kami. 
*Gunakan:* ${prefix}support. 
*Contoh:* ${prefix}support

━━❰･Bagian🎓Pengguna･❱━━

1 | ${prefix}info
*Info:* Memberikan info grup. 
*Gunakan:* ${prefix}info. 
*Contoh*: ${prefix}info

2 | ${prefix}enhance
*Info:* Meningkatkan kualitas 2x hingga 4x. 
*Gunakan:* balas atau kirim gambar dan ketik ${prefix}enhance.
~*Persyaratan:* Tingkat 5 diperlukan.~
*Contoh:* ${prefix}enhance

3 | ${prefix}trigger
*Info:* Mengubah gambar ke stiker trigger. 
*Gunakan:* ${prefix}trigger balas gambar yang ingin di ubah. 
*Contoh:* ${prefix}trigger

4 | ${prefix}patpat
*Info:* Mengubah gambar ke stiker petpet. 
*Gunakan:* ${prefix}patpat balas gambar yang ingin di ubah. 
*Contoh:* ${prefix}patpat

5 | ${prefix}sticker
*Info:* Mengubah gambar ke sticker. 
*Gunakan:* ${prefix}sticker balas gambar yang ingin di ubah.
*Contoh:* ${prefix}sticker, ${prefix}sticker author-pack

6 | ${prefix}getimage
*Info:* Menjadikan sticker menjadi gambar atau gif. 
*Gunakan:* balas sticker yang ingin di jadikan gambar atau gif dan ketik ${prefix}getimage.
*Contoh:* ${prefix}getimage

━━❰･Bagian🎩Admin Group･❱━━

1 | ${prefix}active
*Info:* Aktifkan grup baru. 
*Gunakan:* ${prefix}active. 
*Contoh:* ${prefix}active

2 | ${prefix}icon
*Info:* mengubah profile grup berdasarkan gambar yang balas atau kirim. 
*Gunakan:* ${prefix}icon dan balas atau kirim gambar. 
*Contoh:* ${prefix}icon 

3 | ${prefix}delete
*Info:* Menghapus pesan bot atau pengguna. 
*Gunakan:* balass pesan bot atau pesan pengguna dan ketik ${prefix}delete
*Contoh:* ${prefix}delete

4 | ${prefix}close
*Info:* Menutup grup atau mengubah menjadi khusus admin.
*Gunakan:* ${prefix}close Untuk menutup grup, ketik ${prefix}close false untuk membuka grup. 
*Contoh:* ${prefix}close, ${prefix}close false

5 | ${prefix}leave
*Info:* Membuat Bot keluar dari grup. 
*Gunakan:* ${prefix}leave. 
*Contoh:* ${prefix}leave

6 | ${prefix}grouplink
*Info:* Memberikan link grup. 
*Gunakan:* ${prefix}grouplink. 
*Contoh:* ${prefix}grouplink

7 | ${prefix}add
*Info:* Menambahkan pengguna ke grup. 
*Gunakan:* ${prefix}add dan tulis nomornya atau Balas pesan pengguna. 
*Contoh:* ${prefix}add 62665***, ${prefix}add Balas pesan pengguna

8 | ${prefix}remove
*Info:* Kick pengguna dari grup. 
*Gunakan:* ${prefix}remove dan balas pengguna yang ingin dikick. 
*Contoh:* ${prefix}remove @pengguna, ${prefix}remove Balas pesan pengguna 

9 | ${prefix}revoke
*Info:* Mereset link grup. 
*Gunakan:* ${prefix}revoke. 
*Contoh:* ${prefix}revoke

10 | ${prefix}promote
*Info:* Mengubah member menjadi admin. 
*Gunakan:* ${prefix}promote tag pengguna, Balas pesan pengguna. 
*Contoh:* ${prefix}promote @pengguna ${prefix}promote Balas pesan pengguna

11 | ${prefix}demote 
*Info:* Mengubah admin menjadi member. 
*Gunakan:* ${prefix}demote dan tag pengguna, Balas pesan pengguna. 
*Contoh:* ${prefix}demote @pengguna, ${prefix}demote Balas pesan pengguna

12 | ${prefix}ping
*Info:* Tag semua member dalam grup. 
*Gunakan:* ${prefix}ping Hi guys,  
*Contoh:* ${prefix}ping Hi guys 

~13 | ${prefix}register & ${prefix}unregister~
*Info:* Mengaktifkan & nonaktifkan fitur dalam grup. 
*Gunakan:* "${prefix}register fitur" untuk mengaktifkan, "${prefix}unregister fitur" untuk nonaktifkan. 
*Contoh:* 
${prefix}register rule 
${prefix}register games
${prefix}register hentai
${prefix}register farewell
${prefix}register welcome
${prefix}register delete-message
${prefix}register react-message

*Untuk menonaktifkan ketik* ${prefix}unregister

~14 | ${prefix}mute & ${prefix}unmute~
*Info:* Mem-bisukan & me-nonbisukan bot dalam grup.
*Gunakan:* ${prefix}mute, ${prefix}unmute
*Contoh:* ${prefix}mute, untuk mem-bisukan bot & ${prefix}unmute, untuk me-nonbisukan bot.

━━❰･Bagian🎌Anime･❱━━

1 | ${prefix}anime
*Info:* Memberikan daftar info anime yang diinginkan. 
*Gunakan:* ${prefix}anime. 
*Contoh:* ${prefix}anime Naruto

2 | ${prefix}aid
*Info:* Memberikan info detail tentang anime yang diinginkan. 
*Gunakan:* ${prefix}aid 
*Contoh:* ${prefix}aid 1735

3 | ${prefix}manga
*Info:* Memberikan daftar info manga yang diinginkan. 
*Gunakan:* ${prefix}manga. 
*Contoh:* ${prefix}manga Naruto

4 | ${prefix}mid
*Info:* Memberikan info detail tentang manga yang diinginkan.
*Gunakan:* ${prefix}mid.
*Contoh:* ${prefix}mid 21

5 | ${prefix}character 
*Info:* Memberikan daftar info karakter yang diinginkan. 
*Gunakan:* ${prefix}character 
*Contoh:* ${prefix}character Akami

6 | ${prefix}charid 
*Info:* Memberikan info detail tentang karakter yang diinginkan. 
*Gunakan:* ${prefix}charid
*Contoh:* ${prefix}charid 61

7 | ${prefix}treanime
*Info:* Memberikan info mengenai anime yang sedang trending. 
*Gunakan:* ${prefix}treanime
*Contoh:* ${prefix}treanime

8 | ${prefix}tremanga
*Info:* Memberikan info mengenai manga yang sedang trending. 
*Gunakan:* ${prefix}tremanga
*Contoh:* ${prefix}tremanga

9 | ${prefix}charts
*Info:* Memberikan daftar info mengenai episode terbaru anime secara realtime. 
*Gunakan:* ${prefix}charts
*Contoh:* ${prefix}charts

10 | ${prefix}komiku
*Info:* Memberikan daftar manga, detail, dan download pdf per bab.
*Gunakan:* ${prefix}komiku. 
*Contoh:* ${prefix}komiku spy x family
Perintah komiku meliputi:
${prefix}komiku <query>
${prefix}komiku details <link>
${prefix}komiku downloads <link_chapter>

11 | ${prefix}loli
*Info:* Dapatkan Loli secara Acak. 
*Gunakan:* ${prefix}loli. 
*Contoh:* ${prefix}loli

12 | ${prefix}neko
*Info:* Dapatkan Cat Girl secara Acak. 
*Gunakan:* ${prefix}neko. 
*Contoh:* ${prefix}neko

13 | ${prefix}waifu
*Info:* Dapatkan Waifu secara Acak dari (mywaifulist.moe) .
*Gunakan:* ${prefix}waifu. 
*Contoh:* ${prefix}waifu

14 | ${prefix}maid
*Info:* Dapatkan Maid secara Acak.
*Gunakan:* ${prefix}maid. 
*Contoh:* ${prefix}maid

15 | ${prefix}uniform
*Info:* Dapatkan School Girl secara Acak.
*Gunakan:* ${prefix}uniform. 
*Contoh:* ${prefix}uniform

━━❰･Bagian🤳Media･❱━━

1 | ${prefix}pinterest
*Info:* Mencari gambar dari (pinterest.com)
*Gunakan:* ${prefix}pinterest. 
*Contoh:* ${prefix}pinterest kaguya shinomiya

2 | ${prefix}subreddit
*Info:* Mencari gambar dari (reddit.com). 
*Gunakan:* ${prefix}subreddit. 
*Contoh:* ${prefix}subreddit AnimeWallpaper

3 | ${prefix}youtube & ${prefix}soundcloud
*Info:* Cari di YouTube & SoundCloud. 
*Gunakan:* ${prefix}youtube, ${prefix}soundcloud
*Contoh:* ${prefix}youtube BAND-MAID Sense, ${prefix}soundcloud BAND-MAID Sense 

4 | ${prefix}mp3 & ${prefix}mp4 
*Info:* Unduh mp3 & mp4 dari SoundCloud, Spotify, Tiktok, dan YouTube. 
*Penggunaan:* Dapatkan tautan untuk mengunduh dan ketik ${prefix}mp3 & mp4. Untuk mendapatkan audio dari video Anda dapat membalas dengan pesan & waktu tertentu. 
*Contoh:* ${prefix}mp3 https://youtu.be/xxxxxx, ${prefix}mp4 https://youtu.be/xxxxxx Contoh 2: ${prefix}mp3 {balas dengan pesan audio}.
*Catatan* Untuk memperbaiki masalah judul mp3, tambahkan -doc ke ${prefix}mp3 dan file akan dikirim sebagai dokumen.

━━❰･Bagian🎳Permainan･❱━━

1 | ${prefix}flip 
*Info:* Lempar koin. 
*Gunakan:* ${prefix}flip. 
*Contoh:* ${prefix}flip

2 | ${prefix}dice
*Info:* Lempar dadu. 
*Gunakan:* ${prefix}dice.
*Contoh:* ${prefix}dice

3 | ${prefix}guess
*Info:* Tebak angka 1 sampai 50. 
*Gunakan:* ${prefix}guess.
*Contoh:* ${prefix}guess

    •━━━ ✽ • ✽ ━━━•

Ada beberapa perintah yang tidak ada di menu, dan beberapa perintah menggunakan level, kamu bisa menggunakannya jika level kamu tinggi. Hubungi pengembang saya untuk rincian lebih lanjut.`
}


let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.bold.yellow("menu.js di perbarui.."));
  delete require.cache[file];
  require(file);
});