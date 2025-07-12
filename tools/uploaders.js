const fs = require("fs")
const axios = require("axios")
const BodyForm = require("form-data")

async function toCatbox(filePath) {
    return new Promise(async (resolve, reject) => {
        const form = new BodyForm();
        form.append("reqtype", "fileupload");
        form.append("userhash", "");
        form.append("fileToUpload", fs.createReadStream(filePath));

        try {
            const response = await axios({
                url: "https://catbox.moe/user/api.php",
                method: "POST",
                headers: {
                    ...form.getHeaders(),
                },
                data: form
            });
            resolve(response.data);
        } catch (error) {
            reject(error);
        }
    });
}

async function toUguu(filePath) {
	return new Promise (async (resolve, reject) => {
			const form = new BodyForm();
			form.append("files[]", fs.createReadStream(filePath))
			await axios({
				url: "https://uguu.se/upload.php",
				method: "POST",
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
					...form.getHeaders()
				},
				data: form
			}).then((data) => {
				resolve(data.data.files[0])
			}).catch((err) => reject(err))
	})
}

async function toAnonFiles(filePath) {
    return new Promise(async (resolve, reject) => {
        const form = new BodyForm();
        form.append("file", fs.createReadStream(filePath));
        await axios({
            url: "https://www.anonfile.la/process/upload_file",
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
                "Origin": "https://www.anonfile.la",
                "Referer": "https://www.anonfile.la/",
                "Cookie": "PHPSESSID=5e5s1tgsa4l5roI21nvcuk1o2s", 
                ...form.getHeaders(),
            },
            data: form,
        })
        .then((response) => {
            resolve(response.data); 
        })
        .catch((err) => reject(err));
    });
}

module.exports = {
    toUguu,
    toCatbox,
    toAnonFiles
}