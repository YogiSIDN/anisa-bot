const { exec } = require('child_process');
const fs = require('fs');

exports.ytdl = async (url, format, callback) => {
    let command;
    const tempFilePath = `/tmp/video.${format === 'mp3' ? 'mp3' : 'mp4'}`;

    if (format === 'mp3') {
        command = `yt-dlp --cookies cookies.txt -f bestaudio --extract-audio --audio-format mp3 --output "${tempFilePath}" --print-json "${url}"`;
    } else if (format === 'mp4') {
        command = `yt-dlp --cookies cookies.txt -f "136+bestaudio[ext=m4a]/134+bestaudio[ext=m4a]" --merge-output-format mp4 --output "${tempFilePath}" --print-json "${url}"`;
    } else {
        return callback({ error: 'Invalid format. Choose "mp3" or "mp4".' });
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return callback({ error: error.message });
        }

        if (stderr) {
            console.warn(`stderr: ${stderr}`);
        }

        try {
            const videoData = JSON.parse(stdout);
            const result = {
                id: videoData.id,
                title: videoData.title,
                thumbnail: videoData.thumbnail,
                description: videoData.description,
                url_download: tempFilePath,  // Mengirimkan path file atau URL, bukan buffer
                channel: videoData.uploader,
                views: videoData.view_count || 'N/A',
                duration: videoData.duration ? (videoData.duration / 60).toFixed(2) + ' minutes' : 'N/A',
                filesize: videoData.filesize ? (videoData.filesize / (1024 * 1024)).toFixed(2) + ' MB' : videoData.filesize_approx ? (videoData.filesize_approx / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A'
            };
            callback(result);

            // Menghapus file sementara setelah proses selesai
            fs.unlink(tempFilePath, (unlinkError) => {
                if (unlinkError) {
                    console.warn(`Failed to delete temp file: ${unlinkError.message}`);
                }
            });
        } catch (parseError) {
            console.error(`Error parsing JSON: ${parseError.message}`);
            return callback({ error: 'Error parsing JSON output.' });
        }
    });
};