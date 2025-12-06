import type { Request, Response } from 'express';
import { sendEmailService, type SendRfpParams } from '../config/mail.config.js';
import multiparty from 'multiparty';
import fs from 'fs';
import path from 'path';
import { simpleParser, type Attachment as MailAttachment } from 'mailparser';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/db.js';
import { generateResponse } from './llm.controller.js';
import { proposalPrompt } from '../prompts/proposal.prompt.js';

export async function sendEmailController(req: Request, res: Response) {
  try {

    const payload = req.body as SendRfpParams;

    if (!payload?.to || !payload?.subject || (!payload.text && !payload.html)) {
      return res.status(400).json({ success: false, message: 'Missing required fields: to, subject, text/html' });
    }

    const result = await sendEmailService(payload);
    return res.status(200).json({ success: true, message: 'Email sent', data: result });
  } catch (error: any) {
    console.error('Email controller error:', error);
    return res.status(500).json({ success: false, message: error?.message || 'Failed to send email' });
  }
}

export async function sendEmailToMultipleVendorsController(req: Request, res: Response) {
  try {
    const { vendorIds, rfpId, subject, text, html, senderName, senderEmail } = req.body;

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'vendorIds is required and must be a non-empty array' 
      });
    }

    if (!subject || (!text && !html)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: subject, text/html' 
      });
    }

    const vendors = await prisma.vendor.findMany({
      where: {
        id: {
          in: vendorIds
        }
      },
      select: {
        id: true,
        contactEmail: true,
        name: true
      }
    });

    if (vendors.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No vendors found with the provided IDs' 
      });
    }

    const results = [];
    const errors = [];

    for (const vendor of vendors) {
      try {
        const emailParams: SendRfpParams = {
          rfpId: rfpId || null,
          vendorId: vendor.id,
          to: vendor.contactEmail,
          subject,
          text,
          html,
          senderName,
          senderEmail
        };

        const result = await sendEmailService(emailParams);
        results.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          email: vendor.contactEmail,
          status: 'sent',
          result
        });
      } catch (error: any) {
        console.error(`Failed to send email to vendor ${vendor.id}:`, error);
        errors.push({
          vendorId: vendor.id,
          vendorName: vendor.name,
          email: vendor.contactEmail,
          status: 'failed',
          error: error?.message || 'Unknown error'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Emails sent to ${results.length} out of ${vendors.length} vendors`,
      data: {
        sent: results,
        failed: errors,
        summary: {
          total: vendors.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });

  } catch (error: any) {
    console.error('Send to multiple vendors error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error?.message || 'Failed to send emails to vendors' 
    });
  }
}


const DO_REGION = process.env.DO_SPACES_REGION!;
const DO_BUCKET = process.env.DO_SPACES_NAME!;
const DO_ENDPOINT = process.env.DO_SPACES_ENDPOINT || `https://${DO_REGION}.digitaloceanspaces.com`;
const DO_KEY = process.env.DO_SPACES_KEY!;
const DO_SECRET = process.env.DO_SPACES_SECRET!;
const DO_CDN = process.env.DO_SPACES_CDN_URL || null;
const PUBLIC_OBJECTS = (process.env.DO_PUBLIC_OBJECTS || 'true') === 'true';

if (!DO_KEY || !DO_SECRET || !DO_BUCKET || !DO_REGION) {
  console.warn('Warning: DO Spaces env vars are not completely set. Attachments upload will fail without DO_SPACES_KEY/SECRET/NAME/REGION.');
}

const s3 = new S3Client({
  region: DO_REGION,
  endpoint: DO_ENDPOINT,
  credentials: {
    accessKeyId: DO_KEY || '',
    secretAccessKey: DO_SECRET || '',
  },
  forcePathStyle: false,
});

async function uploadBufferToSpaces(buffer: Buffer, filename: string, contentType?: string) {
  const safeName = filename.replace(/\s+/g, '_');
  const key = `inbound/${uuidv4()}__${safeName}`;

  const cmd = new PutObjectCommand({
    Bucket: DO_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: PUBLIC_OBJECTS ? 'public-read' : undefined,
  });

  await s3.send(cmd);

  const url = DO_CDN ? `${DO_CDN.replace(/\/$/, '')}/${key}` : `https://${DO_BUCKET}.${DO_REGION}.digitaloceanspaces.com/${key}`;
  return { key, url, size: buffer.length, contentType: contentType || null };
}

function extractTokenFromRecipient(recipient: string | undefined | null) {
  if (!recipient) return null;
  const m = recipient.match(/rfp\+([^@>]+)@/i);
  return m ? m[1] : null;
}

function extractRefFromSubject(subject?: string | null) {
  if (!subject) return null;
  const m = subject.match(/\[REF:([^\]]+)\]/i);
  return m ? m[1] : null;
}

function extractLatestMessageContent(emailBody: string): string {
  if (!emailBody) return '';
  
  const replyPatterns = [
    /\n\s*On .+? wrote:\s*\n/i,           // On date, name wrote:
    /\n\s*From:.+?\n/i,                    // "From: [name]"
    /\n\s*-{3,}\s*Original Message\s*-{3,}/i, // "Original Messag"
    /\n\s*>{1,}\s+/,                       // Lines starting with > (quoted text)
  ];
  
  let latestContent = emailBody;
  
  let earliestIndex = emailBody.length;
  for (const pattern of replyPatterns) {
    const match = emailBody.match(pattern);
    if (match && match.index !== undefined && match.index < earliestIndex) {
      earliestIndex = match.index;
    }
  }
  
  if (earliestIndex < emailBody.length) {
    latestContent = emailBody.substring(0, earliestIndex);
  }
  
  latestContent = latestContent
    .trim()
    .replace(/^\s*>{1,}\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')   
    .trim();
  
  return latestContent;
}


export async function inboundHandler(req: Request, res: Response) {
  try {
    const token = (req.query.token as string) || '';
    if (!token || token !== process.env.SENDGRID_INBOUND_TOKEN) {
      return res.status(401).send('invalid token');
    }
    if (req.method !== 'POST') return res.status(405).send('method not allowed');

    const form = new multiparty.Form();
    const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const rawEmail = fields?.email ? (Array.isArray(fields.email) ? fields.email[0] : fields.email) : null;
    let parsed: any = {
      from: null,
      to: null,
      subject: null,
      text: null,
      html: null,
      headers: new Map(),
      attachments: [],
      messageId: null,
    };

    // console.log(fields,"harsh")

    if (rawEmail) {
      parsed = await simpleParser(rawEmail);
      // console.log(parsed,"manish")
    } else {
      parsed = {
        from: Array.isArray(fields.from) ? fields.from[0] : fields.from?.[0] || fields.sender?.[0] || null,
        to: Array.isArray(fields.to) ? fields.to : fields.to || fields.recipient || [],
        subject: Array.isArray(fields.subject) ? fields.subject[0] : fields.subject?.[0] || '',
        text: Array.isArray(fields.text) ? fields.text[0] : fields.text?.[0] || fields['body-plain']?.[0] || '',
        html: Array.isArray(fields.html) ? fields.html[0] : fields.html?.[0] || '',
        headers: new Map(),
        attachments: [],
        messageId: null,
      };
    }

    const attachmentsMeta: Array<{ filename: string; key: string; url: string; size: number; contentType?: string | null }> = [];

    if (files && Object.keys(files).length > 0) {
      for (const key of Object.keys(files)) {
        for (const f of files[key]) {
          const tmpPath = f.path;
          const originalName = f.originalFilename || f.filename || path.basename(tmpPath);
          const buffer = fs.readFileSync(tmpPath);
          const contentType = f.headers?.['content-type'] || null;

          const uploaded = await uploadBufferToSpaces(buffer, originalName, contentType || undefined);
          attachmentsMeta.push({ filename: originalName, key: uploaded.key, url: uploaded.url, size: uploaded.size, contentType: uploaded.contentType });

          try { fs.unlinkSync(tmpPath); } catch (e) { /* ignore */ }
        }
      }
    }

    if (parsed.attachments && parsed.attachments.length) {
      for (const a of parsed.attachments as MailAttachment[]) {
        const buffer = a.content as Buffer;
        const filename = a.filename || `attachment-${uuidv4()}`;
        const uploaded = await uploadBufferToSpaces(buffer, filename, a.contentType || undefined);
        attachmentsMeta.push({ filename, key: uploaded.key, url: uploaded.url, size: uploaded.size, contentType: uploaded.contentType });
      }
    }

    const fromAddress =
      parsed.from?.value?.[0]?.address ||
      (typeof parsed.from === 'string' ? parsed.from : null) ||
      (Array.isArray(fields.from) ? fields.from[0] : fields.from?.[0]) ||
      null;

    const toList: string[] = [];
    if (parsed.to) {
      if (typeof parsed.to === 'string') toList.push(parsed.to);
      else if (Array.isArray(parsed.to)) toList.push(...parsed.to.map((t: any) => (t && t.address) || String(t)));
      else if (parsed.to?.value) toList.push(...parsed.to.value.map((v: any) => v.address));
    } else if (fields.to) {
      toList.push(...(Array.isArray(fields.to) ? fields.to : [fields.to]));
    }

    const subject = parsed.subject || (Array.isArray(fields.subject) ? fields.subject[0] : fields.subject?.[0] || '');

    let inReplyTo: string | null = null;
    try {
      if (parsed.headers && typeof parsed.headers.get === 'function') {
        inReplyTo = parsed.headers.get('in-reply-to') || parsed.headers.get('references') || null;
      }
    } catch (e) {
      console.log(e)
    }

    if (!inReplyTo) {
      inReplyTo = (Array.isArray(fields['In-Reply-To']) ? fields['In-Reply-To'][0] : fields['In-Reply-To']) || null;
    }

   
    const parsedMessageId = (parsed.messageId || parsed.messageId?.toString()) || null;

    let matchedSent: any = null;

    if (inReplyTo) {
      const cleaned = (inReplyTo || '').toString().trim();
      matchedSent = await prisma.sentRFP.findFirst({ where: { messageId: cleaned } });

      console.log(matchedSent,"harsh")
    }

    if (!matchedSent && parsedMessageId) {
      matchedSent = await prisma.sentRFP.findFirst({ where: { messageId: parsedMessageId } });
    }

    console.log(matchedSent,"harsh")

    if (!matchedSent) {
      const joinedTo = toList.join(', ');
      const token = extractTokenFromRecipient(joinedTo) || extractRefFromSubject(subject);
      if (token) {
        matchedSent = await prisma.sentRFP.findFirst({ where: { referenceId: token } }).catch(() => null);
      }
    }

    let fallbackVendor: any = null;
    if (!matchedSent && fromAddress) {
      fallbackVendor = await prisma.vendor.findFirst({ where: { contactEmail: fromAddress } });
      if (fallbackVendor) {
        const recent = await prisma.sentRFP.findFirst({
          where: { vendorId: fallbackVendor.id },
          orderBy: { createdAt: 'desc' },
        });
        if (recent) matchedSent = recent;
      }
    }

    let rfpId: string;
    let vendorId: string;

    if (matchedSent) {
      rfpId = matchedSent.rfpId;
      vendorId = matchedSent.vendorId;
    } else {
      if (!fallbackVendor && fromAddress) {
        fallbackVendor = await prisma.vendor.findFirst({
          where: { contactEmail: fromAddress },
        });

        if (!fallbackVendor) {
          const vendorName = parsed.from?.value?.[0]?.name || fromAddress.split('@')[0];
          fallbackVendor = await prisma.vendor.create({
            data: {
              name: vendorName,
              contactEmail: fromAddress,
              notes: 'Auto-created from inbound email',
              password: 'unknown-vendor-placeholder',
            },
          });
        }
      }

      if (!fallbackVendor) {
        fallbackVendor = await prisma.vendor.findFirst({
          where: { contactEmail: 'unknown@unknown.com' },
        });

        if (!fallbackVendor) {
          fallbackVendor = await prisma.vendor.create({
            data: {
              name: 'Unknown Vendor',
              contactEmail: 'unknown@unknown.com',
              notes: 'Placeholder for unmatched inbound emails',
              password: 'unknown-vendor-placeholder',
            },
          });
        }
      }

      const fallbackRfp = await prisma.rFP.findFirst({
        where: { title: 'Unmatched Inbound Proposals' },
      });

      if (fallbackRfp) {
        rfpId = fallbackRfp.id;
      } else {
        const systemUser = await prisma.user.findFirst({
          where: { email: 'system@albatrosscoder.live' },
        });

        let createdById: string;
        if (!systemUser) {
          const newSystemUser = await prisma.user.create({
            data: {
              email: 'system@albatrosscoder.live',
              username: 'system',
              password: 'not-applicable',
              name: 'System User',
            },
          });
          createdById = newSystemUser.id;
        } else {
          createdById = systemUser.id;
        }

        const newFallbackRfp = await prisma.rFP.create({
          data: {
            title: 'Unmatched Inbound Proposals',
            descriptionRaw: 'Container for proposals that could not be matched to an existing RFP',
            requirements: {},
            referenceToken: `fallback-${uuidv4()}`,
            createdById,
          },
        });
        rfpId = newFallbackRfp.id;
      }

      vendorId = fallbackVendor.id;
    }

    const createdProposal = await prisma.proposal.create({
      data: {
        rfpId,
        vendorId,
        sentRfpReference: matchedSent?.referenceId ?? null,
        rawEmailBody: parsed.text || parsed.html || "",
        attachmentsMeta: attachmentsMeta.length ? attachmentsMeta : [],
        parsedAt: new Date(),
        priceUsd: null,
        lineItems: {},
        deliveryDays: null,
        warrantyMonths: null,
        paymentTerms: null,
        completenessScore: null,
      },
    });

    try {
      const emailBody = parsed.text || parsed.html || "";
      if (emailBody && emailBody.trim().length > 10) {
        const latestContent = extractLatestMessageContent(emailBody);
        
        if (latestContent && latestContent.length > 5) {
          console.log('Parsing proposal with AI...');
          console.log('Latest content extracted:', latestContent.substring(0, 200));
          
          const aiResponse = await generateResponse(latestContent, proposalPrompt);
          
          let cleanedResponse = aiResponse.trim();
          if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          
          const parsedData = JSON.parse(cleanedResponse);
          
          await prisma.proposal.update({
            where: { id: createdProposal.id },
            data: {
              priceUsd: parsedData.priceUsd || createdProposal.priceUsd,
              lineItems: parsedData.lineItems || createdProposal.lineItems,
              deliveryDays: parsedData.deliveryDays || createdProposal.deliveryDays,
              warrantyMonths: parsedData.warrantyMonths || createdProposal.warrantyMonths,
              paymentTerms: parsedData.paymentTerms || createdProposal.paymentTerms,
              completenessScore: parsedData.completenessScore || createdProposal.completenessScore,
            },
          });
          
          console.log('Proposal parsed and updated successfully');
        } else {
          console.log('Latest content too short, skipping AI parsing');
        }
      }
    } catch (aiError) {
      console.error('Failed to parse proposal with AI:', aiError);
    }

    if (matchedSent) {
      try {
        await prisma.sentRFP.update({
          where: { id: matchedSent.id },
          data: { status: 'DELIVERED' },
        });
      } catch (e) {
        console.warn('Failed to update SentRFP status', e);
      }
    }

    return res.status(200).json({ ok: true, createdProposalId: createdProposal.id });
  } catch (err) {
    console.error('Inbound handler error', err);
    return res.status(500).json({ ok: false, error: (err as any)?.message || 'internal' });
  }
}

