import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos y condiciones · Nexo",
  description: "Condiciones de uso y contratación de Nexo y Nexo Plus.",
};

export default function TerminosPage() {
  const titularesNombres = LEGAL.titulares.map((t) => t.nombre).join(" y ");

  return (
    <LegalPage title="Términos y condiciones">
      <p>
        Estos Términos y Condiciones regulan el uso de Nexo y la contratación de la suscripción de pago
        opcional &ldquo;Nexo Plus&rdquo;. Completan el <a href="/aviso-legal">Aviso Legal</a> y la{" "}
        <a href="/privacidad">Política de Privacidad</a>, que también te aplican. Al crear una cuenta o
        contratar Nexo Plus, aceptas estas condiciones.
      </p>

      <h2>1. Quién presta el servicio</h2>
      <p>
        Nexo es prestado por {titularesNombres} (ver identificación completa en el{" "}
        <a href="/aviso-legal">Aviso Legal</a>), con contacto en{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>2. El servicio: plan gratuito y Nexo Plus</h2>
      <p>
        Nexo te permite registrar y organizar tus finanzas personales (ingresos, gastos, ahorro, límites,
        viajes y gastos compartidos con otras personas). El plan gratuito incluye las funciones básicas,
        con algunas limitaciones (por ejemplo, historial de meses disponibles o número de usos de las
        funciones de inteligencia artificial). La suscripción <strong>Nexo Plus</strong> amplía esas
        limitaciones y da acceso a funciones adicionales, tal y como se describen en cada momento dentro
        de la propia aplicación.
      </p>
      <p>
        Nexo está en desarrollo activo: podemos añadir, modificar o retirar funciones del plan gratuito o
        de Nexo Plus, avisando con antelación razonable cuando el cambio afecte de forma relevante a
        funciones que ya estés usando.
      </p>

      <h2>3. Registro y cuenta</h2>
      <p>
        Para usar Nexo necesitas crear una cuenta (con email y contraseña, o con tu cuenta de Google).
        Debes ser mayor de 18 años, facilitar datos veraces y mantener tu contraseña en secreto. Eres
        responsable de la actividad que se realice desde tu cuenta.
      </p>

      <h2>4. Precio, pago y facturación de Nexo Plus</h2>
      <p>
        El precio de Nexo Plus se muestra en la aplicación antes de contratar, en su modalidad mensual o
        anual. El pago se procesa a través de Stripe; no almacenamos los datos de tu tarjeta. Si en el
        futuro estamos obligadas a aplicar impuestos indirectos (como el IVA) sobre el precio, se indicará
        de forma expresa antes de que confirmes el pago.
      </p>

      <h2>5. Duración, renovación automática y cancelación</h2>
      <p>
        Nexo Plus se renueva automáticamente al final de cada periodo (mensual o anual) al mismo precio,
        salvo que lo canceles antes de esa fecha. Puedes cancelar en cualquier momento desde la propia
        aplicación (Ajustes → Nexo Plus → Gestionar suscripción) o desde el portal de facturación de
        Stripe. Al cancelar, mantienes el acceso a Nexo Plus hasta el final del periodo ya pagado; no se
        realizan devoluciones proporcionales por el tiempo no consumido, salvo que la ley aplicable
        disponga lo contrario.
      </p>

      <h2>6. Derecho de desistimiento</h2>
      <p>
        Si contratas Nexo Plus como consumidor, dispones de 14 días naturales desde la contratación para
        desistir sin necesidad de justificación, conforme al Real Decreto Legislativo 1/2007 (Ley General
        para la Defensa de los Consumidores y Usuarios). Para ejercerlo, escríbenos a{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> indicando tu decisión de desistir.
      </p>
      <p>
        Ten en cuenta que, si al contratar Nexo Plus aceptas expresamente empezar a disfrutar de sus
        funciones de forma inmediata (antes de que finalicen esos 14 días) y reconoces que con ello pierdes
        tu derecho de desistimiento, no podrás desistir una vez el servicio se haya ejecutado
        completamente. En ese caso te lo indicaremos de forma clara en el propio proceso de contratación,
        antes de confirmar el pago.
      </p>

      <h2>7. Tus obligaciones</h2>
      <p>
        Además de lo indicado en el <a href="/aviso-legal">Aviso Legal</a>, te comprometes a usar Nexo de
        forma diligente y a no compartir tu cuenta ni el acceso a información de gastos compartidos
        (grupos &ldquo;En conjunto&rdquo;) con personas que no formen parte de ese grupo, salvo que todas
        las personas afectadas lo consientan.
      </p>

      <h2>8. Propiedad intelectual</h2>
      <p>
        El software, diseño y marca de Nexo son titularidad de {titularesNombres}, en los términos
        descritos en el <a href="/aviso-legal">Aviso Legal</a>. Los datos que introduces en la aplicación
        son tuyos; solo los usamos para prestarte el Servicio, conforme a la{" "}
        <a href="/privacidad">Política de Privacidad</a>.
      </p>

      <h2>9. Disponibilidad y responsabilidad</h2>
      <p>
        Nexo es un servicio en fase beta. Hacemos lo posible por mantenerlo disponible y por que las
        extracciones de datos hechas con inteligencia artificial sean correctas, pero no lo garantizamos:
        revisa siempre los datos antes de guardarlos. Nexo no ofrece asesoramiento financiero ni fiscal.
        No respondemos de daños derivados de un uso indebido del Servicio, de fallos de terceros
        proveedores (hosting, IA, pasarela de pago) o de causas de fuerza mayor.
      </p>

      <h2>10. Suspensión y baja de la cuenta</h2>
      <p>
        Puedes borrar tu cuenta cuando quieras desde la aplicación; tus datos se eliminarán conforme a la{" "}
        <a href="/privacidad">Política de Privacidad</a>. Podemos suspender o cancelar tu cuenta si
        incumples gravemente estas condiciones (por ejemplo, uso fraudulento o intento de acceso no
        autorizado a otras cuentas), avisándote salvo que la urgencia del caso lo impida.
      </p>

      <h2>11. Modificación de estas condiciones</h2>
      <p>
        Podemos actualizar estos Términos y Condiciones para adaptarlos a cambios legales o del Servicio.
        Si el cambio es relevante y tienes una suscripción activa, te avisaremos con antelación razonable
        antes de que entre en vigor.
      </p>

      <h2>12. Legislación aplicable y resolución de conflictos</h2>
      <p>
        Estas condiciones se rigen por la legislación española. Si eres consumidor/a, puedes acudir a la
        plataforma europea de resolución de litigios en línea:{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
          ec.europa.eu/consumers/odr
        </a>
        . En todo caso, y sin perjuicio de los fueros que como persona consumidora puedan corresponderte,
        cualquier controversia se someterá a los Juzgados y Tribunales que por ley correspondan.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Para cualquier duda sobre estas condiciones, escríbenos a{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    </LegalPage>
  );
}
