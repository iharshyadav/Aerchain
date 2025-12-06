import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const REGION = process.env.DO_SPACES_REGION!;
const BUCKET = process.env.DO_SPACES_NAME!;
const ENDPOINT = process.env.DO_SPACES_ENDPOINT || `https://${REGION}.digitaloceanspaces.com`;
const CDN = process.env.DO_SPACES_CDN_URL || null;

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
  forcePathStyle: false, 
});

export async function uploadPublicBufferToSpaces(buffer: Buffer, filename: string, contentType?: string) {
  const key = `inbound/${uuidv4()}__${filename.replace(/\s+/g, '_')}`;
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read",
  });
  await s3.send(cmd);

  if (CDN) {
    return { key, url: `${CDN.replace(/\/$/, '')}/${key}` };
  }

  const publicUrl = `https://${BUCKET}.${REGION}.digitaloceanspaces.com/${key}`;

  const presignUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn: 60 * 60 }
  );

   console.log(publicUrl)

  return { key, url: publicUrl };
}