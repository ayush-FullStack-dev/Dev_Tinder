export const ringtone = {
    incoming: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/server/default_ringtone_incoming.mp3`,
    ringBack: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/server/default_ringtone_ringback.mp3`
};

export const busy = {
    incoming: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/server/busy_icoming_tone.mp3`,
    ringBack: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/server/busy_ringback_tone.mp3`
};

export const tone = {
    hold: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/server/call_hold_tone.mp3`
};
