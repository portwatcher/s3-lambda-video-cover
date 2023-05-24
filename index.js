import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import ffmpeg from 'fluent-ffmpeg'
import { readFile } from 'fs/promises'
import { region, width } from './config.js'
import sharp from 'sharp'


ffmpeg.setFfmpegPath('./ffmpeg')
ffmpeg.setFfprobePath('./ffprobe')


export const handler = async (event) => {
  const s3 = new S3Client({ region })  // Adjust region as needed

  const bucket = event.Records[0].s3.bucket.name
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '))
  const ext = key.split('.').pop()
  console.log('111111111111', ext)
  if (ext === 'png') {
    return
  }
  console.log('2222222')

  return new Promise(async (resolve, reject) => {
    try {
      const videoFile = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      console.log('3333333333333')
  
      ffmpeg(videoFile.Body)
        .screenshots({
          timestamps: ['00:00:01'],  // Extract the frame at 1 second
          filename: 'cover.png',
          folder: '/tmp'  // Write the cover image to the temporary directory
        })
        .on('end', async function () {
          console.log('4444444444444444')
  
          // Once the cover has been generated, upload it back to S3
          const buffer = await readFile('/tmp/cover.png')
          console.log('5555555555555555')
  
          const resizedBuffer = await sharp(buffer).resize(width).toBuffer()
          console.log('666666666666666')
  
          await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: `${key}/cover.png`,
            Body: resizedBuffer,
            ContentType: 'image',
          }))
          console.log(`Cover successfully uploaded to ${bucket}/${key}/cover.png`)
          resolve()
        })
    } catch (err) {
      reject(err)
    }
  })
}
