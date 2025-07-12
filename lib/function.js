const fs = require("fs")
const chalk = require("chalk")
const axios = require("axios")
const PDFDocument = require("pdfkit")
const moment = require("moment-timezone")
const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

exports.parseMention = (text = "") => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + "@s.whatsapp.net")
}

exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.getAdmin = (participants) => {
    let admins = []
    for (let i of participants) {
        i.admin === "superadmin" ? admins.push(i.id) :  i.admin === "admin" ? admins.push(i.id) : ""
    }
    return admins || []
}

exports.toPdf = (images, opt = {}) => {
    return new Promise(async (resolve, reject) => {
    if (!Array.isArray(images)) images = [images]
        let buffs = [], doc = new PDFDocument({ margin: 0, size: 'A4' })
        for (let x = 0; x < images.length; x++) {
            if (/.webp|.gif/.test(images[x])) continue
            let data = (await axios.get(images[x], { responseType: 'arraybuffer', ...opt })).data
            doc.image(data, 0, 0, { fit: [595.28, 841.89], align: 'center', valign: 'center' })
            if (images.length != x + 1) doc.addPage()
        }
        doc.on('data', (chunk) => buffs.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(buffs)))
        doc.on('error', (err) => reject(err))
        doc.end()
    })
}

exports.encodeBase62 = (buffer) => {
  let result = '';
  let num = BigInt('0x' + buffer.toString('hex'));

  while (num > 0n) {
    result = BASE62[num % 62n] + result;
    num = num / 62n;
  }

  return result || '0';
}

exports.decodeBase62 = (encoded) => {
  let num = 0n;
  for (let i = 0; i < encoded.length; i++) {
    num = num * 62n + BigInt(BASE62.indexOf(encoded[i]));
  }

  const hex = num.toString(16);
  return Buffer.from(hex, 'hex').toString('utf-8');
}

exports.getGreeting = () => {
    const currentTime = moment().tz('Asia/Jakarta');
    const currentHour = currentTime.hour();
    let greeting;

    if (currentHour >= 5 && currentHour < 12) {
        greeting = 'Ohayou~';
    } else if (currentHour >= 12 && currentHour < 20) {
        greeting = 'Konnichiwa~';
    } else {
        greeting = 'Konbanwa~';
    }

    return greeting;
}

exports.timeConvert = (millis) => {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}
            

exports.getCountdown = (airingAt) => {
    const now = new Date();
    const airingDate = new Date(airingAt * 1000);
    const diff = airingDate - now;
    
    if (diff <= 0) return "Already aired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${days}d / ${hours}h / ${minutes}m / ${seconds}s`;
}

exports.APIs = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        })
        return res.data
    } catch (err) {
        return err
    }
}

exports.getBuffer = async (url, options) => {
	try {
		options ? options : {}
		const res = await axios({
			method: "get",
			url,
			headers: {
				"DNT": 1,
				"Upgrade-Insecure-Request": 1
			},
			...options,
			responseType: "arraybuffer"
		})
		return res.data
	} catch (err) {
		return err
	}
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.bold.yellow("function.js di perbarui.."));
  delete require.cache[file]
  require(file)
})