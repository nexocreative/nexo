import "server-only";
import { resendClient } from "./resend";

const DEFAULT_FROM = "Nexo <noreply@finanzasnexo.es>";

/**
 * Envía un email vía Resend. Nunca lanza: si falta la API key (todavía no se
 * ha creado la cuenta de Resend) o el envío falla (p. ej. destinatario no
 * autorizado porque aún no hay dominio verificado), solo se loguea. Los
 * flujos que disparan emails (invitar a un grupo, registrar un gasto
 * compartido) no deben romperse por un fallo de entrega de correo.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY no configurada, no se envía: "${subject}" -> ${to}`);
    return;
  }

  const { error } = await resendClient().emails.send({
    from: process.env.EMAIL_FROM ?? DEFAULT_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error(`[email] Error enviando "${subject}" a ${to}:`, error);
  }
}
