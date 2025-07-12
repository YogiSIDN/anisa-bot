const fs = require("fs")
const chalk = require("chalk")
const { JSDOM } = require("jsdom")
const fetch = require("node-fetch")
const FormData = require("form-data")

async function webpToImage(source) {
	let form = new FormData()
	let isUrl = typeof source === "string" && /https?:\/\//.test(source)
	form.append("new-image-url", isUrl ? source : "")
	form.append("new-image", isUrl ? "" : source, "image.webp")
	let res = await fetch("https://ezgif.com/webp-to-mp4", {
		method: "POST",
		body: form,
	})
	let html = await res.text()
	let { document } = new JSDOM(html).window
	let form2 = new FormData()
	let obj = {}
	for (let input of document.querySelectorAll("form input[name]")) {
		obj[input.name] = input.value
		form2.append(input.name, input.value)
	}
	let res2 = await fetch("https://ezgif.com/webp-to-mp4/" + obj.file, {
		method: "POST",
		body: form2,
	})
	let html2 = await res2.text()
	let { document: document2 } = new JSDOM(html2).window
	return new URL(document2.querySelector("div#output > p.outfile > video > source").src, res2.url).toString()
}

async function webpToVideo(source) {
	let form = new FormData()
	let isUrl = typeof source === "string" && /https?:\/\//.test(source)
	form.append("new-image-url", isUrl ? source : "")
	form.append("new-image", isUrl ? "" : source, "image.webp")
	let res = await fetch("https://ezgif.com/webp-to-png", {
		method: "POST",
		body: form,
	})
	let html = await res.text()
	let { document } = new JSDOM(html).window
	let form2 = new FormData()
	let obj = {}
	for (let input of document.querySelectorAll("form input[name]")) {
		obj[input.name] = input.value
		form2.append(input.name, input.value)
	}
	let res2 = await fetch("https://ezgif.com/webp-to-png/" + obj.file, {
		method: "POST",
		body: form2,
	})
	let html2 = await res2.text()
	let { document: document2 } = new JSDOM(html2).window
	return new URL(document2.querySelector("div#output > p.outfile > img").src, res2.url).toString()
}

module.exports = {
    webpToImage,
    webpToVideo
}

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.bold.yellow("convert.js di perbarui.."));
  delete require.cache[file];
  require(file);
});