export const ringtone = {
    incoming: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/server/default_ringtone_incoming.mp3`,
    ringBack: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/server/default_ringtone_ringback.mp3`
};
