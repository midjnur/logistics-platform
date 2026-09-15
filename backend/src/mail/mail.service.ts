import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private fromAddress: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromAddress =
      process.env.RESEND_FROM_EMAIL || 'Logistics Platform <onboarding@resend.dev>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not set — emails will be logged instead of sent. Add it to backend/.env to enable delivery.',
      );
    }
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!to) return;

    if (!this.resend) {
      this.logger.debug(`[email not sent, no RESEND_API_KEY] to=${to} subject="${subject}"`);
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(`Resend rejected email to ${to}: ${JSON.stringify(error)}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err}`);
    }
  }

  /**
   * Wraps a title + message in a minimal branded HTML shell.
   * Kept deliberately simple (no external CSS/images) for maximum email-client compatibility.
   */
  renderNotificationEmail(title: string, message: string, ctaLabel?: string, ctaUrl?: string): string {
    const cta =
      ctaLabel && ctaUrl
        ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${ctaLabel}</a>`
        : '';

    return `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;padding:32px 16px;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;">Logistics Platform</p>
          <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${title}</h1>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">${message}</p>
          ${cta}
        </div>
      </div>
    `;
  }
}
