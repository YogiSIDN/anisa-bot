require("dotenv").config()
const {
  proto,
  jidDecode,
  makeWASocket,
  getContentType,
  DisconnectReason,
  jidNormalizedUser,
  makeInMemoryStore,
  useMultiFileAuthState,
  generateWAMessageContent,
  downloadContentFromMessage,
  generateWAMessageFromContent,
  makeCacheableSignalKeyStore
} = require("baileys")
const { 
    useMongoAuthState 
} = require("session")
const fs = require("fs")
const pino = require("pino")
const chalk = require("chalk")
const axios = require("axios")
const mongoose = require("mongoose")
const readline = require("readline")
const FileType = require("file-type")
const { Boom } = require("@hapi/boom")
const NodeCache = require("node-cache")
const groupCache = new NodeCache({stdTTL: 1 * 60, checkperiod: 60, useClones: false})
const msgRetryCounterCache = new NodeCache({stdTTL: 1 * 60, checkperiod: 60, useClones: false})

// Library
const { getBuffer } = require("./lib/function")

// Tools
const { 
    imageToWebp, 
    videoToWebp, 
    writeExif, 
    writeExifImg, 
    writeExifVid 
} = require("./tools/cft")

const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  
  return new Promise((resolve) => {
    rl.question(text, resolve)
  })
}

const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" })
})

