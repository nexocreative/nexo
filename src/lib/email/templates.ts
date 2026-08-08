// El logo debe verse en el cliente de correo del destinatario, que nunca podrá
// acceder a un NEXTAUTH_URL de localhost: se sirve siempre desde el dominio
// de producción, aunque el resto del email (enlaces) use el entorno actual.
const LOGO_URL = "https://finanzasnexo.es/logo-nexo-email.png";

const FONT_STACK =
  "'Plus Jakarta Sans', Arial, Helvetica, sans-serif";

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#FCFBFE;font-family:${FONT_STACK};color:#262339;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;">
      <tr>
        <td style="text-align:center;padding-bottom:24px;">
          <img src="${LOGO_URL}" alt="Nexo" width="88" style="display:inline-block;height:auto;" />
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff;border:1px solid #E7E4F1;border-radius:16px;padding:40px 32px;">
          <h1 style="font-family:${FONT_STACK};font-size:20px;font-weight:700;margin:0 0 16px;color:#262339;">${title}</h1>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="text-align:center;padding-top:24px;">
          <p style="font-family:${FONT_STACK};font-size:12px;color:#7A7693;margin:0;">Nexo · finanzasnexo.es</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(link: string, label: string): string {
  return `<table role="presentation" style="margin-top:24px;">
    <tr>
      <td style="border-radius:12px;background:#A89EE8;">
        <a href="${link}" style="display:inline-block;padding:12px 24px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

export function passwordResetEmail({ link }: { link: string }): string {
  return layout(
    "Recupera tu contraseña",
    `<p style="font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:#44415A;margin:0;">
      Pediste restablecer tu contraseña en Nexo. El enlace caduca en 1 hora.
      Si no fuiste tú, ignora este email: tu contraseña seguirá siendo la misma.
    </p>
    ${button(link, "Restablecer contraseña")}`,
  );
}

export function grupoInviteEmail({
  grupoName,
  inviterName,
  link,
  needsAccount = false,
}: {
  grupoName: string;
  inviterName: string;
  link: string;
  needsAccount?: boolean;
}): string {
  const intro = needsAccount
    ? `<strong>${inviterName}</strong> te invitó al grupo <strong>${grupoName}</strong> en Nexo para compartir gastos.
       Crea tu cuenta gratis con este email para verla y unirte.`
    : `<strong>${inviterName}</strong> te invitó al grupo <strong>${grupoName}</strong> en Nexo para compartir gastos.`;
  return layout(
    "Te han invitado a un grupo",
    `<p style="font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:#44415A;margin:0;">
      ${intro}
    </p>
    ${button(link, needsAccount ? "Crear cuenta y unirme" : "Ver invitación")}`,
  );
}

export function grupoGastoEmail({
  grupoName,
  payerName,
  description,
  amount,
  share,
  link,
}: {
  grupoName: string;
  payerName: string;
  description: string;
  amount: number;
  share: number;
  link: string;
}): string {
  return layout(
    "Nuevo gasto compartido",
    `<p style="font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:#44415A;margin:0;">
      <strong>${payerName}</strong> registró un gasto de <strong>${amount.toFixed(2)} €</strong>
      (${description}) en el grupo <strong>${grupoName}</strong>. Tu parte es de
      <strong>${share.toFixed(2)} €</strong>.
    </p>
    ${button(link, "Ver el grupo")}`,
  );
}
