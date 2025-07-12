const axios = require("axios");
const cheerio = require("cheerio");

class Komiku {
  static async fetchList(query) {
    return new Promise((resolve, reject) => {
      axios
        .get(`https://api.komiku.id/?post_type=manga&s=${encodeURIComponent(query)}`)
        .then((response) => {
          const html = response.data;
          const $ = cheerio.load(html);

          const mangaList = [];

          $(".bge").each((index, element) => {
            const title = $(element).find(".kan a h3").text().trim();
            const image = $(element).find(".bgei a img").attr("src");
            const chAwal = $(element).find(".kan .new1").first().find("a span").last().text().trim();
            const chLatest = $(element).find(".kan .new1").last().find("a span").last().text().trim();
            const path = $(element).find('a').attr('href')
            const url = `https://komiku.id${path}`

            let description = $(element).find(".kan p").text().trim();
            description = description.replace(/Update\s+\d+\s+.*?\.\s*/, "");

            mangaList.push({ title, image, chAwal, chLatest, description, url });
          });

          if (mangaList.length > 0) {
            resolve({
              status: 200,
              dev: "@mysu_019",
              data: mangaList,
            });
          } else {
            resolve({
              status: 404,
              dev: "@mysu_019",
              message: "Manga tidak ditemukan",
            });
          }
        })
        .catch(() => {
          reject({
            status: 500,
            dev: "@mysu_019",
            message: "Terjadi kesalahan pada server",
          });
        });
    });
  }

  static async fetchDetails(url) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
          "Referer": "https://komiku.id/",
          "Accept-Encoding": "gzip, deflate, br",
          "Cookie": "__ddg1_=1740455519; __ddg2_=Z66bb9f0y5xculKd4; __ddg9_=202.10.61.165",
        },
        maxRedirects: 5,
      });

      const $ = cheerio.load(data);

      const cover = $("img[itemprop='image']").attr("src");
      const title = $("table.inftable").find("tr").eq(0).find("td").eq(1).text().trim();
      const type = $("table.inftable").find("tr").eq(2).find("td").text().trim().replace("Jenis Komik", "").trim();
      const concept = $("table.inftable").find("tr").eq(3).find("td").text().trim().replace("Konsep Cerita", "").trim();
      const author = $("table.inftable").find("tr").eq(4).find("td").text().trim().replace("Pengarang", "").trim();
      const status = $("table.inftable").find("tr").eq(5).find("td").text().trim().replace("Status", "").trim();
      const age_of_reader = $("table.inftable").find("tr").eq(6).find("td").text().trim().replace("Umur Pembaca", "").trim();
      const how_to_read = $("table.inftable").find("tr").eq(7).find("td").text().trim().replace("Cara Baca", "").trim();
      const genres = $("ul.genre > li > a")
        .map((i, el) => $(el).text().trim())
        .get()
        .join(", ");

      let description = $("p.desc").text().trim();
      description = description.replace(/Update\s+\d+\s+.*?\.\s*/, "");

      const chapters = [];
      $("tr").each((index, element) => {
        let chapterTitle = $(element).find(".judulseries a span").text().trim();
        const chapterUrl = $(element).find(".judulseries a").attr("href");
        const views = $(element).find(".pembaca i").text().trim();
        const releaseDate = $(element).find(".tanggalseries").text().trim();

        chapterTitle = chapterTitle.replace(/Chapter\s*/i, "").trim();

        if (chapterTitle && chapterUrl) {
          chapters.push({
            ch: chapterTitle,
            url: `https://komiku.id${chapterUrl}`,
            views,
            releaseDate,
          });
        }
      });

      if (title) {
        return {
          status: 200,
          dev: "@mysu_019",
          data: {
            title,
            type,
            genres,
            concept,
            author,
            status,
            age_of_reader,
            how_to_read,
            description,
            cover,
            chapters,
          },
        };
      } else {
        return {
          status: 404,
          dev: "@mysu_019",
          message: "Manga tidak ditemukan",
        };
      }
    } catch (error) {
      return {
        status: 500,
        dev: "@mysu_019",
        message: "Terjadi kesalahan pada server",
      };
    }
  }

  static async fetchChapters(url) {
    try {
      const match = url.match(/https:\/\/komiku.id\/([^\/]+)-chapter-\d+(-\d+)*\//);
      const newUrl = match ? `https://komiku.id/manga/${match[1]}` : url;

      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const detail = await Komiku.fetchDetails(newUrl);

      let title = $("h2").first().text().trim();
      title = title.replace(/Komik\s+/i, "");

      const chapters = [];
      $("#Baca_Komik img").each((i, el) => {
        const src = $(el).attr("src");
        if (src) chapters.push(src);
      });

      const cover = detail.data.cover;

      return {
        status: 200,
        dev: "@mysu_019",
        result: {
          title,
          cover,
          chapters,
        },
      };
    } catch (error) {
      return {
        status: 500,
        dev: "@mysu_019",
        message: "Terjadi kesalahan pada server",
      };
    }
  }
}

module.exports = Komiku;