mongoose.connect(process.env.CLIENT_MONGO)
  .then(() => {
    console.log(chalk.bold.green("[ ") + chalk.bold.yellow("DB") + chalk.bold.green(" ] ") + chalk.bold.blue("Connected to MongoDB!")
    );
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

async function startBase() {
  const {
    state,
    saveCreds
  } = await useMongoAuthState(process.env.CLIENT_MONGO, {})
  
  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    socketTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: false,
    browser: ["Windows", "Edge", ""],
    msgRetryCounterCache,
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
    /*getMessage: async key => {
        const jid = jidNormalizedUser(key.remoteJid)
        const msg = await store.loadMessage(jid, key.id)
        return msg?.message || ""
    },*/
    patchMessageBeforeSending: (message) => {
        const requiresPatch = !!(
            message.buttonsMessage ||
            message.templateMessage ||
            message.listMessage
        )
        if (requiresPatch) {
            message = {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                        },
                        ...message,
                        },
                    },
                }
            }
          return message
        }
  })
  
  if(!sock.authState.creds.registered) {
    const phoneNumber = await question(chalk.greenBright('Masukan nomor Whatsapp awali dengan 62:\n'));
    const code = await sock.requestPairingCode(phoneNumber.trim())
    console.log(chalk.yellow(`⚠︎ Kode Pairing Bot Whatsapp kamu :`), chalk.yellow(`${code}`))
}
  
  sock.ev.on("creds.update", saveCreds)
  store.bind(sock.ev)
  sock.public = true

  //sock.ev.on("contacts.update", update => {
  //  for (let contact of update) {
  //      let id = jidNormalizedUser(contact.id)
  //      if (store && store.contacts) store.contacts[id] = { ...(store.contacts?.[id] || {}), ...(contact || {}) }
  //  }
  //})
    
  sock.ev.on("groups.update", updates => {
    for (const update of updates) {
        const id = update.id
        if (store.groupMetadata[id]) {
            store.groupMetadata[id] = { ...(store.groupMetadata[id] || {}), ...(update || {}) }
        }
    }
  })

  sock.ev.on("group-participants.update", async (event) => {
    const metadata = await store.groupMetadata[event.id] || {}
    groupCache.set(event.id, metadata)
  })
  
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect} = update	    
        if (connection === "close") {
        let reason = new Boom(lastDisconnect?.error)?.output.statusCode
         if (reason === DisconnectReason.badSession) {
        console.log(`Bad Session File, Please Delete Session and Scan Again`)
        process.exit()
          } else if (reason === DisconnectReason.connectionClosed) {
        console.log("Connection closed, reconnecting....")
        startBase()
          } else if (reason === DisconnectReason.connectionLost) {
        console.log("Connection Lost from Server, reconnecting...")
        startBase()
          } else if (reason === DisconnectReason.connectionReplaced) {
        console.log("Connection Replaced, Another New Session Opened, Please Restart Bot")
        process.exit()
          } else if (reason === DisconnectReason.loggedOut) {
        console.log(`Device Logged Out, Please Delete Folder Session yusril and Scan Again.`)
        process.exit()
          } else if (reason === DisconnectReason.restartRequired) {
        console.log("Restart Required, Restarting...")
        startBase()
          } else if (reason === DisconnectReason.timedOut) {
        console.log("Connection TimedOut, Reconnecting...")
        startBase()
          } else {
        console.log(`Unknown DisconnectReason: ${reason}|${connection}`)
        startBase()
          }
        } else if (connection === "connecting") {
        //console.log(`Connecting...`)
        console.log(
        chalk.bold.green("[ ") +
        chalk.bold.yellow(">>") +
        chalk.bold.green(" ] ") +
        chalk.bold.blue("Connecting...")
    )
        } else if (connection === "open") {
        //console.log(`Connected...`)
        console.log(
        chalk.bold.green("[ ") +
        chalk.bold.yellow(">>") +
        chalk.bold.green(" ] ") +
        chalk.bold.blue("Connected...")
    )
        }
    })
  
  sock.ev.on("messages.upsert", async chatUpdate => {
    try {
        let msg = chatUpdate.messages[0]
        //console.log(JSON.stringify(msg, null, 4))
        if (!msg.message) return
        msg.message = (Object.keys(msg.message)[0] === "ephemeralMessage") ? msg.message.ephemeralMessage.message : msg.message
        if (msg.key && msg.key.remoteJid === "status@broadcast") return
        if (!sock.public && !msg.key.fromMe && chatUpdate.type === "notify") return
        if (msg.key.id.startsWith("BAE5") && msg.key.id.length === 16) return
        
        let m = smsg(sock, msg, store)
        //console.log(JSON.stringify(m, null, 4))
        require("./cmd")(sock, m, msg, chatUpdate, store)
    } catch (err) {
        console.log(err)
    }
  })
  
  sock.decodeJid = (jid) => {
      if (!jid) return jid
      if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {}
      return decode.user && decode.server && decode.user + "@" + decode.server || jid
    } else return jid
  }
  
  sock.sendReact = (jid, emoji, m) => {
      const reactionMessage = { react: { text: emoji, key: m.key }}
      return sock.sendMessage(jid, reactionMessage)
  }
  
  sock.awaitMessage = async (options = {}, socket) => {
    return new Promise((resolve, reject) => {
        if (typeof options !== "object") reject(new Error("Options harus berupa objek"))
        if (typeof options.sender !== "string") reject(new Error("Sender harus berupa string"))
        if (typeof options.chatJid !== "string") reject(new Error("ChatJid harus berupa string"))
        if (options.timeout && typeof options.timeout !== "number") reject(new Error("Timeout harus berupa angka"))
        if (options.filter && typeof options.filter !== "function") reject(new Error("Filter harus berupa fungsi"))

        const timeout = options?.timeout || undefined
        const filter = options?.filter || (() => true)
        const expectedMessages = options?.expectedMessages || []

        let interval = undefined

        let listener = (data) => {
            let { type, messages } = data
            if (type == "notify") {
                for (let message of messages) {
                    const fromMe = message.key.fromMe
                    const chatId = message.key.remoteJid
                    const isGroup = chatId.endsWith("@g.us")
                    const isStatus = chatId == "status@broadcast"

                    const sender = fromMe ? socket.user.id.replace(/:.*@/g, "@") : (isGroup || isStatus) ? message.key.participant.replace(/:.*@/g, "@") : chatId

                    if (sender == options.sender && chatId == options.chatJid && filter(message) && expectedMessages.includes(message.message?.conversation)) {
                        socket.ev.off("messages.upsert", listener)
                        clearTimeout(interval)
                        resolve(message)
                    }
                }
            }
        }

        sock.ev.on("messages.upsert", listener)

        if (timeout) {
            interval = setTimeout(() => {
                sock.ev.off("messages.upsert", listener)
                reject(new Error("Timeout"))
            }, timeout)
        }
    })
  }
  
  sock.getFile = async (PATH, returnAsFilename) => {
    let res, filename
    const data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,` [1], "base64") : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === "string" ? PATH : Buffer.alloc(0)
    if (!Buffer.isBuffer(data)) throw new TypeError("Result is not a buffer")
    const type = await FileType.fromBuffer(data) || { mime: "application/octet-stream", ext: ".bin" }
    if (data && returnAsFilename && !filename)(filename = path.join(__dirname, "./media/" + new Date * 1 + "." + type.ext), await fs.promises.writeFile(filename, data))
    return {
        res,
        filename,
        ...type,
        data,
        deleteFile() {
        return filename && fs.promises.unlink(filename)
         }
      }
  }

  sock.sendSlideImage = async (jid, items, footerText = "", ft = "", quoted) => {
    try {
        if (items.length === 0) {
            return sock.sendMessage(jid, { text: "💔 Tidak ada hasil yang ditemukan." }, { quoted });
        }
        const createImage = async (url) => {
        const { imageMessage } = await generateWAMessageContent({ image: { url }}, { upload: sock.waUploadToServer });
            return imageMessage;
        };
    
        const push = items.map(async (item, index) => {
        const imageMessage = await createImage(item.image);
            return {
                body: proto.Message.InteractiveMessage.Body.fromObject({
                    text: item.text
                }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({
                    text: footerText
                }),
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: ``,
                    hasMediaAttachment: true,
                    imageMessage: imageMessage
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: item.buttons || []
                })
            };
        });
        const resolvedPush = await Promise.all(push);
        if (resolvedPush.length === 1) {
        await sock.sendMessage(jid, { image: { url: items[0].image }, caption: items[0].text, }, { quoted });
        } else {
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
                            text: ft
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
        }, { quoted: quoted });
        await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
        }
    } catch (error) {
        console.error(error);
        sock.sendMessage(jid, { text: "💔 Terjadi kesalahan saat mengirim slide." }, { quoted });
    }
  }
  
  sock.downloadMediaMessage = async (message) => {
    const mime = (message.msg || message).mimetype || ""
    const messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0]
    const stream = await downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
  }
  
  sock.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(quoted, messageType)
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
	let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        // save to file
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
  }
  
  sock.sendText = (jid, text, quoted = "", options) => sock.sendMessage(jid, { text: text, ...options }, { quoted })
  
  sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], "base64") : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
    let buffer = (options && (options.packname || options.author)) ? await writeExifImg(buff, options) : await imageToWebp(buff)
    await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
    return buffer
  }
  
  sock.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], "base64") : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
    let buffer = (options && (options.packname || options.author)) ? await writeExifVid(buff, options) : await videoToWebp(buff)
    await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
    return buffer
  }

  sock.sendMediaAsSticker = async (jid, path, quoted, options = {}) => {
	let { ext, mime, data } = await sock.getFile(path)
	let media = {}
    let buffer
    media.data = data
	media.mimetype = mime
    if (options && (options.packname || options.author)) {
    buffer = await writeExif(media, options)
    } else {
    buffer = /image/.test(mime) ? await imageToWebp(data) : /video/.test(mime) ? await videoToWebp(data) : ""
    }
	await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
    return buffer
  }
}

startBase()

function smsg(sock, m, store) {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id?.startsWith("BAE5") && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat?.endsWith("@g.us");
        m.sender = sock.decodeJid(m.fromMe && sock.user.id || m.participant || m.key.participant || m.chat || "");
        if (m.isGroup) m.participant = sock.decodeJid(m.key.participant) || "";
    }

    if (m.message) {
        let type = getContentType(m.message);
        if (!type) {
            console.error("Unknown message type:", m.message);
            return m;
        }

        m.mtype = type;
        m.msg = (m.mtype === "viewOnceMessageV2" ? 
                 m.message[m.mtype]?.message[getContentType(m.message[m.mtype]?.message)] : 
                 m.message[m.mtype]) || {};

        m.body = m.message.conversation || 
                 m.msg?.caption || 
                 m.msg?.text || 
                 (m.mtype === "listResponseMessage" && m.msg?.singleSelectReply?.selectedRowId) || 
                 (m.mtype === "buttonsResponseMessage" && m.msg?.selectedButtonId) || 
                 (m.mtype === "viewOnceMessageV2" && m.msg?.caption) || 
                 m.text || "";

        let quoted = m.quoted = m.msg?.contextInfo?.quotedMessage || null;
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];

        if (m.quoted) {
            let quotedType = getContentType(quoted);
            m.quoted = m.quoted[quotedType] || {};

            if (["productMessage"].includes(quotedType)) {
                quotedType = getContentType(m.quoted);
                m.quoted = m.quoted[quotedType] || {};
            }

            if (typeof m.quoted === "string") {
                m.quoted = { text: m.quoted };
            }

            m.quoted.mtype = quotedType;
            m.quoted.id = m.msg?.contextInfo?.stanzaId;
            m.quoted.chat = m.msg?.contextInfo?.remoteJid || m.chat;
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith("BAE5") && m.quoted.id.length === 16 : false;
            m.quoted.sender = sock.decodeJid(m.msg?.contextInfo?.participant);
            m.quoted.fromMe = m.quoted.sender === sock.decodeJid(sock.user.id);
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || "";
            m.quoted.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];

            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false;
                let q = await store.loadMessage(m.chat, m.quoted.id, conn);
                return exports.smsg(sock, q, store);
            };

            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            });

            m.quoted.delete = () => sock.sendMessage(m.quoted.chat, { delete: vM.key });
            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => sock.copyNForward(jid, vM, forceForward, options);
            m.quoted.download = () => sock.downloadMediaMessage(m.quoted);
        }
    }

    if (m.msg?.url) {
        m.download = () => sock.downloadMediaMessage(m.msg);
    }

    m.text = m.body || "";
    m.reply = (text, chatId = m.chat, options = {}) => 
        Buffer.isBuffer(text) 
            ? sock.sendMedia(chatId, text, "file", "", m, { ...options }) 
            : sock.sendText(chatId, text, m, { ...options });

    m.copy = () => exports.smsg(sock, M.fromObject(M.toObject(m)));
    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => 
        sock.copyNForward(jid, m, forceForward, options);

    return m;
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.bold.yellow("index.js di perbarui.."));
  delete require.cache[file]
  require(file)
})