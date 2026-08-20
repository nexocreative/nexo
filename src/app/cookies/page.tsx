import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de cookies · Nexo",
  description: "Qué cookies usa Nexo y cómo puedes gestionarlas.",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Política de cookies">
      <p>
        Esta página explica qué cookies y tecnologías similares usa Nexo, de acuerdo con el artículo 22.2
        de la Ley 34/2002 (LSSI-CE) y la Guía sobre el uso de cookies de la Agencia Española de Protección
        de Datos (AEPD).
      </p>

      <h2>1. ¿Qué es una cookie?</h2>
      <p>
        Una cookie es un pequeño archivo que un sitio web guarda en tu navegador para recordar información
        entre visitas o durante tu sesión (por ejemplo, para saber que ya has iniciado sesión). Aquí
        también describimos el uso que hacemos del almacenamiento local del navegador (localStorage) con
        una función equivalente.
      </p>

      <h2>2. Cookies que usamos</h2>
      <p>
        Hoy, Nexo <strong>solo utiliza cookies técnicas o necesarias</strong>, imprescindibles para que la
        aplicación funcione. Este tipo de cookies está exenta del deber de solicitar tu consentimiento
        (art. 22.2 LSSI-CE); aun así, te informamos de cuáles son:
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Finalidad</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>next-auth.session-token</code></td>
            <td>Mantiene tu sesión iniciada.</td>
            <td>Hasta cerrar sesión o caducar (varios días)</td>
          </tr>
          <tr>
            <td><code>next-auth.csrf-token</code></td>
            <td>Protege el formulario de inicio de sesión frente a ataques de falsificación de peticiones.</td>
            <td>Sesión del navegador</td>
          </tr>
        </tbody>
      </table>
      <p>
        Además, guardamos tu preferencia de tema (claro/oscuro/sistema) en el almacenamiento local de tu
        navegador (localStorage), no en una cookie propiamente dicha; no se envía a nuestros servidores.
      </p>

      <h3>2.1 Cookies de analítica y marketing</h3>
      <p>
        Nexo <strong>no usa ninguna cookie de analítica ni de marketing/publicidad</strong> (no tenemos
        Google Analytics, píxeles ni herramientas similares). Si en el futuro incorporamos alguna,
        actualizaremos esta política y añadiremos un mecanismo para pedirte tu consentimiento antes de
        activarla, tal y como exige la ley para las cookies no esenciales.
      </p>

      <h3>2.2 Cookies de terceros</h3>
      <p>
        El pago de la suscripción Nexo Plus se realiza en una página gestionada por Stripe, fuera de{" "}
        {LEGAL.dominio}. Stripe puede establecer sus propias cookies en su dominio, sujetas a su propia
        política: <a href="https://stripe.com/es/privacy" target="_blank" rel="noreferrer">stripe.com/es/privacy</a>.
        Si inicias sesión con Google, Google puede establecer cookies propias durante ese proceso, según su
        política: <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">policies.google.com/privacy</a>.
      </p>

      <h2>3. Cómo desactivar o borrar cookies desde el navegador</h2>
      <p>
        Puedes bloquear o eliminar cookies desde la configuración de tu navegador. Ten en cuenta que si
        bloqueas las cookies necesarias, Nexo dejará de funcionar correctamente (por ejemplo, no podrás
        mantener la sesión iniciada).
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/es/kb/proteccion-mejorada-contra-el-rastreo-firefox-escritorio" target="_blank" rel="noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/es-es/microsoft-edge" target="_blank" rel="noreferrer">Microsoft Edge</a></li>
      </ul>

      <h2>4. Más información</h2>
      <p>
        Para más detalle sobre cómo tratamos tus datos personales, consulta la{" "}
        <a href="/privacidad">Política de Privacidad</a>. Si tienes cualquier duda sobre esta política de
        cookies, escríbenos a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    </LegalPage>
  );
}
