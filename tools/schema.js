const mongoose = require("mongoose")

const commandSchema = new mongoose.Schema({
    hash: { type: String, required: true, unique: true },
    text: { type: String, default: "" },
    mentionedJid: { type: [String], default: [] },
    creator: { type: String, default: "" },
    at: { type: Date, default: Date.now },
    locked: { type: Boolean, default: false }
})

const chatSchema = new mongoose.Schema({
    chatId: String,
    limitGroup: {
        main: { type: Number, default: 100 },
        usage: { type: Number, default: 0 },
        time: { type: Number, default: 0 }
    },
    limitMp3: {
        main: { type: Number, default: 25 },
        usage: { type: Number, default: 0 },
        time: { type: Number, default: 0 }
    },
    groupType: { type: String, default: "free" },
    mute: { type: Boolean, default: false },
    ecchi: { type: Boolean, default: false },
    hentai: { type: Boolean, default: false },
    rules: { type: Boolean, default: false },
    games: { type: Boolean, default: false },
    welcome: { type: Boolean, default: false },
    farewell: { type: Boolean, default: false },
    enhanced: { type: Boolean, default: false },
    komiku: { type: Boolean, default: false },
    ncode: { type: Boolean, default: false },
    blocked: {
        status: { type: Boolean, default: false },
        reason: { type: String, default: "" },
        time: { type: Number, default: 0 }
    }
})

const Chat = mongoose.model("Chat", chatSchema);
const Scmd = mongoose.model("Scmd", commandSchema);

module.exports = { Chat, Scmd }
