export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { Resend } from 'resend';
import siteConfig from '@/config/site.config';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.email('Please enter a valid email address'),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  honeypot: z.string().max(0), // Anti-spam: must be empty
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1h
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ── Origin check ──────────────────────────────────────────────────────────────
function isAllowedOrigin(request: Request): boolean {
  if (import.meta.env.DEV) return true;
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const siteUrl = (import.meta.env.SITE_URL || '').replace(/\/$/, '');
  if (!siteUrl) return true;
  if (origin) return origin.startsWith(siteUrl);
  if (referer) return referer.startsWith(siteUrl);
  return false;
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAllowedOrigin(request)) {
    return new Response(JSON.stringify({ success: false, errors: { form: ['Accès refusé.'] } }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!checkRateLimit(getIp(request))) {
    return new Response(
      JSON.stringify({ success: false, errors: { form: ['Trop de messages. Réessaie dans 1 heure.'] } }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData = await request.formData();

    const data = {
      name: formData.get('name')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      subject: formData.get('subject')?.toString() || '',
      message: formData.get('message')?.toString() || '',
      honeypot: formData.get('honeypot')?.toString() || '',
    };

    // Validate
    const result = contactSchema.safeParse(data);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const error of result.error.issues) {
        const field = error.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(error.message);
      }

      return new Response(
        JSON.stringify({ success: false, errors: fieldErrors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Honeypot check (bot detection)
    if (result.data.honeypot) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send email via Resend
    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set');
      return new Response(
        JSON.stringify({ success: false, errors: { form: ['Email service is not configured'] } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(apiKey);

    // CONTACT_TO_EMAIL = adresse privée de réception (jamais exposée publiquement)
    // Fallback sur siteConfig.email si non défini
    const toEmail = import.meta.env.CONTACT_TO_EMAIL || siteConfig.email;
    const fromEmail = import.meta.env.RESEND_FROM_EMAIL || siteConfig.email;
    const siteLabel = siteConfig.name;

    const subject = result.data.subject
      ? `[${siteLabel}] ${result.data.subject}`
      : `[${siteLabel}] New contact from ${result.data.name}`;

    const { error } = await resend.emails.send({
      from: `Contact Form <${fromEmail}>`,
      to: toEmail,
      replyTo: result.data.email,
      subject,
      html: `
        <p><strong>Name:</strong> ${result.data.name}</p>
        <p><strong>Email:</strong> ${result.data.email}</p>
        <p><strong>Message:</strong></p>
        <p>${result.data.message.replace(/\n/g, '<br>')}</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(
        JSON.stringify({ success: false, errors: { form: [error.message || 'Failed to send email'] } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Contact form error:', error);

    return new Response(
      JSON.stringify({ success: false, errors: { form: ['An unexpected error occurred'] } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
