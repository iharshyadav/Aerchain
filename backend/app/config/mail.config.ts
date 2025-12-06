import sgMail from '@sendgrid/mail';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import prisma from '../database/db.js';
dotenv.config();

if (!process.env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY is required');
if (!process.env.REPLY_DOMAIN) throw new Error('REPLY_DOMAIN is required');
if (!process.env.SENDGRID_FROM_EMAIL) throw new Error('SENDGRID_FROM_EMAIL is required');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const emailConfig = {
  from: process.env.SENDGRID_FROM_EMAIL,
  fromName: process.env.SENDGRID_FROM_NAME || 'AerChain',
};

export type SendRfpParams = {
  rfpId?: string | null;
  vendorId?: string | null;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  senderName?: string;
  senderEmail?: string;
};

export async function sendEmailService(params: SendRfpParams) {
  const { rfpId = null, vendorId = null, to, subject, text = '', html: htmlOverride, senderName, senderEmail } = params;

  if (!to || !subject || (!text && !htmlOverride)) {
    throw new Error('Missing required fields: to, subject, text/html');
  }

  const referenceId = `rfp:${rfpId ?? 'unknown'}:sent:${uuidv4()}`;

  const messageId = `<rfp-${uuidv4()}@${process.env.REPLY_DOMAIN}>`;

  const sentRow = await prisma.sentRFP.create({
    data: {
      rfpId: rfpId ?? '',
      vendorId: vendorId ?? '',
      referenceId,           
      messageId,            
      status: 'DRAFT',
      createdAt: new Date(),
    },
  });

  const replyToAddress = `${process.env.SENDGRID_FROM_EMAIL}`;

  const htmlBody = htmlOverride ?? `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;background:#f4f4f4;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
            <tr><td style="background:#4f46e5;padding:30px;text-align:center;color:#fff;">
              <h1 style="margin:0;font-size:22px;">${emailConfig.fromName}</h1>
            </td></tr>
            <tr><td style="padding:30px;color:#333;font-size:15px;line-height:1.5;">
              ${text}
              <p style="margin-top:20px;color:#555;font-size:13px;">Reference ID: <code>${referenceId}</code></p>
            </td></tr>
            <tr><td style="background:#fafafa;padding:18px;text-align:center;color:#6b7280;font-size:12px;border-top:1px solid #eee">
              Sent via ${emailConfig.fromName}${senderEmail ? ` by ${senderEmail}` : ''}
              <div style="margin-top:6px;">© ${new Date().getFullYear()} ${emailConfig.fromName}</div>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const msg: any = {
    to,
    from: {
      email: emailConfig.from,
      name: senderName || emailConfig.fromName,
    },
    replyTo: replyToAddress,
    subject: `${subject}`, 
    text: text || undefined,
    html: htmlBody,
    headers: {
      'Message-ID': messageId,         
      'X-Reference-ID': referenceId,   
      'X-Mailer': emailConfig.fromName,
    },
    trackingSettings: { clickTracking: { enable: true }, openTracking: { enable: true } },
    mailSettings: { bypassListManagement: { enable: false }, footer: { enable: false }, sandboxMode: { enable: false } },
    customArgs: { referenceId, rfpId: rfpId ?? '', vendorId: vendorId ?? '' },
  };

  try {
    const response = await sgMail.send(msg);

    const updated = await prisma.sentRFP.update({
      where: { id: sentRow.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        replyTo: replyToAddress,
      },
    });

    return {
      success: true,
      sentRfp: {
        id: updated.id,
        referenceId: updated.referenceId,
        messageId: updated.messageId,
        status: updated.status,
        replyTo: updated.replyTo,
      },
    };
  } catch (err: any) {
    try {
      await prisma.sentRFP.update({
        where: { id: sentRow.id },
        data: { status: 'FAILED' },
      });
    } catch (e) {}

    console.error('SendGrid error:', err?.message || err);
    throw new Error(`Failed to send email: ${err?.message || String(err)}`);
  }
}

export default sendEmailService;
