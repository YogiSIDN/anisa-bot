const fs = require("fs")
const path = require("path")
const chalk =  require("chalk")
const archiver = require("archiver")
const { exec } = require("child_process")

/**
 * Melakukan git clone dan mengompres folder hasil clone.
 * @param {string} repoUrl - URL repository Git.
 * @param {string} targetDir - Direktori tempat repository akan di-clone.
 * @param {string} format - Format kompresi ('zip' atau 'tar.gz').
 * @returns {Promise<string>} - Path file terkompres.
 */
function gitCloneAndCompress(repoUrl, targetDir, format) {
    return new Promise((resolve, reject) => {
        // Validasi format
        if (format !== 'zip' && format !== 'tar.gz') {
            reject(new Error('Format yang didukung hanya zip atau tar.gz.'));
            return;
        }

        // Nama folder hasil clone
        const repoName = repoUrl.split('/').pop().replace('.git', '');
        const cloneDir = path.join(targetDir, repoName);

        // Perintah git clone
        const cloneCommand = `git clone ${repoUrl} ${cloneDir}`;

        // Jalankan git clone
        exec(cloneCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error saat git clone: ${stderr}`);
                reject(error);
                return;
            }

            console.log(`Repository berhasil di-clone: ${cloneDir}`);

            // Kompres folder hasil clone
            const outputFilePath = path.join(targetDir, `${repoName}.${format}`);
            const output = fs.createWriteStream(outputFilePath);
            const archive = archiver(format === 'zip' ? 'zip' : 'tar', {
                gzip: format === 'tar.gz', // Kompres dengan gzip jika format tar.gz
            });

            output.on('close', () => {
                console.log(`Folder berhasil dikompres: ${outputFilePath}`);
                resolve(outputFilePath);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive.directory(cloneDir, false); // Tambahkan folder ke arsip
            archive.finalize();
        });
    });
}

/**
 * Mengirim file sebagai dokumen dan menghapusnya setelah berhasil dikirim.
 * @param {object} sock - Objek socket WhatsApp.
 * @param {string} jid - ID penerima (grup atau pengguna).
 * @param {string} filePath - Path file yang akan dikirim.
 * @param {string} fileName - Nama file yang akan ditampilkan.
 * @param {string} mimetype - MIME type file.
 */
async function sendAndDeleteFile(sock, jid, filePath, fileName, mimetype) {
    try {
        // Baca file sebagai Buffer
        const fileBuffer = fs.readFileSync(filePath);

        // Kirim file sebagai dokumen
        await sock.sendMessage(jid, {
            document: fileBuffer,
            fileName: fileName,
            mimetype: mimetype,
        });

        console.log(`File berhasil dikirim: ${fileName}`);

        // Hapus file setelah berhasil dikirim
        fs.unlinkSync(filePath);
        console.log(`File berhasil dihapus: ${filePath}`);
    } catch (error) {
        console.error('Gagal mengirim atau menghapus file:', error);
    }
}

// Contoh penggunaan
async function clone(sock, jid, repoUrl, format) {
    const targetDir = path.join(__dirname, 'temp');
    const mimetype = format === 'zip' ? 'application/zip' : 'application/gzip';

    try {
        // Clone repository dan kompres folder
        const compressedFilePath = await gitCloneAndCompress(repoUrl, targetDir, format);

        // Kirim file dan hapus setelah berhasil dikirim
        const fileName = path.basename(compressedFilePath);
        await sendAndDeleteFile(sock, jid, compressedFilePath, fileName, mimetype);

        // Hapus folder hasil clone
        const repoName = repoUrl.split('/').pop().replace('.git', '');
        const cloneDir = path.join(targetDir, repoName);
        fs.rmSync(cloneDir, { recursive: true });
        console.log(`Folder hasil clone berhasil dihapus: ${cloneDir}`);
    } catch (error) {
        console.error('Gagal mengunduh, mengirim, atau menghapus repository:', error);
    }
}

module.exports = {
    clone
}

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.bold.yellow("git-clone.js di perbarui.."));
  delete require.cache[file];
  require(file);
});