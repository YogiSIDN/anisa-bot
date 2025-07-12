const fs = require('fs');
const { tmpdir } = require('os');
const Crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Convert image to WebP format
 * @param {Buffer} media - Image buffer
 * @returns {Promise<Buffer>} - WebP buffer
 */
async function imageToWebp(media) {
    const tmpFileOut = getTempFilePath('.webp');
    const tmpFileIn = getTempFilePath('.jpg');

    fs.writeFileSync(tmpFileIn, media);

    await convertToWebp(tmpFileIn, tmpFileOut);

    const buff = fs.readFileSync(tmpFileOut);
    cleanupFiles([tmpFileOut, tmpFileIn]);
    return buff;
}

/**
 * Convert video to WebP format
 * @param {Buffer} media - Video buffer
 * @returns {Promise<Buffer>} - WebP buffer
 */
async function videoToWebp(media) {
    const tmpFileOut = getTempFilePath('.webp');
    const tmpFileIn = getTempFilePath('.mp4');

    fs.writeFileSync(tmpFileIn, media);

    await convertToWebp(tmpFileIn, tmpFileOut, [
        '-loop', '0',
        '-ss', '00:00:00',
        '-t', '00:00:05',
        '-preset', 'default',
        '-an', '-vsync', '0'
    ]);

    const buff = fs.readFileSync(tmpFileOut);
    cleanupFiles([tmpFileOut, tmpFileIn]);
    return buff;
}

/**
 * Write Exif metadata to image
 * @param {Buffer} media - Image buffer
 * @param {Object} metadata - Metadata object
 * @returns {Promise<string>} - Path to the output file
 */
async function writeExifImg(media, metadata) {
    const wMedia = await imageToWebp(media);
    return writeExifMetadata(wMedia, metadata);
}

/**
 * Write Exif metadata to video
 * @param {Buffer} media - Video buffer
 * @param {Object} metadata - Metadata object
 * @returns {Promise<string>} - Path to the output file
 */
async function writeExifVid(media, metadata) {
    const wMedia = await videoToWebp(media);
    return writeExifMetadata(wMedia, metadata);
}

/**
 * Write Exif metadata to media
 * @param {Object} media - Media object with mimetype and data
 * @param {Object} metadata - Metadata object
 * @returns {Promise<string>} - Path to the output file
 */
async function writeExif(media, metadata) {
    const wMedia = /webp/.test(media.mimetype) ? media.data :
        /image/.test(media.mimetype) ? await imageToWebp(media.data) :
        /video/.test(media.mimetype) ? await videoToWebp(media.data) : '';
    return writeExifMetadata(wMedia, metadata);
}

/**
 * Generate a temporary file path
 * @param {string} extension - File extension
 * @returns {string} - Temporary file path
 */
function getTempFilePath(extension) {
    return path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}${extension}`);
}

/**
 * Convert media to WebP format using ffmpeg
 * @param {string} inputPath - Input file path
 * @param {string} outputPath - Output file path
 * @param {string[]} additionalOptions - Additional FFmpeg options
 * @returns {Promise<void>}
 */
function convertToWebp(inputPath, outputPath, additionalOptions = []) {
    return new Promise((resolve, reject) => {
        const args = [
            '-i', inputPath,
            '-vcodec', 'libwebp',
            '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=30, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
            ...additionalOptions,
            outputPath
        ];

        const ffmpegProcess = spawn('ffmpeg', args);

        ffmpegProcess.on('error', reject);
        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg process exited with code ${code}`));
            }
        });
    });
}

/**
 * Write Exif metadata to WebP file using webpmux
 * @param {Buffer} media - Media buffer
 * @param {Object} metadata - Metadata object
 * @returns {Promise<string>} - Path to the output file
 */
async function writeExifMetadata(media, metadata) {
    const tmpFileIn = getTempFilePath('.webp');
    const tmpFileOut = getTempFilePath('.webp');
    fs.writeFileSync(tmpFileIn, media);

    if (metadata.packname || metadata.author) {
        const json = {
            'sticker-pack-id': 'https://rest.api-otakuwibu.my.id',
            'sticker-pack-name': metadata.packname,
            'sticker-pack-publisher': metadata.author,
            'emojis': metadata.categories ? metadata.categories : ['']
        };
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
        const exif = Buffer.concat([exifAttr, jsonBuff]);
        exif.writeUIntLE(jsonBuff.length, 14, 4);

        const exifFile = getTempFilePath('.exif');
        fs.writeFileSync(exifFile, exif);

        const args = [
            '-set', 'exif', exifFile,
            tmpFileIn,
            '-o', tmpFileOut
        ];

        const webpmuxProcess = spawn('webpmux', args);

        await new Promise((resolve, reject) => {
            webpmuxProcess.on('error', reject);
            webpmuxProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Webpmux process exited with code ${code}`));
                }
            });
        });

        fs.unlinkSync(exifFile);
        fs.unlinkSync(tmpFileIn);
        return tmpFileOut;
    }
}

/**
 * Clean up temporary files
 * @param {string[]} files - Array of file paths to delete
 */
function cleanupFiles(files) {
    files.forEach(file => fs.unlinkSync(file));
}

module.exports = { imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif };