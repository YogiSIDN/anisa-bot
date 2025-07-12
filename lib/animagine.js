const axios = require('axios');
const { EventSource } = require('undici');

const session_hash = Math.random().toString(36).slice(2);

async function request(prompt) {
  const data = JSON.stringify({
    "data": [
      prompt,
      "",
      807244162,
      512,
      512,
      7,
      28,
      "Euler a",
      "896 x 1152",
      "(None)",
      "Standard v3.1",
      false,
      0.55,
      1.5,
      true
    ],
    "event_data": null,
    "fn_index": 5,
    "trigger_id": null,
    "session_hash": session_hash
  });

  const config = {
    method: 'POST',
    url: 'https://cagliostrolab-animagine-xl-3-1.hf.space/queue/join?ref=huntscreens.com',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Content-Type': 'application/json',
      'accept-language': 'id-ID',
      'referer': 'https://aianimegenerator.top/',
      'origin': 'https://aianimegenerator.top',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      'priority': 'u=4',
      'te': 'trailers'
    },
    data: data
  };

  const api = await axios.request(config);
  return api.data;
}

async function cekStatus() {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`https://cagliostrolab-animagine-xl-3-1.hf.space/queue/data?session_hash=${session_hash}`); 

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.msg === "process_completed") {
        resolve(data);
        eventSource.close();
      } else if (data.msg === "error") {
        reject(data);
        eventSource.close();
      } else {
        console.log("Event:", data);
      }
    };

    eventSource.onerror = (err) => {
      reject(err);
      eventSource.close();
    };
  }); CC
}

async function create(prompt) {
  try {
    await request(prompt);
    return await cekStatus();
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

async function wcream(prompt) {
    try {
        const { data: nsfw } = await axios.get(`https://1yjs1yldj7.execute-api.us-east-1.amazonaws.com/default/ai_image?prompt=${prompt}&aspect_ratio=Select Aspect Ratio&link=writecream.com`)
        const result = {
            status: 200,
            dev: "@mysu_019",
            url: nsfw.image_link
        }
        return result
    } catch (error) {
        return {
            status: 500,
            dev: "@mysu_019",
            message: "Terjadi kesalahan."
        }
    }
}

module.exports = {
    create,
    wcream
}