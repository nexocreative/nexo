import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad · Nexo",
  description: "Cómo tratamos tus datos personales en Nexo.",
};

export default function PrivacidadPage() {
  const titularesNombres = LEGAL.titulares.map((t) => t.nombre).join(" y ");

  return (
    <LegalPage title="Política de privacidad">
      <p>
        Esta política explica, en cumplimiento del Reglamento (UE) 2016/679 (RGPD) y de la Ley Orgánica
        3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), qué datos
        personales tratamos cuando usas Nexo, para qué, durante cuánto tiempo, con quién los compartimos
        y qué derechos tienes.
      </p>

      <h2>1. Responsables del tratamiento</h2>
      <ul>
        {LEGAL.titulares.map((t) => (
          <li key={t.nif}>
            <strong>{t.nombre}</strong> — NIF {t.nif}
          </li>
        ))}
      </ul>
      <p>
        Domicilio: {LEGAL.domicilio}. Email de contacto para cualquier asunto de privacidad:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Dado el tamaño y la naturaleza del proyecto,
        no tenemos obligación legal de designar un Delegado de Protección de Datos (DPD); cualquier
        consulta puedes dirigirla directamente a ese correo.
      </p>

      <h2>2. Qué datos tratamos</h2>
      <p>Según cómo uses Nexo, podemos tratar:</p>
      <ul>
        <li>
          <strong>Datos de cuenta:</strong> email, nombre, contraseña (cifrada, nunca en texto plano) o,
          si entras con Google, el identificador, nombre y foto de perfil que Google nos facilita con tu
          autorización.
        </li>
        <li>
          <strong>Datos financieros que tú introduces:</strong> movimientos (importe, fecha, categoría,
          comercio, descripción), ingresos, gastos recurrentes, presupuestos y límites, categorías de
          ahorro y aportaciones, y datos de tus viajes (&ldquo;Vacaciones&rdquo;) y de gastos compartidos
          con otras personas (&ldquo;En conjunto&rdquo;), incluido el nombre o email de las personas que
          invitas a un grupo.
        </li>
        <li>
          <strong>Imágenes y audio que subes voluntariamente:</strong> fotos de tickets/recibos (guardadas
          de forma privada) y grabaciones de voz para registrar un gasto (se procesan para transcribirlas
          y extraer los datos del gasto; no se conservan como archivo de audio una vez procesadas).
        </li>
        <li>
          <strong>Archivos de extractos bancarios</strong> que subas para importar movimientos en bloque
          (CSV/Excel). Antes de enviar su contenido a nuestro proveedor de IA para normalizarlo,
          enmascaramos automáticamente datos sensibles reconocibles (IBAN, DNI/NIE, números largos tipo
          tarjeta o cuenta).
        </li>
        <li>
          <strong>Datos de pago:</strong> si contratas Nexo Plus, el pago lo procesa Stripe directamente;
          nosotros no almacenamos el número de tu tarjeta, solo el estado de tu suscripción y la fecha de
          renovación.
        </li>
        <li>
          <strong>Datos técnicos:</strong> dirección IP, identificador de sesión, tipo de dispositivo y
          navegador, y el token necesario para enviarte notificaciones push si las activas.
        </li>
      </ul>

      <h2>3. Con qué finalidad y con qué base legal</h2>
      <table>
        <thead>
          <tr>
            <th>Finalidad</th>
            <th>Base legal (RGPD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Crear y gestionar tu cuenta, y prestarte el Servicio (registrar y mostrar tus finanzas)</td>
            <td>Ejecución de un contrato (art. 6.1.b) — nuestros Términos/Aviso Legal</td>
          </tr>
          <tr>
            <td>Extraer datos de tickets, voz o extractos con IA cuando lo usas voluntariamente</td>
            <td>Ejecución de un contrato, a tu iniciativa expresa en cada caso</td>
          </tr>
          <tr>
            <td>Gestionar gastos compartidos e invitaciones a grupos con otras personas usuarias</td>
            <td>Ejecución de un contrato / interés legítimo en el buen funcionamiento del grupo</td>
          </tr>
          <tr>
            <td>Cobrar la suscripción Nexo Plus</td>
            <td>Ejecución de un contrato</td>
          </tr>
          <tr>
            <td>Enviarte emails operativos (confirmación, avisos de presupuesto, invitaciones)</td>
            <td>Ejecución de un contrato / interés legítimo</td>
          </tr>
          <tr>
            <td>Enviarte notificaciones push, si las activas</td>
            <td>Consentimiento (puedes desactivarlas cuando quieras)</td>
          </tr>
          <tr>
            <td>Seguridad, prevención de fraude y cumplimiento de obligaciones legales</td>
            <td>Interés legítimo / obligación legal</td>
          </tr>
        </tbody>
      </table>
      <p>
        No usamos tus datos financieros para elaborar perfiles con fines publicitarios ni se los vendemos
        a nadie.
      </p>

      <h2>4. Cuánto tiempo conservamos tus datos</h2>
      <p>
        Conservamos tus datos mientras mantengas tu cuenta activa. Si la eliminas, borramos tus datos
        personales y financieros salvo que debamos conservar algunos durante los plazos exigidos por la
        normativa fiscal o mercantil (por ejemplo, datos de facturación, si llegan a existir). Los
        archivos de audio de voz no se conservan tras extraer el gasto; las imágenes de tickets se
        conservan mientras exista el movimiento asociado, en un almacenamiento privado no accesible
        públicamente.
      </p>

      <h2>5. Con quién compartimos tus datos</h2>
      <p>
        No cedemos tus datos a terceros para que los usen con sus propios fines. Sí trabajamos con
        proveedores que tratan datos por nuestra cuenta (encargados del tratamiento), bajo contrato y
        únicamente para prestar el Servicio:
      </p>
      <ul>
        <li><strong>Supabase</strong> — base de datos y almacenamiento de archivos (tickets).</li>
        <li>
          <strong>OpenAI</strong> — procesa fotos de tickets, audio de voz y extractos bancarios (ya
          enmascarados) para extraer y categorizar los datos del gasto cuando usas esas funciones. OpenAI
          tiene su sede en EE. UU.; esta transferencia internacional de datos se realiza al amparo de las
          garantías previstas por OpenAI para clientes de su API (cláusulas contractuales tipo de la
          Comisión Europea).
        </li>
        <li><strong>Stripe</strong> — procesa los pagos de la suscripción Nexo Plus.</li>
        <li><strong>Resend</strong> — envía los emails transaccionales de la aplicación.</li>
        <li><strong>Vercel</strong> — aloja la aplicación web.</li>
        <li>
          <strong>Google</strong> — si eliges iniciar sesión con Google, actúa como proveedor de
          identidad.
        </li>
      </ul>
      <p>
        Cuando alguno de estos proveedores trata datos fuera del Espacio Económico Europeo, se apoya en
        cláusulas contractuales tipo aprobadas por la Comisión Europea u otro mecanismo de transferencia
        válido conforme al RGPD.
      </p>

      <h2>6. Tus derechos</h2>
      <p>Puedes ejercer en cualquier momento, escribiendo a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>:</p>
      <ul>
        <li><strong>Acceso:</strong> saber qué datos tuyos tratamos.</li>
        <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
        <li><strong>Supresión:</strong> pedir que borremos tus datos (también puedes borrar tu cuenta desde la app).</li>
        <li><strong>Oposición:</strong> oponerte a un tratamiento concreto.</li>
        <li><strong>Limitación:</strong> pedir que restrinjamos el tratamiento de tus datos.</li>
        <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado (por ejemplo, puedes exportar tus movimientos a CSV desde la propia app).</li>
      </ul>
      <p>
        Si consideras que no hemos atendido correctamente tu solicitud, tienes derecho a reclamar ante la
        Agencia Española de Protección de Datos (AEPD):{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noreferrer">www.aepd.es</a>.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables para proteger tus datos: contraseñas
        cifradas, comunicaciones bajo HTTPS, aislamiento de los datos de cada persona usuaria a nivel de
        base de datos (Row Level Security) y acceso restringido a los archivos que subes. Ningún sistema
        es invulnerable al 100 %, pero trabajamos para mantener estas medidas actualizadas.
      </p>

      <h2>8. Menores de edad</h2>
      <p>
        Nexo no está dirigido a menores de 18 años. Si detectamos que una cuenta pertenece a una persona
        menor de edad, podremos suspenderla o eliminarla.
      </p>

      <h2>9. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política para reflejar cambios en el Servicio o en la normativa aplicable.
        Te avisaremos de cambios relevantes y siempre encontrarás la versión vigente en esta página.
      </p>

      <h2>10. Contacto</h2>
      <p>
        {titularesNombres} — <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
    </LegalPage>
  );
}
