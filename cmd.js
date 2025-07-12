require("./lib/menu")
// Module
const { 
    proto,
    areJidsSameUser,
    WAMessageStubType,
    generateWAMessage,
    extractImageThumb,
    generateWAMessageContent,
    generateWAMessageFromContent
} = require("baileys")
const fs = require("fs")
const util = require("util")
const chalk = require("chalk")
const booru = require("booru")
const axios = require("axios")
const yts = require("yt-search")
const cron = require("node-cron")
const parseMs = require("parse-ms")
// const petpet = require("pet-pet-gif") 1.0.9
const { exec } = require("child_process")
const moment = require("moment-timezone")
// const { Swiftcord } = require("swiftcord") 2.1.7
const msc = require("ytmusic_api_unofficial")
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args))
const { Soundcloud } = require("soundcloud.ts")
const soundcloud = new Soundcloud({
    clientId: process.env.SCLIENT,
    oauthToken: process.env.STOKEN
})

// Database
const { Chat } = require("./tools/schema")
const { isGroupLimit, addGroupLimit, getTimeGroup } = require("./lib/limits")

// Lib CLASS Ver.
const Komiku = require("./lib/komiku")
const Upscale = require("./lib/enhance")
const upscale = new Upscale()
const SaveTube = require("./lib/savetube");
const savetube = new SaveTube()
const AniListAPI = require("./lib/search")
const aniClient = new AniListAPI()
const Musixmatch = require("./lib/musixmatch")
const musixmatch = new Musixmatch()

// Lib 
const { ytdl } = require("./lib/yt-dlp")
const { clone } = require("./lib/git-clone")
const { serverStatus } = require("./lib/status")
const { pinterest } = require("./lib/pinterest")
const { create, wcream } = require("./lib/animagine")
const { webpToImage, webpToVideo } = require("./lib/convert")
const { APIs, timeConvert, encodeBase62, decodeBase62, getAdmin, getCountdown, getGreeting, parseMention, sleep, toPdf } = require("./lib/function")

// Tools
const { toUguu } = require("./tools/uploaders")

// Games Side 
const games = new Map()

