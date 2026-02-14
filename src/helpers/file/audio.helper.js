import ffmpeg from "fluent-ffmpeg";

export const getAudioDuration = filePath =>
    new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration);
        });
    });
