import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Aviso legal · Nexo",
  description: "Condiciones generales de acceso y uso del sitio web de Nexo.",
};

export default function AvisoLegalPage() {
  const titularesNombres = LEGAL.titulares.map((t) => t.nombre).join(" y ");

  return (
    <LegalPage title="Aviso legal">
      <h2>1. Identificación del titular</h2>
      <p>
        En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de
        julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se
        informa de los siguientes datos: este sitio web ({LEGAL.dominio}) y la aplicación Nexo
        (&ldquo;Nexo&rdquo;, el &ldquo;Sitio&rdquo; o el &ldquo;Servicio&rdquo;) son operados de forma
        conjunta por:
      </p>
      <ul>
        {LEGAL.titulares.map((t) => (
          <li key={t.nif}>
            <strong>{t.nombre}</strong> — NIF {t.nif}
          </li>
        ))}
      </ul>
      <p>
        Domicilio a efectos de notificaciones: {LEGAL.domicilio}. Correo electrónico de contacto:{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
      <p>
        Nexo es, a día de hoy, un proyecto en fase de desarrollo/beta impulsado por {titularesNombres}{" "}
        como personas físicas.
      </p>

      <h2>2. Objeto</h2>
      <p>
        Este Aviso Legal regula el acceso y uso del Sitio y del Servicio, que permite a las personas
        usuarias registrar y organizar sus finanzas personales (ingresos, gastos, ahorro, límites de
        presupuesto, gastos compartidos con otras personas y gastos de viaje), con ayuda opcional de
        inteligencia artificial para la introducción de datos.
      </p>
      <p>
        El acceso al Sitio y el uso del Servicio atribuyen la condición de usuario/a y suponen la
        aceptación, desde ese mismo momento, de las condiciones aquí recogidas. Si no estás de acuerdo con
        ellas, debes abstenerte de utilizar el Sitio y el Servicio.
      </p>

      <h2>3. Condiciones de acceso y uso</h2>
      <p>
        El uso del Servicio requiere la creación de una cuenta (con email y contraseña, o mediante inicio
        de sesión con Google). Eres responsable de la veracidad de los datos que facilites, de mantener tu
        contraseña en secreto y de toda actividad que se realice desde tu cuenta.
      </p>
      <p>Al usar el Sitio y el Servicio te comprometes a no:</p>
      <ul>
        <li>Utilizarlos con fines ilícitos, fraudulentos o contrarios a este Aviso Legal.</li>
        <li>Intentar acceder a cuentas de otras personas usuarias o a áreas restringidas del Sitio.</li>
        <li>
          Introducir o difundir a través del Servicio virus, código malicioso o cualquier otro elemento
          que pueda dañar o impedir el funcionamiento normal del Sitio.
        </li>
        <li>
          Realizar acciones que supongan una carga desproporcionada o no razonable sobre la
          infraestructura del Servicio (por ejemplo, mediante scraping automatizado o ataques de
          denegación de servicio).
        </li>
      </ul>
      <p>
        Nexo Plus es una suscripción de pago opcional que amplía las funciones disponibles en el plan
        gratuito. El cobro y la gestión de la suscripción se realizan a través de Stripe; puedes
        cancelarla en cualquier momento desde la propia aplicación.
      </p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>
        El código fuente, los diseños, logotipos, marcas (incluida &ldquo;Nexo&rdquo;), textos, imágenes y
        demás contenidos del Sitio son titularidad de {titularesNombres} o se usan con la autorización
        correspondiente, y están protegidos por la normativa de propiedad intelectual e industrial. Queda
        prohibida su reproducción, distribución o transformación sin autorización previa y por escrito,
        salvo para uso personal y privado.
      </p>
      <p>
        Los datos que introduces en Nexo (tus movimientos, ingresos, gastos, notas, etc.) son tuyos. Los
        tratamos exclusivamente para prestarte el Servicio, en los términos descritos en la{" "}
        <a href="/privacidad">Política de Privacidad</a>.
      </p>

      <h2>5. Exclusión de garantías y responsabilidad</h2>
      <p>
        Nexo es, actualmente, un servicio en desarrollo activo (fase beta). Se presta &ldquo;tal cual&rdquo;
        y &ldquo;según disponibilidad&rdquo;, sin garantizar la ausencia de errores, la disponibilidad
        continua del Servicio ni la exactitud absoluta de las categorizaciones o extracciones de datos
        realizadas mediante inteligencia artificial (foto de tickets, voz o importación de extractos
        bancarios): siempre puedes revisar y corregir esos datos antes de guardarlos.
      </p>
      <p>
        Nexo no constituye asesoramiento financiero, fiscal ni de inversión. Es una herramienta de
        organización personal; las decisiones económicas que tomes a partir de la información mostrada son
        tu responsabilidad.
      </p>
      <p>
        No nos hacemos responsables de los daños derivados de interrupciones del Servicio por causas de
        fuerza mayor, fallos de terceros proveedores (hosting, IA, pasarela de pago) o de una mala
        configuración o uso indebido del Servicio por parte de la persona usuaria.
      </p>

      <h2>6. Enlaces a terceros</h2>
      <p>
        El Sitio puede incluir enlaces a páginas de terceros (por ejemplo, el proceso de pago gestionado
        por Stripe, o el inicio de sesión con Google). No nos hacemos responsables del contenido ni de las
        políticas de privacidad de esos sitios, ajenos a Nexo.
      </p>

      <h2>7. Modificaciones</h2>
      <p>
        Podemos modificar este Aviso Legal, la Política de Privacidad y la Política de Cookies cuando sea
        necesario para adaptarlos a novedades legislativas o cambios en el Servicio. Publicaremos la
        versión vigente en el Sitio, indicando la fecha de la última actualización.
      </p>

      <h2>8. Legislación aplicable y jurisdicción</h2>
      <p>
        Este Aviso Legal se rige por la legislación española. Para cualquier controversia derivada del
        acceso o uso del Sitio, y sin perjuicio de los fueros que puedan corresponder a las personas
        consumidoras conforme a la normativa aplicable, las partes se someten a los Juzgados y Tribunales
        que por ley correspondan.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para cualquier duda sobre este Aviso Legal puedes escribirnos a{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    </LegalPage>
  );
}