module.exports = async (sock, m, msg, chatUpdate, store) => {
  try {
    const body = (m.mtype === "conversation" 
        ? m.message.conversation : m.mtype === "imageMessage" 
        ? m.message.imageMessage.caption : m.mtype === "videoMessage" 
        ? m.message.videoMessage.caption : m.mtype === "extendedTextMessage" 
        ? m.message.extendedTextMessage.text : m.mtype === "buttonsResponseMessage" 
        ? m.message.buttonsResponseMessage.selectedButtonId : m.mtype === "listResponseMessage" 
        ? m.message.listResponseMessage.singleSelectReply.selectedRowId : m.mtype === "interactiveMessage" 
        ? m.message.interactiveMessage?.buttonReply?.buttonId : "")
    const content = JSON.stringify(msg.message)
    const jid = m.isGroup ? m.chat : m.sender
    const pName = m.pushName || "Unknown"
    const budy = typeof m.text === "string" ? m.text : ""
    
    //const prefixRegex = /^[#.]/
    //const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : "!"
    //const isCmd = body.startsWith(prefix)
    //const command = isCmd ? body.slice(prefix.length).trim().split(" ").shift().toLowerCase() : ""
    
    const prefix = "!"
    const c = body || ""
    const command = c.toLowerCase().split(" ")[0] || ""
    prefix
    const isCmd = command.startsWith(prefix)
    
    const args = body.trim().split(/ +/).slice(1)
    const text = q = args.join(" ")
    const sender = m.key.fromMe ? sock.user.id.split(":")[0] + "@s.whatsapp.net" || sock.user.id : m.key.participant || m.key.remoteJid
    const ownerNumber = "6281410404318"
    const botNumber = await sock.decodeJid(sock.user.id)
    const senderNumber = sender.split("@")[0]
    const t = moment.tz("Asia/Jakarta").format("DD/MM/YYYY - HH:mm:ss")
    const groupMetadata = m.isGroup ? await sock.groupMetadata(jid) : ""
    const participants = m.isGroup ? await groupMetadata.participants : ""
    const groupAdmins = m.isGroup ? await getAdmin(participants) : ""
    const qd = m.quoted ? m.quoted : m
    const mim = (qd.msg || qd).mimetype || ""
    const isMed = /image|video|sticker|audio/.test(mim)       
		
    // Valifator
    const isDev = m.sender.split("@")[0] === ownerNumber
    const isGroupAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
    const isBotGroupAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
    
    if (isCmd) {
        await sock.sendPresenceUpdate('composing', jid) 
        console.log(chalk.bold.green("[") + chalk.bold.yellow("CMD") + chalk.bold.green("] ") + chalk.bold.blue(t) + " from " + chalk.bold.magenta(senderNumber) + " | " + chalk.bold.green(command));
    }
    
    if (!isCmd && !m.key.fromMe && m.quoted) {
        const inputNumber = parseInt(body);
        if (isNaN(inputNumber)) return;
        
        const lines = m.quoted.text.split('\n');
        const selectedLine = lines.find(line => line.startsWith(`${inputNumber}.`));
        if (!selectedLine) return;
        
        const getNextLine = (index, offset) => lines[index + offset] || null;
        
        const komikuUrl = getNextLine(lines.indexOf(selectedLine), 1)?.match(/https:\/\/komiku\.id[^\s]+/)?.[0];
        const musicUrl = getNextLine(lines.indexOf(selectedLine), 3)?.match(/https:\/\/music\.youtube\.com[^\s]+/)?.[0];
        
        if (musicUrl) {
            ytdl(musicUrl, 'mp3', async ({ title, description, thumbnail, url_download, channel }) => {
                const pmus = await sock.sendMessage(jid, { audio: url_download, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
                sock.sendMessage(jid, {
                    text: description.replace(/Provided to YouTube by [\s\S]*?\n\n/, '').replace(/Auto-generated by YouTube\./, '').trim(),
                    contextInfo: {
                        externalAdReply: {
                            title,
                            body: channel.replace(' - Topic', ''),
                            thumbnailUrl: thumbnail,
                            sourceUrl: 'https://music.youtube.com',
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: pmus });
            });
        }
        
        if (komikuUrl) {
            const cd = await Chat.findOne({ chatId: jid });
            if (cd.komiku) return m.reply("⚠️ Sesi unduh sebelumnya belum selesai.");
            cd.komiku = true;
            await cd.save();
            try {
                const result = await Komiku.fetchChapters(komikuUrl);
                const buffer = await extractImageThumb(await (await fetch(result.result.cover)).buffer());
                const pages = result.result.chapters.map((v) => v);
                const imagepdf = await toPdf(pages);
                await sock.sendMessage(jid, { document: imagepdf, mimetype: 'application/pdf', fileName: `${result.result.title}.pdf`, pageCount: pages.length, jpegThumbnail: buffer.buffer }, { quoted: m });
            } catch {
                m.reply('💔 Maaf, Sepertinya ada yang salah.');
            } finally {
                cd.komiku = false;
                await cd.save();
            }
        }
    }
    
    async function Print(text) {
        return await sock.sendMessage(jid, { text: JSON.stringify(text, null, 4) })
    }
    
    function formatUptimeServer() {
        const uptimeData = fs.readFileSync('/proc/uptime', 'utf8'); // Baca uptime dari /proc/uptime
        const uptimeSeconds = parseFloat(uptimeData.split(' ')[0]); // Ambil waktu uptime dalam detik
                
        const minutes = Math.floor(uptimeSeconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
            
        const remainingHours = hours % 24;
        const remainingMinutes = minutes % 60;
            
        return `${days} day(s), ${remainingHours} hour(s), ${remainingMinutes} minute(s)`;
    }
    
    const groupTimeReason = (rtime) => {
        const durationObject = parseMs(rtime - new Date().getTime(), { long: true, secondsDecimalDigits: 0 });
        return `Poin grup telah mencapai batas. Tingkatkan Tipe grup atau tunggu *${durationObject.minutes} Menit ${durationObject.seconds} Detik.* untuk menggunakan perintah bot kembali.`
    }
    
    // Fake reply
    const ftoko = { key: { fromMe: false, participant: "0@s.whatsapp.net", ...(jid ? { remoteJid: "status@broadcast" } : {}) }, message: { "productMessage": { "product": { "productImage":{ "mimetype": "image/jpeg", "jpegThumbnail": fs.readFileSync('./tmp/fake.jpg')}, "title": "SIMPLE BOT", "description": "WhatsApp MD", "currencyCode": "IDR", "priceAmount1000": "100000000", "retailerId": "mysu_",  "productImageCount": 1 }, "businessOwnerJid": `0@s.whatsapp.net` }}}
    
    const { quoted, mtype } = m
    const isQuotedVideo = m.mtype === "extendedTextMessage" && content.includes("videoMessage")
    const isQuotedImage = m.mtype === "extendedTextMessage" && content.includes("imageMessage")
    const isQuotedSticker = m.mtype === "extendedTextMessage" && content.includes("stickerMessage")
    
    switch (command) {
      case prefix+"help": case prefix+"menu": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        await m.reply(menu(prefix, getGreeting, pName))
        break
      }
      case prefix+"faq": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        await m.reply(faq(prefix, getGreeting, pName))
        break
      }
      case prefix+"support": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        await m.reply("Silahkan cek private chat!")
        sock.sendMessage(m.sender, { text: "Dukung saya dengan cara ikuti saluran whatsapp dibawah:\nhttps://whatsapp.com/channel/0029Vaxi9HT9sBIGdOjcP815"})
        break
      }
      case prefix+"status": case prefix+"stat": case prefix+"botstat": case prefix+"botstatus": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        await m.reply(serverStatus())
        break
      }
      case prefix+"script": case prefix+"sc": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        const data = { status: 200, dev: "@mysu_019", data: { filename: "SIMPLE BOT", filesize: 4255, mimetype: "application/zip", password: "B7wbp91n2b", baseUrl: "https://anonymfile.com", downloadUrl: "/xJjDy/simple-bot.zip" }}
        m.reply(JSON.stringify(data, null, 2))
        break
      }
      case prefix+"info": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        const chatData = await Chat.findOne({ chatId: jid })
        const { limitGroup, limitMp3, mute, ecchi, hentai, rules, games, welcome, farewell, groupType, blocked } = chatData
        const picture = await sock.profilePictureUrl(jid, "image").catch(() => "https://telegra.ph/file/e47d9ec693e5288ad9382.jpg")
        const { subject, participants, creation, desc } = await sock.groupMetadata(jid)
        info = `🔰 Nama: ${subject || "Unknown"}
        
🏊 Anggota: ${participants.length}

👥 Admin: ${groupAdmins.length}

📅 Dibuat: ${moment(creation * 1000).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')}

🧮 Poin grup: ${limitGroup.usage} / ${limitGroup.main}

🎶 Batas mp3: ${limitMp3.usage} / ${limitMp3.main}

🏷️ Tipe grup: ${groupType}

⭕ Bisu: ${mute ? "true" : "false"}

🎭 Ecchi: ${ecchi ? "true" : "false"}

🔞 Hentai: ${hentai ? "true" : "false"}

🔱 Aturan: ${rules ? "true" : "false"}

🎮 Permainan: ${games ? "true" : "false"}

⚜️ Selamat datang: ${welcome ? "true" : "false"}

🎐 Selamat tinggal: ${farewell ? "true" : "false"}

🚫 BLOKED : ${blocked.status ? "true" : "false"}

ℹ️ Deskripsi: ↯
${desc || "Tidak ada deskripsi."}
`
        await sock.sendMessage(jid, { image: { url: picture }, caption: info }, { quoted: m })
        break
      }
      case prefix+"enhance": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        const isMedia = mtype === "imageMessage";
        const isQuotedMedia = quoted && (quoted.mtype === "imageMessage");
        if (!isMedia && !isQuotedMedia) {
            await m.reply("Balas atau kirim media gambar dengan perintah ini.");
            await sock.sendReact(jid, "❌", m);
            break
        }
        await sock.sendReact(jid, "⏱️", m)
        const media = isQuotedMedia ? quoted : m;
        const buffer = await media.download();
        const a = await upscale.send(buffer, 2)
        const b = await upscale.wait(a)
        await sock.sendMessage(jid, { image: { url: b.data.downloadUrls[0]}, caption: "enhanced no null.jpeg", mimetype: "image/jpeg" }, { quoted: m })
        await sock.sendReact(jid, "✅", m);
        break
      }
      case prefix+"sticker": case prefix+"s": case prefix+"stiker": case prefix+"stc": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        const isMedia = mtype === "imageMessage" || mtype === "videoMessage";
        const isQuotedMedia = quoted && (quoted.mtype === "imageMessage" || quoted.mtype === "videoMessage" || quoted.mtype === "stickerMessage");
        if (!isMedia && !isQuotedMedia) {
            await m.reply("Balas atau kirim media gambar atau video dengan perintah ini.");
            await sock.sendReact(jid, "❌", m);
            break
        }
        await sock.sendReact(jid, "⏱️", m)
        const media = isQuotedMedia ? quoted : m;
        const fileSize = media.fileLength?.low || media.fileLength || 0;
        if (fileSize >= 1048576) {
            await m.reply("Maaf file terlalu besar.");
            await sock.sendReact(jid, "❌", m);
            break;
        }
        const [pack, author] = text.split("-");
        const buffer = await qd.download()
        const dataStc = await sock.sendMediaAsSticker(jid, buffer, m, { packname: pack || "", author: author || "@mysu_019" });
        await fs.promises.unlink(buffer);
        await fs.promises.unlink(dataStc);
        await sock.sendReact(jid, "✅", m);
        break;
      }
      /*case prefix+"patpat": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (isQuotedImage) {
            await sock.sendReact(jid, "⏱️", m)
            const fileSize = m.quoted.fileLength?.low || 0;
            if (fileSize >= 1048576) {
                await m.reply("Maaf file terlalu besar, Max 1 MB.");
                await sock.sendReact(jid, "❌", m);
                break;
            }
            const media = await sock.downloadAndSaveMediaMessage(m.quoted)
            const generate = await toUguu(media)
            const buffer = await petpet(generate.url, { resolution: 1080 })
            const [pack, author] = text.split("-")
            const dataStc = await sock.sendMediaAsSticker(jid, buffer, m, { packname: pack || "", author: author || "@mysu_019" });
            await fs.promises.unlink(media);
            await fs.promises.unlink(dataStc);
            await sock.sendReact(jid, "✅", m);
        } else {
            m.reply("Untuk melakukan konversi, harap reply pesan media image.");
            await sock.sendReact(jid, "❌", m)
        }
        break
      }
      case prefix+"trigger": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        const cord = new Swiftcord()
        if (isQuotedImage) {
            await sock.sendReact(jid, "⏱️", m)
            const fileSize = m.quoted.fileLength?.low || 0;
            if (fileSize >= 1048576) {
                await m.reply("Maaf file terlalu besar, Max 1 MB.");
                await sock.sendReact(jid, "❌", m);
                break;
            }
            const media = await sock.downloadAndSaveMediaMessage(m.quoted)
            const generate = await toUguu(media)
            const buffer = await cord.trigger(generate.url)
            const [pack, author] = text.split("-")
            const dataStc = await sock.sendMediaAsSticker(jid, buffer, m, { packname: pack || "", author: author || "@mysu_019" });
            await fs.promises.unlink(media);
            await fs.promises.unlink(dataStc);
            await sock.sendReact(jid, "✅", m);
        } else {
            m.reply("Untuk melakukan konversi, harap reply pesan media image.");
            await sock.sendReact(jid, "❌", m)
        }
        break
      }*/
      case prefix+"getimage": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (isQuotedSticker && m.quoted.isAnimated === false) {
            await sock.sendReact(jid, "⏱️", m)
            const buf = await m.quoted.download();
            const cv = await webpToVideo(buf)
            const buffer = await (await fetch(cv)).buffer()
            if (!buffer) {
                m.reply("Gagal mengonversi.");
                await sock.sendReact(jid, "❌", m)
            }
            await sock.sendMessage(m.chat, { image: buffer, caption: "Konversi berhasil" }, { quoted: m });
            await sock.sendReact(jid, "✅", m)
        } else if (isQuotedSticker && m.quoted.isAnimated) {
            await sock.sendReact(jid, "⏱️", m)
            const buf = await m.quoted.download(); 
            const cv = await webpToImage(buf)
            const buffer = await (await fetch(cv)).buffer()
            if (!buffer) {
                m.reply("Gagal mengonversi.");
                await sock.sendReact(jid, "❌", m)
            }
            await sock.sendMessage(m.chat, { video: buffer, caption: "Konversi berhasil", gifPlayback: true }, { quoted: m });
            await sock.sendReact(jid, "✅", m)
        } else {
            m.reply("Untuk melakukan konversi, harap reply pesan sticker.");
            await sock.sendReact(jid, "❌", m)
        }
        break;
      }
      case prefix+"active": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        await m.reply(groupMetadata.subject + " sudah aktif." || "Tidak diketahui.")
        break
      }
      case prefix+"icon": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!isBotGroupAdmins) return m.reply("Perintah ini hanya bisa di gunakan ketika bot menjadi admin!")
        if (!isGroupAdmins && !isDev) return m.reply("Perintah ini hanya bisa di gunakan oleh admin grup!")
        const isMedia = mtype === "imageMessage";
        const isQuotedMedia = quoted && (quoted.mtype === "imageMessage");
        if (!isMedia && !isQuotedMedia) {
            await m.reply("Balas atau kirim media gambar dengan perintah ini.");
            await sock.sendReact(jid, "❌", m);
            break
        }
        await sock.sendReact(jid, "⏱️", m)
        const media = isQuotedMedia ? quoted : m;
        const buffer = await sock.downloadAndSaveMediaMessage(media)
        await sock.updateProfilePicture(m.chat, { url: buffer })
        await fs.promises.unlink(buffer);
        await sock.sendReact(jid, "✅", m);
        break
      }
      case prefix+"delete": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.quoted) throw false
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!isGroupAdmins && !isDev) return m.reply("Perintah ini hanya bisa di gunakan oleh admin grup!")
        if (m.quoted.fromMe) {
        await sock.sendMessage(jid, { delete: { remoteJid: jid, fromMe: true, id: m.quoted.id, participant: m.quoted.sender } })
        } else {
        if (!isBotGroupAdmins) return m.reply("Perintah ini hanya bisa di gunakan ketika bot menjadi admin!")
        await sock.sendMessage(jid, { delete: { remoteJid: jid, fromMe: false, id: m.quoted.id, participant: m.quoted.sender } })
        }
        break
      }
      case prefix+"close": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!isBotGroupAdmins) return m.reply("Perintah ini hanya bisa di gunakan ketika bot menjadi admin!")
        if (!isGroupAdmins && !isDev) return m.reply("Perintah ini hanya bisa di gunakan oleh admin grup!")
        if (args[0] === "false") {
        sock.groupSettingUpdate(m.chat, "not_announcement")
        } else if (args[0] === "true") {
        await sock.groupSettingUpdate(m.chat,"announcement")
        } else {
        await sock.groupSettingUpdate(m.chat, "announcement")
        }
        break
      }
      case prefix+"leave": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!isGroupAdmins && !isDev) return m.reply("Perintah ini hanya bisa di gunakan oleh admin grup!")
        caption = isDev ? `Bot Diperintahkan untuk keluar grup oleh pengembang.` : `Bot Diperintahkan untuk keluar grup oleh admin.`
        await m.reply(caption)
        await sock.groupLeave(jid)
        break
      }
      case prefix+"grouplink": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!isBotGroupAdmins) return m.reply("Perintah ini hanya bisa di gunakan ketika bot menjadi admin!")
        if (!isGroupAdmins && !isDev) return m.reply("Perintah ini hanya bisa di gunakan oleh admin grup!")
        link_ = await sock.groupInviteCode(jid)
        await m.reply("Buka tautan ini untuk bergabung ke grup WhatsApp saya: https://chat.whatsapp.com/" + link_)
        break
      }
      case prefix+"revoke": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!isBotGroupAdmins) return m.reply("Perintah ini hanya bisa di gunakan ketika bot menjadi admin!")
        if (!isGroupAdmins && !isDev) return m.reply("Perintah ini hanya bisa di gunakan oleh admin grup!")
        await sock.groupRevokeInvite(jid)
        break
      }
     case prefix+"promote": case prefix+"demote": case prefix+"remove": case prefix+"add": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.");
        if (!isBotGroupAdmins) return m.reply("Perintah ini hanya bisa di gunakan ketika bot menjadi admin!");
        if (!isGroupAdmins && !isDev) return m.reply("Perintah ini hanya bisa di gunakan oleh admin grup!");
        const action = command === "promote" ? "promote" : command === "demote" ? "demote" : command === "remove" ? "remove" : "add";
        const users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        if (action === "add") {
            try {
                const onWa = await sock.onWhatsApp(`${users}`);
                if (onWa.length === 0) {
                    m.reply("Nomor tersebut tidak terdaftar di WhatsApp");
                } else {
                    await sock.groupParticipantsUpdate(jid, [users], "add")
                    .then(async (res) => {
                        if (res[0].status === "403") {
                            const { content } = res[0].content;
                            await sock.sendMessage(res[0].jid, { groupInvite: { jid: jid, name: groupMetadata.subject, caption: "Undangan untuk bergabung ke grup WhatsApp saya.", code: content[0].code, expiration: 1740620557 }});
                            await sock.sendMessage(jid, { text: "Mengirim undangan grup kepada pengguna tersebut." }, { quoted: m });
                        } else if (res[0].status === "408") {
                            await sock.sendMessage(jid, { text: "Pengguna tersebut baru-baru ini keluar grup." }, { quoted: m });
                        } else if (res[0].status === "401") {
                            await sock.sendMessage(jid, { text: "Pengguna memblokir bot." }, { quoted: m });
                        } else if (res[0].status === "409") {
                            await sock.sendMessage(jid, { text: "Pengguna tersebut sudah berada di grup." }, { quoted: m });
                        }
                    });
                }
            } catch (error) {
                console.error(error);
                m.reply("Terjadi kesalahan saat mencoba menambahkan pengguna ke grup.");
            }
        } else {
            await sock.groupParticipantsUpdate(jid, [users], action);
        }
        break;
      }
      case prefix+"charts": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        aniClient.chartAnimeBySeason("winter", 2025).then(animeChart => {
            chart_text = ""
            animeChart.forEach((chart, index) => {
            chart_text += `
📗Title: ${chart.title.romaji || chart.title.english}
📙Episode: ${chart.nextAiringEpisode ? chart.nextAiringEpisode.episode : ""} ${chart.episodes ? "/ " + chart.episodes : ""}
↹Status: ${chart.status}
⏳ ${chart.nextAiringEpisode ? getCountdown(chart.nextAiringEpisode.airingAt) : ""}
↯Rating: ${chart.averageScore}%
⤗More Info: ${prefix}aid ${chart.id}
`
            })
            chart_text += ""
        sock.sendMessage(jid, { image: { url: "https://img.anili.st/media/" + animeChart[0].id }, caption: chart_text }, { quoted: m })
        }).catch(error => {
            console.error(error)
            m.reply("💔️ Maaf, Anime tidak ditemukan")
        })
        break
      }
      case prefix+"treanime": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        aniClient.getTrendingAnime().then(animeList => {
            text_anime = ""
            animeList.forEach((anime, index) => {
            text_anime += `
📗Title: ${anime.title.romaji || anime.title.english}
📘Type: ${anime.format ? `${anime.format}` : "Unknown"}
📘Genres: ${anime.genres.join(", ")}
⤗More Info: ${prefix}aid ${anime.id}
`
            })
            text_anime += ""
        sock.sendMessage(jid, { image: { url: "https://img.anili.st/media/" + animeList[0].id }, caption: text_anime }, { quoted: m })
        }).catch(error => {
            console.error(error)
            m.reply("💔️ Maaf, Anime tidak ditemukan.")
        })
        break
      }
      case prefix+"anime": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply("Beri aku nama Baka (*￣ii￣)")
        const animeName = text // Ganti dengan nama anime yang ingin Anda cari
        aniClient.searchAnimeByName(animeName).then(animeList => {
            text_anime = ""
            animeList.forEach((anime, index) => {
            text_anime += `
📗Title: ${anime.title.romaji || anime.title.english}
📘Type: ${anime.format ? `${anime.format}` : "Unknown"}
📘Genres: ${anime.genres.join(", ")}
⤗More Info: ${prefix}aid ${anime.id}
`
            })
            text_anime += ""
        sock.sendMessage(jid, { image: { url: "https://img.anili.st/media/" + animeList[0].id }, caption: text_anime }, { quoted: m })
        }).catch(error => {
            console.error(error)
            m.reply("💔️ Maaf, Anime tidak ditemukan.")
        })
        break
      }
      case prefix+"aid": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply("Beri aku id Baka (*￣ii￣)")
        if (args[1] === "-char") {
        aniClient.searchAnimeById(args[0]).then(animeChar => {
            animeChar_text = ""
            animeChar.characters.nodes.forEach((character, index) => {
            animeChar_text += `
📗Name: ${character.name.full || character.name.native}
📘ID: ${character.id}
⤗More Info: ${prefix}charid ${character.id}
~🤍Relationship: ${prefix}marry ${character.id}~
(soon.)
`
            })
            animeChar_text += ""
        sock.sendMessage(jid, { image: { url: animeChar.characters.nodes[0].image.large }, caption: animeChar_text }, { quoted: m })
            }).catch(error => { 
                m.reply("💔️ Maaf, Character tidak ditemukan")
            })
        } else {
        aniClient.searchAnimeById(text).then(anime => {
            animeId_text = `📗Title: ${anime.title.romaji || anime.title.english}
📘Genres: ${anime.genres.join(", ")}
📙Episode: ${anime.episodes ? `${anime.episodes}` : "0"}
📙Type: ${anime.format ? `${anime.format}` : "Unknown"}
↹Status: ${anime.status}
↛Aired: ${anime.startDate}
↯Rating: ${anime.averageScore ? `${anime.averageScore}%` : "-"}
🕒Duration: ${anime.duration ? `${anime.duration} Minutes` : "-"}
⤗Season: ${anime.season ? anime.season : "-"} ${anime.seasonYear ? anime.seasonYear :  ""}
💫Adaption: ${anime.source}
📙Synopsis: ${anime.description ? `${anime.description}` : `-`}`
        sock.sendMessage(jid, { image: { url: "https://img.anili.st/media/" + anime.id }, caption: animeId_text }, { quoted: m })
        }).catch(error => { 
            m.reply("💔️ Maaf, Anime tidak ditemuka")
        })            
        }
        break
      }
      case prefix+"tremanga": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        aniClient.getTrendingManga().then(mangaList => {
            text_manga = ""
            mangaList.forEach((manga, index) => {
            text_manga += `
📗Title: ${manga.title.romaji || manga.title.english}
📘Type: ${manga.format ? `${manga.format}` : "Unknown"}
📘Genres: ${manga.genres.join(", ")}
⤗More Info: ${prefix}mid ${manga.id}
`
            })
            text_manga += ""
        sock.sendMessage(jid, { image: { url: "https://img.anili.st/media/" + mangaList[0].id }, caption: text_manga }, { quoted: m })
        }).catch(error => {
            m.reply("💔️ Maaf, Manga tidak ditemukan")
        })
        break
      }
      case prefix+"manga": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply("Beri aku nama Baka (*￣ii￣)")
        const mangaName = text // Ganti dengan nama manga yang ingin Anda cari
        aniClient.searchMangaByName(mangaName).then(mangaList => {
            text_manga = ""
            mangaList.forEach((manga, index) => {
            text_manga += `
📗Title: ${manga.title.romaji || manga.title.english}
📘Type: ${manga.format ? `${manga.format}` : "Unknown"}
📘Genres: ${manga.genres.join(", ")}
⤗More Info: ${prefix}mid ${manga.id}
`
            })
            text_manga += ""
        sock.sendMessage(jid, { image: { url: "https://img.anili.st/media/" + mangaList[0].id }, caption: text_manga }, { quoted: m })
        }).catch(error => {
            m.reply("💔️ Maaf, Manga tidak ditemukan")
        })
        break
      }
      case prefix+"mid": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply("Beri aku ID Baka (*￣ii￣)")
        const mangaId = text // Ganti dengan ID manga yang ingin Anda cari
        aniClient.searchMangaById(mangaId).then(manga => {
            mangaId_text = `📗Title: ${manga.title.romaji || manga.title.english}
📘Genres: ${manga.genres.join(", ")}
📙Volumes: ${manga.volumes ? `${manga.volumes}` : "0"}
📙Chapters: ${manga.chapters ? `${manga.chapters}` : "0"}
📙Type: ${manga.format ? manga.format : "Unknown"}
↹Status: ${manga.status}
↛Aired: ${manga.startDate}
↯Rating: ${manga.averageScore}%
💫Adaption: ${manga.source}
📙Synopsis: ${manga.description ? `${manga.description}` : "-"}`
        sock.sendMessage(jid, { image: { url: "https://img.anili.st/media/" +  manga.id }, caption: mangaId_text }, { quoted: m })
        }).catch(error => {
            m.reply("💔️ Maaf, Manga tidak ditemukan")
        })
        break
      }
      case prefix+"character": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply("Beri aku nama Baka (*￣ii￣)")
        const characterName = text // Ganti dengan nama character yang ingin Anda cari
        aniClient.searchCharacterByName(characterName).then(characterList => {
            text_character = ""
            characterList.forEach((character, index) => {
            text_character += `
📗Name: ${character.name.full || character.name.native}
📘ID: ${character.id}
⤗More Info: ${prefix}charid ${character.id}
~🤍Relationship: ${prefix}marry ${character.id}~
(soon.)
`
            })
            text_character += ""
        sock.sendMessage(jid, { image: { url: characterList[0].image.large }, caption: text_character }, { quoted: m })
        }).catch(error => {
            m.reply("💔️ Maaf, Character tidak ditemukan")
        })
        break
      }
      case prefix+"charid": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply("Beri aku ID Baka (*￣ii￣)")
        const characterId = text // Ganti dengan ID karakter yang ingin Anda cari
        aniClient.searchCharacterById(characterId).then(character => {
            charId_text = `📗Name: ${character.name.full || character.name.native}\nAbout:-\n${character.description ? character.description : "No Description."}`
            //character.media.nodes.forEach((media, index) => {
              //  charId_text += `\n📗Anime: ${media.title.romaji || media.title.english}\n📘Type: ${media.type ? `${media.type}` : ``}\n📘Genres: ${media.genres.join(', ')}\n⤗More Info: ${prefix}aid ${media.id}\n`
            //})
            //charId_text += ``
        sock.sendMessage(jid, { image: { url: character.image.large }, caption: charId_text }, { quoted: m })
        }).catch(error => {
            m.reply('💔️ Maaf, Character tidak ditemukan')
        })
        break
      }
      case prefix+"komiku": {
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply("Beri aku nama Baka (*￣ii￣)")
        if (args[0] === "--details") {
            Komiku.fetchDetails(args[1]).then(async results => {
                text_1 = `📗Title: ${results.data.title}
📘Genres: ${results.data.genres || "-"}
📙Type: ${results.data.type || "-"}
↹Status: ${results.data.status || "-"}
📙Synopsis: ${results.data.description || "-"}

_Untuk download silahkan kirimkan perintah dengan contoh_\n*_${prefix}komiku --downloads urlnya_* atau *_Balas pesan bot dengan nomor contoh 1 untuk download chapter terbaru._*`
                text_2 = results.data.chapters.map((chp, index) => `\n${index + 1}. Chapters ${chp.ch}\n⤗Download: ${prefix}komiku --download ${chp.url}\n`).join("")
            const kodat = await sock.sendMessage(jid, { image: { url: results.data.cover }, caption: text_1 }, { quoted: m })
            sock.sendMessage(jid, { text: text_2 }, { quoted: kodat })
            }).catch(error => 
                m.reply('💔 Maaf, Sepertinya ada yang salah.')
            )
        } else if (args[0] === "--downloads") {
            const cd = await Chat.findOne({ chatId: jid })
            if (cd.komiku) return m.reply("⚠️ Sesi unduh sebelumnya belum selesai.")
            cd.komiku = true
            await cd.save()
            try {
                const result = await Komiku.fetchChapters(args[1]);
                const tb = await (await fetch(result.result.cover)).buffer();
                const buffer = await extractImageThumb(tb);
                const pages = result.result.chapters.map((v) => v);
        
                const imagepdf = await toPdf(pages);
                await sock.sendMessage(m.chat, { document: imagepdf, mimetype: 'application/pdf', fileName: `${result.result.title}.pdf`, pageCount: pages.length, jpegThumbnail: buffer.buffer }, { quoted: m });
        
                cd.komiku = false;
                await cd.save();
            } catch (error) {
                m.reply('💔 Maaf, Sepertinya ada yang salah.');
                cd.komiku = false;
                await cd.save();
            }
        } else {
            Komiku.fetchList(args[0]).then(async results => {
                text_1 = results.data.map(data => `\n📗Title: ${data.title || "Unknown"}\n📙Initial: ${data.chAwal}\n📙Latest: ${data.chLatest}\n⤗More Info: ${prefix}komiku --details ${data.url}\n\n`)
                await sock.sendMessage(jid, { image: { url: results.data[0].image }, caption: text_1 }, { quoted: m })
            }).catch(error => 
                m.reply('💔 Maaf, Manga tidak ditemukan.')
            )
        }
        break
      }
      case prefix+"loli": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        const tags = ["goth-loli", "loli", "akashio_(loli_ace)", "hololive", "lolita_fashion"]
        const randomTag = tags[Math.floor(Math.random() * tags.length)]
        booru.search("konan", randomTag, { limit: 1, random: true }).then(res => {
            sock.sendMessage(jid, { image: { url: res.posts[0].fileUrl }, caption: "Onii-Chan Baka!!"}, { quoted: m })
        }).catch(error => {
            m.reply('💔️ Maaf, Terjadi kesalahan.')
        })
        break
      }
      case prefix+"neko": case prefix+"waifu": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        const captionAction = command === "!neko" ? "Nyaa~" : "Waifu kamu telah muncul."
        try {
            const postData = await APIs(process.env.WAIFU_PICS + "/sfw/" + command.replace("!", ""))
            await sock.sendMessage(jid, { image: { url: postData.url }, caption: captionAction }, { quoted: m })
        } catch (error) {
            m.reply('💔️ Maaf, Terjadi kesalahan.')
        }
        break
      }
      case prefix+"maid": case prefix+"uniform": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        const captionAction = command === "!maid" ? "Haai, Goshujinsama~" : "Senpai~"
        try {
            const postData = await APIs(process.env.WAIFU_IM + "/search/?included_tags=" + command.replace("!", ""))
            await sock.sendMessage(jid, { image: { url: postData.images[0].url }, caption: captionAction }, { quoted: m })
        } catch (error) {
            m.reply('💔️ Maaf, Terjadi kesalahan.')
        }
        break
      }
      case prefix+"pinterest": case prefix+"pin": {
        if (!text) return m.reply("Apa yang ingin dicari ?").then(() => sock.sendReact(jid, "❔", m))
        sock.sendReact(jid, "🔍", m)
        
        const createImage = async (url) => {
            const { imageMessage } = await generateWAMessageContent({
                image: { url }
            }, {
                upload: sock.waUploadToServer
            });
            return imageMessage;
        };
    
        const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        };
    
        const anutrest = await pinterest(text);
        shuffleArray(anutrest);
        const selectedImages = anutrest.slice(0, 5);
    
        const push = selectedImages.map(async (message, index) => {
            const imageMessage = await createImage(message.image);
            return {
                body: proto.Message.InteractiveMessage.Body.fromObject({
                    text: `Di unggah oleh: @${message.upload_by}`
                }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({
                    text: "iG @mysu_019"
                }),
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: `*Gambar* - ${index + 1}`,
                    hasMediaAttachment: true,
                    imageMessage: imageMessage
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [
                        {
                            "name": "cta_url",
                            "buttonParamsJson": `{
                                "display_text": "Kunjungi",
                                "url": "${message.source}", 
                                "merchant_url": "${message.source}"
                            }`
                        }
                    ]
                })
            };
        });
    
        const resolvedPush = await Promise.all(push);
    
        const msg = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: "Berikut hasilnya..."
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: "iG @mysu_019"
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            hasMediaAttachment: false
                        }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                            cards: resolvedPush
                        })
                    })
                }
            }
        }, { 
            quoted: m 
        });
    
        await sock.relayMessage(jid, msg.message, {
            messageId: msg.key.id
        })
        break
      }
      case prefix+"subreddit": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply("Masukan kata kunci contoh " + command + " wallpaper.").then(() => sock.sendReact(jid, "❔", m))
        sock.sendReact(jid, "🔍", m)
        try {
            let res = await APIs('https://meme-api.com/gimme/' + text)
            sub_text = `📗Title: ${res.title}
📘Subreddit: ${res.subreddit.charAt(0).toUpperCase() + res.subreddit.slice(1)}

${res.nsfw ? 'THIS HENTAI' : 'THIS NOT HENTAI'}
${res.postLink}`
            await sock.sendMessage(m.chat, { image: { url: res.url }, caption: sub_text }, { quoted: m })
            } catch {
            await m.reply('💔️ Maaf, Masukan kata kunci dengan benar.')
        }
        break
      }
      case prefix+"youtube": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply("Untuk mencari video ketikan " + command + " judulnya.").then(() => sock.sendReact(jid, "❔", m))
        sock.sendReact(jid, "🔍", m)
        try {
            const queryResult = await yts.search(text)
            if (queryResult.length === 0) {
                return m.reply("Kata kunci yang dimasukan tidak ditemukan.").then(() => sock.sendReact(jid, "❌", m))
            }
            text_ = ""
            queryResult.all.slice(0, 5).forEach(data => {
            text_ += `*Title:* ${data.title}\n\n*Duration:* ${data.timestamp}\n\n*Download:* ${prefix}mp3 - ${prefix}mp4\n${data.url}\n-----------------------------\n`
            })
            await sock.sendMessage(jid, { image: { url: queryResult.all[0].thumbnail }, caption: text_ }, { quoted: m })
        } catch (error) {
            m.reply("💔️ Maaf, Terjadi kesalahan.")
        }
        break
      }
      case prefix+'soundcloud': {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply(`Kirim perintah ${command} dan masukan kata kunci yang ingin dicari berikut contohnya ${command} light switch`).then(() => sock.sendReact(jid, "❔", m))
        sock.sendReact(jid, "🔍", m)
        // Jika input bukan link SoundCloud, lakukan pencarian lagu
        soundcloud.tracks.searchV2({q: text }).then(res => {
        var data = res.collection.slice(0, 5)
        teks = ``
        Object.keys(data).forEach(function (i) {
            var durasi = data[i].full_duration
            var duration = timeConvert(durasi)
            teks += `*Judul:* ${data[i].title}\n\n*Durasi:* ${duration}\n\n*Download:* ${prefix}mp3 ${data[i].permalink_url}\n--------------------------------\n`
        })
            teks += ``
        sock.sendMessage(jid, { text: teks }, { quoted: m })
        }).catch(() => m.reply('💔️ Maaf, Gunakan kata kunci lain'))
        break
      }
      case prefix+"mp3": {
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        const { mp3 } = require("./lib/download")
        mp3(sock, text, m, args)
        break
      }
      case prefix+"mp4": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        const { mp4 } = require("./lib/download")
        mp4(sock, text, m, args)
        break
      }
      case prefix+"music": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply("Untuk mencari music ketikan " + command + " judul lagunya.").then(() => sock.sendReact(jid, "❔", m))
        sock.sendReact(jid, "🔍", m)
        msc.search(text, 'song').then(async (res) => {
            let no = 1
            teks_mus = `\n`
            for (var x of res.content.slice(0, 5)) {
                teks_mus += `${no++}. ${x.title}\n`
            if (x.artists && x.artists.length > 0) {
                teks_mus += `Artis: ${x.artists[0].name || "-"}\n`
                }
                teks_mus += `Durasi: ${x.duration.formatted}\nhttps://music.youtube.com/watch?v=${x.id}\n\n`
            }
                teks_mus += `Balas pesan bot ini untuk memutar music dengan nomor contoh 1 untuk mengambil data music nomor tersebut.`
            m.reply(teks_mus)
        })
        break  
      }
      case prefix+"iginfo": case prefix+"igstalk": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!text) return m.reply("Untuk melakukan stalking instagram ketikan " + command + " @username").then(() => sock.sendReact(jid, "❔", m))
        if (text.startsWith("@")) return m.reply("Pastikan username diawali dengan @" ).then(() => sock.sendReact(jid, "❌", m))
        sock.sendReact(jid, "🔍", m)
        try {
            // Isi kodenya puh
        } catch (error) {
            m.reply("💔️ Maaf, Terjadi kesalahan.")
        }
        break
      }
      case prefix+"ping": {
        if (await isGroupLimit(jid)) return m.reply(groupTimeReason(await getTimeGroup(jid)))
        await addGroupLimit(jid)
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (!isGroupAdmins && !isDev) return m.reply("Perintah ini hanya bisa di gunakan oleh admin grup!")
        if (m.quoted) {
        await sock.sendMessage(jid, { text: `@${jid} ${text || ""}`, 
            contextInfo: {
                mentionedJid: participants.map(a => a.id),
                groupMentions: [{
                    groupSubject: "everyone",
                    groupJid: jid
                }]
            }}, { quoted: m.quoted.fakeObj });
        } else {
            await sock.sendMessage(jid, { text: `@${jid} ${text || ""}`, 
            contextInfo: {
                mentionedJid: participants.map(a => a.id),
                groupMentions: [{
                    groupSubject: "everyone",
                    groupJid: jid
                }]
            }}, { quoted: m });
        }
        break
      }
      case prefix+"deepseek": {
        if (!isDev) return
        if (!text) return m.reply("Apa yang ingin ditanyakan ?").then(() => sock.sendReact(jid, "❔", m))
        sock.sendReact(jid, "🔍", m)
        let {
            data
        } = await axios.post("https://ai.clauodflare.workers.dev/chat", {
            "model": "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
            "messages": [{
                "role": "user",
                "content": `${text}`
            }],
            "stream": false
        }, {
            timeout: 30000
        }).catch(e => e.response)
        if (!data.success) return
        let response = data.data.response.split("</think>").pop().trim()
        await m.reply(response)
        break
      }
      case prefix+"animagine": {
        if (!isDev) return
        if (!text) return await m.reply("Silahkan berikan prompt. default: Create an anime characte").then(() => sock.sendReact(jid, "❔", m))
        sock.sendReact(jid, "⏱️", m)
        try {
        const prompt = text
        const response = await create(prompt);
        if (response?.output?.data && Array.isArray(response.output.data) && response.output.data.length > 1) {
          const imageData = response.output.data[0][0]?.image; // Ambil bagian gambar
          const modelData = response.output.data[1]?.Model; // Ambil bagian model
          const resolution = response.output.data[1]?.resolution.replace(" x ", "x"); // Ambil resolusi
    
          if (!imageData?.url) {
            await m.reply("Url media tidak diketahui.");
            sock.sendReact(jid, "❌", m)
          }
          if (!resolution) {
            await m.reply("Resolusi media tidak diketahui.");
            sock.sendReact(jid, "❌", m)
          }
          if (!modelData?.Model) {
            await m.reply("Model tidak diketahui.");
            sock.sendReact(jid, "❌", m)
          }
    
          let mimetype = "image/png"; // Default
          if (imageData.url.endsWith(".jpeg") || imageData.url.endsWith(".jpg")) {
            mimetype = "image/jpeg";
          }
    
          const caption = `Resolusi: (${resolution})\n${modelData.Model}`;
    
          await sock.sendMessage(jid, { image: { url: imageData.url }, mimetype: mimetype, caption: caption }, { quoted: m });
          sock.sendReact(jid, "✅", m)
        } else {
          await m.reply("Format tidak diketahui.");
          sock.sendReact(jid, "❌", m)
        }
        } catch (error) {
          await m.reply("Sepertinya ada yang salah.");
          sock.sendReact(jid, "❌", m)
        }
        break
      }
      case prefix+"clone": {
        if (!isDev) return
        if (!text) return m.reply("Masukan link repo-nya.")
        await clone(sock, jid, text, "zip")
        break
      }
      case prefix+"flip": {
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        await m.reply(['Heads', 'Tails'][Math.floor(Math.random() * 2)]);
        break
      }
      case prefix+"dice": {
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        await m.reply(`${Math.floor(Math.random() * 6 ) + 1}`)
        break
      }
      case prefix+"guess": {
        if (!m.isGroup) return m.reply("Tidak dapat dipakai di private chat.")
        if (games.has(jid)) return m.reply('⚠️ Masih ada sesi permainan.')
        const target = Math.floor(Math.random() * 50) + 1; // Angka 1-50
        const caption = `🎮 Permainan Dimulai!

Bisakah kamu menebak angka 1 sampai 50 ?

Hadiah : soon.
Kamu mempunyai 5x kesempatan.
Balas pesan ini dan Berikkan angka tebakanmu!`
        const { key } = await sock.sendMessage(jid, { text: caption }, { quoted: m })
        games.set(jid, {
            id: key.id,
            target: target,
            attempts: 5
        })
        break
      }
      default:
        if (games.has(jid) && !isCmd && m.quoted) {
            const game = games.get(jid)
            if (m.quoted.id == game.id) {
            const guess = parseInt(m.text)
            if (isNaN(guess) || guess < 1 || guess > 50) {
                m.reply('❌ Tebaklah angka kisaran 1 sampai 50.')
                return;
            }
            game.attempts--;
            if (guess === game.target) { 
                m.reply(`🎉 Tebakan kamu benar angkanya adalah ${game.target}`)
                games.delete(jid);
            } else if (game.attempts === 0) { 
                m.reply(`❌ Kesempatan habis angkanya adalah ${game.target}`)
                games.delete(jid);
            } else { 
                const clue = guess > game.target ? 'terlalu *tinggi* 📉' : 'terlalu *rendah* 📈';
                m.reply(`❌ Salah! Tebakanmu ${clue}\nSisa kesempatan: *${game.attempts}*`);
            }
            }
        }
            
        if (budy.startsWith("$")) {
            if (!m.key.fromMe && !isDev) return
            const command = budy.slice(2) // Mengambil perintah setelah "$ "
        
            // Menjalankan perintah shell
            exec(command, (err, stdout) => {
                if (err) {
                    return m.reply(`${err}`) // Kirim pesan error jika terjadi kesalahan
                }
                if (stdout) {
                    return m.reply(stdout) // Kirim output jika perintah berhasil
                }
            })
        }
        if (budy.startsWith("..")) {
            if (!m.key.fromMe && !isDev) return
            try {
                // Mengambil pesan setelah "..""
                const result = await eval(`(async () => { return ${budy.slice(3)} })()`)
                
                // Fungsi untuk memformat dan mengirim balasan
                m.reply(util.format(result))
            } catch (e) {
                m.reply(String(e)) // Tangani error dan kirim pesan error
            }
        }
        if (budy.startsWith("=>")) {
            if (!m.key.fromMe && !isDev) return
            const konsol = budy.slice(3) // Mengambil pesan setelah "=>"
        
            // Fungsi untuk memformat dan mengirim balasan
            const Return = (sul) => {
                let sat = JSON.stringify(sul, null, 2) // Mengubah objek ke string JSON
                let bang = util.format(sat)
        
                if (sat === undefined) {
                    bang = util.format(sul) // Jika undefined, format langsung
                }
        
                return m.reply(bang) // Kirim balasan
            }
        
            try {
                // Mengeksekusi kode yang diberikan
                const result = eval(`(async () => { ${konsol} })()`)
                m.reply(util.format(result)) // Kirim hasil eksekusi
            } catch (e) {
                m.reply(String(e)) // Tangani error dan kirim pesan error
            }
        }
    }
  } catch (err) {
      console.error(err)
      m.reply("💔 Server bermasalah.")
  }
}

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.bold.yellow("case.js di perbarui.."));
  delete require.cache[file];
  require(file);
});
