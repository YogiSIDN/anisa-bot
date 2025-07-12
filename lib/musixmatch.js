const axios = require('axios');
const crypto = require('crypto');

class Musixmatch {
  constructor() {
    this.api = {
      base: "https://www.musixmatch.com/ws/1.1/",
      search: "https://www.musixmatch.com/search",
      signatureKey: "https://s.mxmcdn.net/site/js/"
    };

    this.headers = {
      'authority': 'www.musixmatch.com',
      'accept': 'application/json',
      'accept-language': 'en-US,en;q=0.9',
      'cookie': 'mxm_bab=AB',
      'origin': 'https://www.musixmatch.com',
      'referer': 'https://www.musixmatch.com/',
      'user-agent': 'Postify/1.0.0'
    };

    this.secret = null;
  }

  async getSecret() {
    if (this.secret) return this.secret;
    const api = await axios.get(this.api.search, { headers: this.headers })
      .then(res => res.data.match(/src="([^"]*\/_next\/static\/chunks\/pages\/_app-[^"]+\.js)"/)[1])
      .catch(() => ({ error: "Kagak nemu link signature key nya bree, manual aja yak.. itu signature nya dah gua kasih 👍🏻" }));
    if (api.error) return api;
    
    return axios.get(api, { headers: this.headers })
      .then(res => {
        const match = res.data.match(/from\(\s*"(.*?)"\s*\.split/);
        if (!match) return { error: "Sorry bree, stringnya kagak ada 🙃" };
        this.secret = Buffer.from(match[1].split('').reverse().join(''), 'base64').toString('utf-8');
        return this.secret;
      })
      .catch(error => ({ error: error.message }));
  }

  async signature(url) {
    if (!this.secret) {
      const secret = await this.getSecret();
      if (secret.error) return secret;
    }
    const date = new Date();
    const message = url + date.getFullYear() + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0');
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(message);
    return "&signature=" + encodeURIComponent(hmac.digest('base64')) + "&signature_protocol=sha256";
  }

  async request(endpoint, params = {}) {
    const url = `${this.api.base}${endpoint}?` + new URLSearchParams({ ...params, app_id: 'community-app-v1.0', format: 'json' });
    const signature = await this.signature(url);
    if (signature.error) return signature;
    return axios.get(url + signature, { headers: this.headers })
      .then(res => res.data)
      .catch(error => ({ error: error.message }));
  }

  searchTracks(track_query, page = 1) {
    if (!track_query) return Promise.resolve({ error: "Query Tracknya mana?" });
    return this.request("track.search", { q: track_query, f_has_lyrics: 'true', page_size: 100, page, country: 'id' });
  }

  getTrack(trackId, trackIsrc) {
    if (!trackId && !trackIsrc) return Promise.resolve({ error: "" });
    return this.request("track.get", trackId ? { trackId } : { trackIsrc });
  }

  getTrackLyrics(trackId, trackIsrc) {
    if (!trackId && !trackIsrc) return Promise.resolve({ error: "Sorry bree, Track ID atau Track Isrc kudu diinput yak..." });
    return this.request("track.lyrics.get", trackId ? { trackId } : { trackIsrc });
  }

  getArtistChart(page = 1) {
    return this.request("chart.artists.get", { country: 'id', page_size: 100, page });
  }

  getTrackChart(page = 1) {
    return this.request("chart.tracks.get", { country: 'id', page_size: 100, page });
  }

  searchArtist(query, page = 1) {
    if (!query) return Promise.resolve({ error: "Query penyanyinya mana??" });
    return this.request("artist.search", { q_artist: query, page_size: 100, page, country: 'id' });
  }

  getArtist(artistId) {
    if (!artistId) return Promise.resolve({ error: "ID Penyanyi nya mana?? Kudu input juga atuh 🗿" });
    return this.request("artist.get", { artistId });
  }

  getArtistAlbums(artistId, page = 1) {
    if (!artistId) return Promise.resolve({ error: "ID Penyanyi nya mana?? Kudu input juga atuh 🗿" });
    return this.request("artist.albums.get", { artistId, page_size: 100, page, g_album_name: 1 });
  }

  getAlbum(albumId) {
    if (!albumId) return Promise.resolve({ error: "ID Album nya mana?? Kudu input juga atuh 🗿" });
    return this.request("album.get", { albumId });
  }

  getAlbumTracks(albumId, page = 1) {
    if (!albumId) return Promise.resolve({ error: "ID Album nya mana?? Kudu input juga atuh 🗿" });
    return this.request("album.tracks.get", { albumId, page_size: 100, page });
  }

  getTrackLyricsTranslation(trackId, language) {
    if (!trackId || !language) return Promise.resolve({ error: "ID Track ama Bahasanya kudu diInputkan juga yak bree 👍🏻" });
    return this.request("crowd.track.translations.get", { trackId, language });
  }
}

module.exports = Musixmatch;