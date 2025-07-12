const fs = require("fs")
const chalk = require("chalk")
const fetch = require("node-fetch")
const { ytdl } = require("../lib/yt-dlp")
const { APIs, getBuffer } = require("../lib/function")
const { extractImageThumb } = require("baileys")
const { Soundcloud } = require("soundcloud.ts")
const soundcloud = new Soundcloud({
    clientId: process.env.SCLIENT,
    oauthToken: process.env.STOKEN
})

exports.mp4 = async (sock, text, m, args = null) => {
    let isYoutube = text.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    if (!isYoutube) return m.reply("Masukkan link Instagram, Twitter, Tiktok, atau Youtube untuk mengunduh video");

    if (isYoutube) {
        await m.reply("↓Mengunduh: " + text);
        ytdl(text, "mp4", async (res) => {
            const { title, description, url_download, channel, views, duration, filesize } = res;
            const fileSizeMB = filesize ? parseFloat(filesize.split(' MB')[0]) : 0;
            if (fileSizeMB >= 100.00) return m.reply("File sudah melebihi batas maksimal 100 MB!");
            const ytmp4_ = `*Title:* ${title} 
*Uploaded by:* ${channel}
*Duration:* ${duration}
*Views:* ${views}
*Description:* ${description ? `${description}` : ``}`;
            sock.sendMessage(m.chat, { video: url_download, mimetype: 'video/mp4', caption: ytmp4_ }, { quoted: m });
        }).catch((err) => m.reply('💔 Maaf, terjadi kesalahan pada server.'));
    }
};

exports.mp3 = async (sock, text, m, args = null) => {
    let isTiktok = text.match(/(?:https?:\/vt)?(?:w{3}\.)?tiktok.com/);
    let isYoutube = text.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    let isSoundcloud = text.match(/(?:https?:\/{2})?(?:w{3}\.)?soundcloud.com/);
    if (!isYoutube && !isSoundcloud && !isTiktok) return m.reply("Masukan link SoundCloud, Spotify, Tiktok, atau Youtube untuk mengunduh audio");
    
    if (isYoutube) {
        let mode = args[1]
        await m.reply("↓Mengunduh: " + text)
        ytdl(text, "mp3", async (res) => {
            const { id, title, description, url_download, channel, views, duration, filesize } = res
            let maxSize = mode === '-vn' ? 20.00 : 10.00;
            if (filesize.split(' MB')[0] >= maxSize) return m.reply("File sudah melebihi batas maksimal!");
            const ytmp3_ = `*Title:* ${title} 
*Uploaded by:* ${channel}
*Duration:* ${duration}
*Views:* ${views}
*Description:* ${description ? `${description}` : ``}`
            const buffer = await extractImageThumb(await (await fetch("https://i.ytimg.com/vi/" + id + "/hq720.jpg")).buffer());
            if (mode === '-doc') {
                let docmp3 = await sock.sendMessage(m.chat, { document: url_download , mimetype: 'audio/mpeg', fileName: `${title}.mp3`, jpegThumbnail: buffer.buffer }, { quoted: m });
                sock.sendMessage(m.chat, { image: { url: "https://i.ytimg.com/vi/" + id + "/hq720.jpg" }, mimetype: "image/jpeg", caption: ytmp3_ }, { quoted: docmp3 });

            } else if (mode === '-vn') {
                let vnmp3 = await sock.sendMessage(m.chat, { audio: url_download , mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
                sock.sendMessage(m.chat, { image: { url: "https://i.ytimg.com/vi/" + id + "/hq720.jpg" }, mimetype: "image/jpeg", caption: ytmp3_ }, { quoted: vnmp3 });

            } else {
                let mp3 = await sock.sendMessage(m.chat, { audio: url_download, mimetype: 'audio/mpeg' }, { quoted: m });
                sock.sendMessage(m.chat, { image: { url: "https://i.ytimg.com/vi/" + id + "/hq720.jpg" }, mimetype: "image/jpeg", caption: ytmp3_ }, { quoted: mp3 })
            }
        }).catch((err) => m.reply('💔 Maaf, terjadi kesalahan pada server.'))
    } else if (isSoundcloud) {
        try {
            await m.reply("↓Mengunduh: " + text)
            const stream = await soundcloud.util.streamTrack(text);
            const filePath = 'soundcloud.mp3';
            const writeStream = fs.createWriteStream(filePath);
            stream.pipe(writeStream);
            writeStream.on('finish', async () => {
                await sock.sendMessage(m.chat, { audio: { url: filePath }, mimetype: 'audio/mpeg' }, { quoted: m });
                fs.unlinkSync(filePath);
            });
            writeStream.on('error', (err) => {
                console.error(err);
                m.reply('💔 Maaf, terjadi kesalahan saat mengunduh file.');
            });
        } catch (err) {
            console.error(err);
            m.reply('💔 Maaf, terjadi kesalahan pada server.');
        }
    } else if (isTiktok) {
        try {
            await m.reply("↓Mengunduh: " + text)
            const res = await APIs(process.env.AGT + "/api/tiktok?url=" + text)
            const { id, title, url } = res.data.music_info
            const buffer = await getBuffer(url)
            const muss = await sock.sendMessage(m.chat, { audio: buffer, mimetype: "audio/mpeg"}, { quoted: m })
            sock.sendMessage(m.chat, { text: `*Id:* ${id}\n*Title:* ${title}\n\n${text}`}, { quoted: muss })
        } catch (err) {
            console.error(err);
            m.reply('💔 Maaf, terjadi kesalahan pada server.');
        }
    }
}

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.bold.yellow("download.js di perbarui.."));
  delete require.cache[file];
  require(file);
});