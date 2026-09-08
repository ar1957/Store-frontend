"use client"

import { useState } from "react"

function NursingPhoneLink({ phone }: { phone?: string | null }) {
  if (!phone) return <>our Nursing Team</>
  return (
    <>
      the Nursing Team at{" "}
      <a href={`tel:${phone.replace(/\D/g, "")}`} className="underline">{phone}</a>
    </>
  )
}

function NursingPhoneLinkEs({ phone }: { phone?: string | null }) {
  if (!phone) return <>a nuestro Equipo de Enfermería</>
  return (
    <>
      al Equipo de Enfermería al{" "}
      <a href={`tel:${phone.replace(/\D/g, "")}`} className="underline">{phone}</a>
    </>
  )
}

export default function MedicationSafetyEducationContent({ clinic, phone }: { clinic: string; phone?: string | null }) {
  const [lang, setLang] = useState<"en" | "es">("en")

  return (
    <div>
      <div className="flex gap-x-2 mb-8">
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`px-4 py-2 text-sm font-medium rounded-md border ${
            lang === "en"
              ? "bg-ui-fg-interactive text-white border-ui-fg-interactive"
              : "bg-white text-ui-fg-subtle border-ui-border-base hover:bg-ui-bg-subtle"
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLang("es")}
          className={`px-4 py-2 text-sm font-medium rounded-md border ${
            lang === "es"
              ? "bg-ui-fg-interactive text-white border-ui-fg-interactive"
              : "bg-white text-ui-fg-subtle border-ui-border-base hover:bg-ui-bg-subtle"
          }`}
        >
          Español
        </button>
      </div>

      {lang === "en" ? <EnglishContent clinic={clinic} phone={phone} /> : <SpanishContent clinic={clinic} phone={phone} />}
    </div>
  )
}

function EnglishContent({ clinic, phone }: { clinic: string; phone?: string | null }) {
  return (
    <div className="prose prose-sm max-w-none text-ui-fg-subtle space-y-4" style={{ lineHeight: 1.8 }}>
      <p>
        We want to make sure all of our patients have clear and safe instructions throughout their
        treatment. Please review the following guidelines carefully, whether you are a new patient
        or continuing treatment with {clinic}.
      </p>

      <h2 className="text-xl font-semibold mt-6">New Patients</h2>
      <p>Before beginning treatment, you must complete your required medical evaluation and receive provider clearance.</p>
      <p>Once approved, please follow only the dose prescribed by your medical provider. Your medication is typically administered once weekly, on the same day each week, according to your prescription.</p>
      <p>Before your first injection, make sure you understand:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Your medication name</li>
        <li>Your prescribed dose in mg</li>
        <li>Your medication concentration</li>
        <li>The correct syringe units for your current vial</li>
        <li>Proper medication storage and injection instructions</li>
      </ul>

      <div className="mt-4 p-4 border border-amber-200 rounded-lg bg-amber-50">
        <p className="text-amber-900 font-medium">
          📱 IMPORTANT: Once you receive your medication, please text <NursingPhoneLink phone={phone} />,
          Mon–Friday 9:30 AM – 5 PM CT, BEFORE your first injection.
        </p>
      </div>
      <p>This allows our team to help verify your medication and make sure you understand your current prescription and administration instructions.</p>
      <p className="font-semibold">If you are unsure about ANY of your instructions, DO NOT INJECT your medication. Contact our clinic first so we can review it with you.</p>

      <h2 className="text-xl font-semibold mt-6">Follow-Up &amp; Continuing Patients</h2>
      <p>Please do not automatically use instructions from a previous vial.</p>
      <p>Your pharmacy may dispense medication with a different concentration, which means the number of syringe units needed for your prescribed mg dose may also be different.</p>
      <p>Every time you receive a new vial, review the instructions for your current vial and current prescription.</p>
      <p>If the concentration, syringe units, medication name, or instructions look different from what you previously used, do not inject until you have contacted our team for clarification.</p>

      <div className="mt-4 p-4 border border-amber-200 rounded-lg bg-amber-50">
        <h3 className="font-semibold text-amber-900 mb-2 mt-0">Important: mg and Syringe Units Are Not the Same Thing</h3>
        <p className="text-amber-800 mb-2">Your prescribed dose is written in milligrams (mg).</p>
        <p className="text-amber-800 mb-2">Syringe units represent the volume of medication drawn into the syringe. The number of units needed depends on the concentration of medication dispensed by the pharmacy.</p>
        <p className="text-amber-800 mb-0">For this reason, the same number of syringe units does not necessarily equal the same mg dose from one vial to another. Never guess, self-calculate, or use instructions from a previous vial.</p>
      </div>

      <h2 className="text-xl font-semibold mt-6">Do Not Change Your Dose on Your Own</h2>
      <p>Do not independently:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Increase or decrease your dose</li>
        <li>Take an extra injection</li>
        <li>Repeat a dose</li>
        <li>Split your dose</li>
        <li>Change your syringe units</li>
        <li>Use another person&rsquo;s medication or instructions</li>
      </ul>
      <p>Any treatment or dose change must follow your medical provider&rsquo;s prescription and treatment plan.</p>

      <h2 className="text-xl font-semibold mt-6">Nutrition, Hydration &amp; Constipation Prevention</h2>
      <p>Adequate nutrition and hydration are very important during treatment. We recommend:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Drinking plenty of water throughout the day.</li>
        <li>Maintaining adequate protein intake to support your nutritional needs.</li>
        <li>Including adequate fiber in your diet to help prevent constipation. Increase fiber gradually and maintain adequate fluid intake.</li>
        <li>Eating smaller portions and eating slowly.</li>
        <li>Stopping when you feel comfortably full.</li>
        <li>Staying physically active as tolerated.</li>
      </ul>
      <p>Constipation can occur during treatment. Adequate water, fiber, nutrition, and physical activity can help support regular bowel movements.</p>

      <h2 className="text-xl font-semibold mt-6">Foods &amp; Drinks That May Worsen Side Effects</h2>
      <p>Some patients may notice that gastrointestinal side effects become worse after certain foods or drinks. Try to avoid or limit:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Spicy foods</li>
        <li>Greasy or fried foods</li>
        <li>Heavy or very large meals</li>
        <li>Highly fatty foods</li>
        <li>Alcohol</li>
      </ul>
      <p>These may worsen symptoms such as nausea, vomiting, bloating, abdominal discomfort, diarrhea, heartburn, or indigestion.</p>

      <h2 className="text-xl font-semibold mt-6">Possible Side Effects</h2>
      <p>Common side effects may include:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Nausea</li>
        <li>Vomiting</li>
        <li>Diarrhea</li>
        <li>Constipation</li>
        <li>Abdominal discomfort</li>
        <li>Bloating</li>
        <li>Decreased appetite</li>
      </ul>
      <p>Please contact our clinic for significant, persistent, worsening, or concerning symptoms.</p>
      <p>Seek prompt medical attention for severe or persistent abdominal pain, persistent vomiting or inability to maintain hydration, signs of a significant allergic reaction, or other severe or unusual symptoms.</p>

      <h2 className="text-xl font-semibold mt-6">Please Keep Us Updated</h2>
      <p>Please notify our clinic if you experience any changes, including:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>New medical conditions or diagnoses</li>
        <li>New medications or medication changes</li>
        <li>New allergies or allergic reactions</li>
        <li>Pregnancy or breastfeeding</li>
        <li>Hospitalization or surgery</li>
        <li>Significant or concerning side effects</li>
        <li>Any change to your shipping address</li>
      </ul>

      <div className="mt-4 p-4 border border-amber-200 rounded-lg bg-amber-50">
        <p className="text-amber-900 font-medium">
          📦 IMPORTANT SHIPPING ADDRESS POLICY: If your shipping address changes at any time, please
          notify our clinic immediately and before your next medication order is processed. Do not
          assume that updating your address elsewhere automatically updates the information being
          used for your prescription or pharmacy shipment.
        </p>
      </div>
      <p>Please verify that your full shipping address, apartment/unit number (if applicable), city, state, and ZIP code are correct before we order your medication.</p>
      <p>Once a prescription or shipment has already been submitted to the pharmacy, we may be unable to change or redirect the delivery.</p>

      <div className="mt-8 p-6 border border-red-200 rounded-lg bg-red-50">
        <h3 className="font-semibold text-red-900 mb-2 mt-0">Most Important: When in Doubt, Do Not Inject</h3>
        <p className="text-red-800 mb-2">
          If your medication name, concentration, prescribed mg dose, pharmacy label, or
          syringe-unit instructions are unclear or do not match what you expected, do not
          administer the medication until our team has reviewed and clarified your instructions.
        </p>
        <p className="text-red-800 mb-0">
          📱 Once you receive your medication, text <NursingPhoneLink phone={phone} />.
        </p>
      </div>

      <p>Our goal is to make sure every patient understands their treatment and administers their medication safely.</p>
      <p>Thank you,<br />{clinic}</p>
    </div>
  )
}

function SpanishContent({ clinic, phone }: { clinic: string; phone?: string | null }) {
  return (
    <div className="prose prose-sm max-w-none text-ui-fg-subtle space-y-4" style={{ lineHeight: 1.8 }}>
      <p>
        Queremos asegurarnos de que todos nuestros pacientes tengan instrucciones claras y seguras
        durante su tratamiento. Por favor, revise cuidadosamente la siguiente información, ya sea
        que usted sea un paciente nuevo o esté continuando su tratamiento con {clinic}.
      </p>

      <h2 className="text-xl font-semibold mt-6">Pacientes Nuevos</h2>
      <p>Antes de comenzar su tratamiento, deberá completar la evaluación médica requerida y recibir la autorización de su proveedor médico.</p>
      <p>Una vez aprobado, deberá seguir únicamente la dosis recetada por su proveedor médico. Su medicamento generalmente se administra una vez por semana, el mismo día de cada semana, de acuerdo con su receta.</p>
      <p>Antes de su primera inyección, asegúrese de entender:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>El nombre de su medicamento</li>
        <li>Su dosis recetada en mg</li>
        <li>La concentración de su medicamento</li>
        <li>Las unidades correctas en la jeringa para su frasco actual</li>
        <li>Las instrucciones adecuadas de almacenamiento y administración</li>
      </ul>

      <div className="mt-4 p-4 border border-amber-200 rounded-lg bg-amber-50">
        <p className="text-amber-900 font-medium">
          📱 IMPORTANTE: Una vez que reciba su medicamento, envíe un mensaje de texto{" "}
          <NursingPhoneLinkEs phone={phone} />, de lunes a viernes de 9:30 AM a 5:00 PM, hora central
          (CT), ANTES de aplicarse su primera inyección.
        </p>
      </div>
      <p>Esto permite que nuestro equipo le ayude a verificar su medicamento y se asegure de que usted comprenda correctamente su receta e instrucciones de administración actuales.</p>
      <p className="font-semibold">Si tiene CUALQUIER duda sobre sus instrucciones, NO SE INYECTE el medicamento. Comuníquese primero con nuestra clínica para que podamos revisarlo con usted.</p>

      <h2 className="text-xl font-semibold mt-6">Pacientes de Seguimiento y Continuación</h2>
      <p>No utilice automáticamente las instrucciones de un frasco anterior.</p>
      <p>La farmacia puede dispensar su medicamento con una concentración diferente, lo que significa que la cantidad de unidades que debe cargar en la jeringa para obtener su dosis recetada en mg también puede ser diferente.</p>
      <p>Cada vez que reciba un frasco nuevo, revise las instrucciones correspondientes a su frasco y receta actuales.</p>
      <p>Si la concentración, las unidades de la jeringa, el nombre del medicamento o las instrucciones son diferentes a las que utilizó anteriormente, no se aplique la inyección hasta comunicarse con nuestro equipo para aclarar las instrucciones.</p>

      <div className="mt-4 p-4 border border-amber-200 rounded-lg bg-amber-50">
        <h3 className="font-semibold text-amber-900 mb-2 mt-0">Importante: Los mg y las Unidades de la Jeringa No Son lo Mismo</h3>
        <p className="text-amber-800 mb-2">Su dosis recetada está indicada en miligramos (mg).</p>
        <p className="text-amber-800 mb-2">Las unidades de la jeringa representan el volumen de medicamento que se carga en la jeringa. La cantidad de unidades necesarias depende de la concentración del medicamento dispensado por la farmacia.</p>
        <p className="text-amber-800 mb-0">Por esta razón, la misma cantidad de unidades en la jeringa no necesariamente equivale a la misma dosis en mg de un frasco a otro. Nunca adivine, calcule por su cuenta ni utilice automáticamente las instrucciones de un frasco anterior.</p>
      </div>

      <h2 className="text-xl font-semibold mt-6">No Cambie Su Dosis Por Su Cuenta</h2>
      <p>No debe:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Aumentar o disminuir su dosis por su cuenta</li>
        <li>Aplicarse una inyección adicional</li>
        <li>Repetir una dosis</li>
        <li>Dividir su dosis</li>
        <li>Cambiar las unidades de la jeringa</li>
        <li>Utilizar el medicamento o las instrucciones de otra persona</li>
      </ul>
      <p>Cualquier cambio en su tratamiento o dosis deberá seguir la receta y el plan de tratamiento indicado por su proveedor médico.</p>

      <h2 className="text-xl font-semibold mt-6">Nutrición, Hidratación y Prevención del Estreñimiento</h2>
      <p>Mantener una hidratación y nutrición adecuadas es muy importante durante su tratamiento. Recomendamos:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Tomar suficiente agua durante el día.</li>
        <li>Mantener un consumo adecuado de proteína para apoyar sus necesidades nutricionales.</li>
        <li>Incluir suficiente fibra en su alimentación para ayudar a prevenir el estreñimiento. Aumente la fibra gradualmente y mantenga un consumo adecuado de líquidos.</li>
        <li>Comer porciones más pequeñas y despacio.</li>
        <li>Dejar de comer cuando se sienta cómodamente satisfecho/a.</li>
        <li>Mantenerse físicamente activo/a según lo tolere.</li>
      </ul>
      <p>El estreñimiento puede ocurrir durante el tratamiento. El consumo adecuado de agua, fibra y alimentos nutritivos, junto con actividad física, puede ayudar a mantener movimientos intestinales regulares.</p>

      <h2 className="text-xl font-semibold mt-6">Alimentos y Bebidas Que Pueden Empeorar los Efectos Secundarios</h2>
      <p>Algunos pacientes pueden notar que los efectos secundarios gastrointestinales empeoran después de consumir ciertos alimentos o bebidas. Trate de evitar o limitar:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Comidas picantes</li>
        <li>Comidas grasosas o fritas</li>
        <li>Comidas pesadas o porciones muy grandes</li>
        <li>Alimentos con alto contenido de grasa</li>
        <li>Alcohol</li>
      </ul>
      <p>Estos pueden empeorar síntomas como náuseas, vómitos, inflamación abdominal, malestar abdominal, diarrea, acidez o indigestión.</p>

      <h2 className="text-xl font-semibold mt-6">Posibles Efectos Secundarios</h2>
      <p>Los efectos secundarios comunes pueden incluir:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Náuseas</li>
        <li>Vómitos</li>
        <li>Diarrea</li>
        <li>Estreñimiento</li>
        <li>Malestar abdominal</li>
        <li>Inflamación abdominal</li>
        <li>Disminución del apetito</li>
      </ul>
      <p>Comuníquese con nuestra clínica si presenta síntomas significativos, persistentes, que empeoran o que le preocupen.</p>
      <p>Busque atención médica inmediata si presenta dolor abdominal intenso o persistente, vómitos persistentes o incapacidad para mantenerse hidratado/a, señales de una reacción alérgica significativa o cualquier otro síntoma grave o inusual.</p>

      <h2 className="text-xl font-semibold mt-6">Por Favor, Manténganos Informados</h2>
      <p>Notifique a nuestra clínica si presenta cualquier cambio, incluyendo:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Nuevas condiciones médicas o diagnósticos</li>
        <li>Medicamentos nuevos o cambios en sus medicamentos</li>
        <li>Nuevas alergias o reacciones alérgicas</li>
        <li>Embarazo o lactancia</li>
        <li>Hospitalización o cirugía</li>
        <li>Efectos secundarios significativos o preocupantes</li>
        <li>Cualquier cambio en su dirección de envío</li>
      </ul>

      <div className="mt-4 p-4 border border-amber-200 rounded-lg bg-amber-50">
        <p className="text-amber-900 font-medium">
          📦 IMPORTANTE — CAMBIOS EN SU DIRECCIÓN DE ENVÍO: Si su dirección de envío cambia en
          cualquier momento, deberá notificarnos inmediatamente y antes de que procesemos su
          próximo pedido de medicamento. No asuma que cambiar su dirección en otro lugar actualizará
          automáticamente la dirección utilizada para su receta o envío de farmacia.
        </p>
      </div>
      <p>Antes de que ordenemos su medicamento, verifique que su dirección completa, número de apartamento/unidad (si corresponde), ciudad, estado y código postal sean correctos.</p>
      <p>Una vez que la receta o el pedido haya sido enviado a la farmacia, es posible que ya no podamos cambiar o redirigir el envío.</p>

      <div className="mt-8 p-6 border border-red-200 rounded-lg bg-red-50">
        <h3 className="font-semibold text-red-900 mb-2 mt-0">Lo Más Importante: Si Tiene Dudas, No Se Inyecte</h3>
        <p className="text-red-800 mb-2">
          Si el nombre de su medicamento, concentración, dosis recetada en mg, etiqueta de la
          farmacia o unidades de la jeringa no están claras o son diferentes a lo que esperaba, no
          se administre el medicamento hasta que nuestro equipo haya revisado y aclarado sus
          instrucciones.
        </p>
        <p className="text-red-800 mb-0">
          📱 Una vez que reciba su medicamento, envíe un mensaje de texto{" "}
          <NursingPhoneLinkEs phone={phone} />.
        </p>
      </div>

      <p>Nuestro objetivo es asegurarnos de que cada paciente comprenda su tratamiento y pueda administrar su medicamento de manera segura.</p>
      <p>Gracias,<br />{clinic}</p>
    </div>
  )
}
