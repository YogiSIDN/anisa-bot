const fs = require("fs");
const chalk = require("chalk");
const axios = require("axios");
const https = require("https");

const agent = new https.Agent({
    rejectUnauthorized: true,
    maxVersion: "TLSv1.3",
    minVersion: "TLSv1.2"
});

async function getCookies() {
    try {
        const response = await axios.get("https://www.pinterest.com/csrf_error/", { httpsAgent: agent });

        // Pastikan respons sukses
        if (response.status !== 200) {
            throw new Error(`Gagal mendapatkan cookies, status: ${response.status}`);
        }

        const setCookieHeaders = response.headers["set-cookie"];
        if (setCookieHeaders) {
            const cookies = setCookieHeaders.map(cookieString => {
                const cookieParts = cookieString.split(";");
                return cookieParts[0].trim();
            });
            return cookies.join("; ");
        }

        return null;
    } catch (error) {
        console.error("Error saat mendapatkan cookies:", error.message);
        return null;
    }
}

async function pinterest(query) {
    try {
        const cookies = await getCookies();
        if (!cookies) return [];

        const url = "https://www.pinterest.com/resource/BaseSearchResource/get/";
        const params = {
            source_url: encodeURI(`/search/pins/?q=${query}`),
            data: JSON.stringify({
                options: {
                    isPrefetch: false,
                    query: query,
                    scope: "pins",
                    no_fetch_context_on_resource: false
                },
                context: {}
            }),
            _: Date.now()
        };

        const headers = {
            "accept": "application/json, text/javascript, */*, q=0.01",
            "accept-encoding": "gzip, deflate",
            "accept-language": "en-US,en;q=0.9",
            "cookie": cookies,
            "dnt": "1",
            "referer": "https://www.pinterest.com/",
            "sec-ch-ua": "\"Not(A:Brand)\";v=\"99\", \"Microsoft Edge\";v=\"133\", \"Chromium\";v=\"133\"",
            "sec-ch-ua-full-version-list": "\"Not(A:Brand)\";v=\"99.0.0.0\", \"Microsoft Edge\";v=\"133.0.3065.92\", \"Chromium\";v=\"133.0.6943.142\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-model": "",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-ch-ua-platform-version": "\"10.0.0\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
            "x-app-version": "c056fb7",
            "x-pinterest-appstate": "active",
            "x-pinterest-pws-handler": "www/[username]/[slug].js",
            "x-pinterest-source-url": "/hargr003/cat-pictures/",
            "x-requested-with": "XMLHttpRequest"
        };

        const { data } = await axios.get(url, { httpsAgent: agent, headers, params });

        if (!data.resource_response || !data.resource_response.data || !data.resource_response.data.results) {
            throw new Error("Data tidak ditemukan dalam respons.");
        }

        return data.resource_response.data.results
            .filter(v => v.images?.orig)
            .map(result => ({
                upload_by: result.pinner.username,
                fullname: result.pinner.full_name,
                followers: result.pinner.follower_count,
                caption: result.grid_title,
                image: result.images.orig.url,
                source: `https://id.pinterest.com/pin/${result.id}`
            }));
    } catch (error) {
        console.error("Error saat mengambil data Pinterest:", error.message);
        return [];
    }
}

module.exports = {
    pinterest
};

// Watch file untuk perubahan otomatis
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.bold.yellow("pinterest.js diperbarui.."));
    delete require.cache[file];
    require(file);
});