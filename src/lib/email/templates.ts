function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
      <tr><td>
        <p style="font-size:14px;letter-spacing:0.05em;text-transform:uppercase;color:#71717a;margin:0 0 16px;">Nexo</p>
        <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
        ${bodyHtml}
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(link: string, label: string): string {
  return `<a href="${link}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;">${label}</a>`;
}

export function passwordResetEmail({ link }: { link: string }): string {
  return layout(
    "Recupera tu contraseña",
    `<p style="font-size:14px;line-height:1.5;color:#3f3f46;">
      Pediste restablecer tu contraseña en Nexo. El enlace caduca en 1 hora.
      Si no fuiste tú, ignora este email.
    </p>
    ${button(link, "Restablecer contraseña")}`,
  );
}

export function grupoInviteEmail({
  grupoName,
  inviterName,
  link,
}: {
  grupoName: string;
  inviterName: string;
  link: string;
}): string {
  return layout(
    "Te han invitado a un grupo",
    `<p style="font-size:14px;line-height:1.5;color:#3f3f46;">
      <strong>${inviterName}</strong> te invitó al grupo <strong>${grupoName}</strong> en Nexo para compartir gastos.
    </p>
    ${button(link, "Ver invitación")}`,
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
    `<p style="font-size:14px;line-height:1.5;color:#3f3f46;">
      <strong>${payerName}</strong> registró un gasto de <strong>${amount.toFixed(2)} €</strong>
      (${description}) en el grupo <strong>${grupoName}</strong>. Tu parte es de
      <strong>${share.toFixed(2)} €</strong>.
    </p>
    ${button(link, "Ver el grupo")}`,
  );
}
