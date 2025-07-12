const axios = require("axios");
const crypto = require("crypto");

class SaveTube {
  constructor() {
    this.api = {
      base: "https://media.savetube.me/api",
      cdn: "/random-cdn",
      info: "/v2/info",
      download: "/download"
    };

    this.headers = {
      "accept": "*/*",
      "content-type": "application/json",
      "origin": "https://yt.savetube.me",
      "referer": "https://yt.savetube.me/",
      "user-agent": "Postify/1.0.0"
    };

    this.formats = ["144", "240", "360", "480", "720", "1080", "mp3"];
  }

  hexToBuffer(hexString) {
    return Buffer.from(hexString.match(/.{1,2}/g).join(""), "hex");
  }

  async decrypt(enc) {
    try {
      const secretKey = "C5D58EF67A7584E4A29F6C35BBC4EB12";
      const data = Buffer.from(enc, "base64");
      const iv = data.slice(0, 16);
      const content = data.slice(16);
      const key = this.hexToBuffer(secretKey);

      const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
      let decrypted = decipher.update(content);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return JSON.parse(decrypted.toString());
    } catch (error) {
      throw new Error(error.message);
    }
  }

  isUrl(str) {
    try {
      new URL(str);
      return true;
    } catch (_) {
      return false;
    }
  }

  extractYoutubeId(url) {
    if (!url) return null;
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];
    for (let pattern of patterns) {
      if (pattern.test(url)) return url.match(pattern)[1];
    }
    return null;
  }

  async request(endpoint, data = {}, method = "post") {
    try {
      const { data: response } = await axios({
        method,
        url: `${endpoint.startsWith("http") ? "" : this.api.base}${endpoint}`,
        data: method === "post" ? data : undefined,
        params: method === "get" ? data : undefined,
        headers: this.headers
      });
      return { status: true, code: 200, data: response };
    } catch (error) {
      return { status: false, code: error.response?.status || 500, error: error.message };
    }
  }

  async getCDN() {
    const response = await this.request(this.api.cdn, {}, "get");
    return response.status ? { status: true, code: 200, data: response.data.cdn } : response;
  }

  async download(link, format) {
    if (!link) {
      return { status: false, code: 400, error: "Linknya mana? Yakali download kagak ada linknya 🗿" };
    }

    if (!this.isUrl(link)) {
      return { status: false, code: 400, error: "Lu masukin link apaan sih 🗿 Link Youtube aja bree, kan lu mau download youtube 👍🏻" };
    }

    if (!format || !this.formats.includes(format)) {
      return { status: false, code: 400, error: "Formatnya kagak ada bree, pilih yang udah disediain aja yak, jangan nyari yang gak ada 🗿", available_fmt: this.formats };
    }

    const id = this.extractYoutubeId(link);
    if (!id) {
      return { status: false, code: 400, error: "Kagak bisa ekstrak link youtubenya nih, btw link youtubenya yang bener yak.. biar kagak kejadian begini lagi 😂" };
    }

    try {
      const cdnx = await this.getCDN();
      if (!cdnx.status) return cdnx;
      const cdn = cdnx.data;

      const result = await this.request(`https://${cdn}${this.api.info}`, { url: `https://www.youtube.com/watch?v=${id}` });
      if (!result.status) return result;
      const decrypted = await this.decrypt(result.data.data);

      const dl = await this.request(`https://${cdn}${this.api.download}`, {
        id: id,
        downloadType: format === "mp3" ? "audio" : "video",
        quality: format === "mp3" ? "128" : format,
        key: decrypted.key
      });

      return {
        status: true,
        code: 200,
        result: {
          title: decrypted.title || "Gak tau 🤷🏻",
          type: format === "mp3" ? "audio" : "video",
          format: format,
          thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          download: dl.data.data.downloadUrl,
          id: id,
          key: decrypted.key,
          duration: decrypted.duration,
          quality: format === "mp3" ? "128" : format,
          downloaded: dl.data.data.downloaded || false
        }
      };

    } catch (error) {
      return { status: false, code: 500, error: error.message };
    }
  }
}

module.exports = SaveTube;