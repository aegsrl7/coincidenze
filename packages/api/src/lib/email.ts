import type { Env } from '../index'

type Bindings = Env['Bindings']

interface SendArgs {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(env: Bindings, args: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY non configurato' }
  }

  const from = env.RESEND_FROM || 'COINCIDENZE <noreply@coincidenze.org>'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` }
  }
  return { ok: true }
}

export function buildTicketEmail(opts: {
  name: string
  ticketUrl: string
  qrUrl: string
}): { subject: string; html: string; text: string } {
  const subject = 'Il tuo accredito · COINCIDENZE · 25 aprile'
  const text = [
    `Ciao ${opts.name},`,
    '',
    'grazie per esserti accreditato a COINCIDENZE · Edizione 1.',
    '',
    'Sabato 25 aprile 2026, Marsam Locanda, Bene Vagienna.',
    '',
    'Conserva questo link: è il tuo biglietto con QR da mostrare all\'ingresso.',
    opts.ticketUrl,
    '',
    'COINCIDENZE',
  ].join('\n')

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F0E8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <tr>
            <td style="background:#2C3E6B;color:#ffffff;padding:24px;text-align:center;">
              <div style="font-family:Georgia,'Playfair Display',serif;font-size:26px;font-weight:600;letter-spacing:0.5px;">COINCIDENZE</div>
              <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.8;margin-top:4px;">Edizione 1 · Biglietto di accredito</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;">
              <div style="font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px;">Ciao</div>
              <div style="font-family:Georgia,'Playfair Display',serif;font-size:24px;color:#2C3E6B;font-weight:600;margin-top:4px;">${escapeHtml(opts.name)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;text-align:center;">
              <div style="display:inline-block;background:#F5F0E8;border-radius:12px;padding:16px;">
                <img src="${opts.qrUrl}" alt="QR" width="220" height="220" style="display:block;" />
              </div>
              <p style="font-size:12px;color:#888;margin:12px 0 0;">Mostra questo QR all'ingresso.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px;text-align:center;">
              <a href="${opts.ticketUrl}" style="display:inline-block;background:#2C3E6B;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500;">
                Apri il biglietto online
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;border-top:1px solid #eee;font-size:14px;color:#555;">
              <p style="margin:0 0 6px;"><strong style="color:#2C3E6B;">Sabato 25 aprile 2026</strong></p>
              <p style="margin:0;color:#777;">Marsam Locanda, Bene Vagienna</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#F5F0E8;font-size:11px;color:#888;text-align:center;font-style:italic;">
              raffinate casualità, occhi attenti
            </td>
          </tr>
        </table>
        <p style="font-size:11px;color:#999;margin-top:16px;max-width:520px;line-height:1.5;">
          Hai ricevuto questa email perché ti sei accreditato sul sito coincidenze.org.<br>
          Se non sei stato tu, puoi ignorare il messaggio.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html, text }
}

export function buildAdminNotificationEmail(opts: {
  name: string
  surname: string
  email: string
  phone: string
  cap: string
  totalCount: number
}): { subject: string; html: string; text: string } {
  const fullName = `${opts.name} ${opts.surname}`.trim()
  const subject = `Nuovo accredito · ${fullName}`
  const text = [
    `Nuovo accredito ricevuto.`,
    ``,
    `Nome: ${fullName}`,
    `Email: ${opts.email}`,
    opts.phone ? `Telefono: ${opts.phone}` : '',
    opts.cap ? `CAP: ${opts.cap}` : '',
    ``,
    `Totale iscritti: ${opts.totalCount}`,
    ``,
    `Lista completa: https://coincidenze.org/admin/accrediti`,
  ].filter(Boolean).join('\n')

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F0E8;padding:24px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid rgba(44,62,107,0.1);">
        <tr><td style="background:#2C3E6B;color:#ffffff;padding:16px 20px;">
          <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.75;">COINCIDENZE · Admin</div>
          <div style="font-family:Georgia,'Playfair Display',serif;font-size:18px;font-weight:600;margin-top:2px;">Nuovo accredito</div>
        </td></tr>
        <tr><td style="padding:20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;color:#333;">
            <tr><td style="padding:6px 0;color:#888;width:90px;">Nome</td><td style="padding:6px 0;font-weight:500;color:#2C3E6B;">${escapeHtml(fullName)}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(opts.email)}" style="color:#2C3E6B;text-decoration:none;">${escapeHtml(opts.email)}</a></td></tr>
            ${opts.phone ? `<tr><td style="padding:6px 0;color:#888;">Telefono</td><td style="padding:6px 0;">${escapeHtml(opts.phone)}</td></tr>` : ''}
            ${opts.cap ? `<tr><td style="padding:6px 0;color:#888;">CAP</td><td style="padding:6px 0;">${escapeHtml(opts.cap)}</td></tr>` : ''}
          </table>
        </td></tr>
        <tr><td style="padding:14px 20px;background:#F5F0E8;border-top:1px solid #eee;font-size:13px;color:#555;text-align:center;">
          Totale iscritti: <strong style="color:#2C3E6B;">${opts.totalCount}</strong>
        </td></tr>
        <tr><td style="padding:16px 20px;text-align:center;">
          <a href="https://coincidenze.org/admin/accrediti" style="display:inline-block;background:#2C3E6B;color:#ffffff;text-decoration:none;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:500;">
            Apri lista accrediti
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html, text }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
