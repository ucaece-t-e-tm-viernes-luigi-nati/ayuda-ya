# AyudaYa — Contexto completo del proyecto

> **Para Claude Code:** este archivo resume todo el trabajo hecho hasta el 6 de noviembre de 2026 sobre el proyecto AyudaYa (trabajo práctico de la materia Taller Emprendedor). Leelo completo antes de proponer cambios. Si lo cargás como `CLAUDE.md` en la raíz del proyecto, se lee automáticamente en cada sesión.
>
> **Reglas de trabajo con el usuario:**
> - Responder en **español rioplatense** (vos, tenés, querés).
> - Si hay dudas sobre lo que quiere, **preguntar antes de hacer** para que el resultado sea exactamente lo que busca.
> - Somos **estudiantes de facultad en Mar del Plata**: los números, la inversión y los objetivos tienen que ser **racionales y modestos**, no de empresa grande.
> - Las decisiones tienen que respetar el marco teórico de la materia (sección 3).

---

## Índice

1. Resumen rápido
2. Contexto académico y del equipo
3. Marco teórico de la materia (apuntes)
4. El proyecto: AyudaYa
5. Trabajo práctico (TP): estado y contenido
6. Tamaño de mercado (TAM, SAM, SOM)
7. Modelo de ingresos y finanzas
8. Competencia (incluye análisis de Clickie)
9. Web del MVP: especificación completa
10. Asistente con IA: lógica, prompt y reglas
11. Diseño visual y fotos
12. Decisiones tomadas (registro)
13. Pendientes y próximos pasos
14. Propuesta de arquitectura para la web app completa (v0 + Supabase)
15. Archivos y enlaces
16. Fuentes

---

## 1. Resumen rápido

- **Qué es:** plataforma (web primero, app después) que conecta hogares de **Mar del Plata** con **plomeros, gasistas y electricistas verificados**, con **precio cerrado** antes de confirmar.
- **Nombre:** AyudaYa (dominio sugerido en clase: `ayudaya.com`).
- **Modelo de ingresos:** **comisión del 15% que paga el prestador** (modelo intermediario). El cliente no paga recargo.
- **MVP:** web mobile-first con tarifario, asistente con IA que sugiere el servicio, formulario de pedido que se envía por **WhatsApp**, asignación **manual** de prestadores, piloto en una zona de Mar del Plata.
- **Competidor directo principal:** **Clickie**, que ya opera en Mar del Plata y también ofrece precio cerrado (ver sección 8).
- **Entregas de la materia:** TP escrito, pitch de 3 minutos (lo da una sola persona), pitch deck con las "9 perlas", web/MVP. En los apuntes figura "Para el 12 todo entregado".

---

## 2. Contexto académico y del equipo

- **Alumno:** Erwin Mateo Sollberger (Mar del Plata). Trabaja en grupo.
- **Materia:** Taller Emprendedor (startups: Lean Startup, Canvas, lienzo de propuesta de valor, pitch).
- **Entregables:** trabajo práctico, pitch (3 minutos) y pitch deck (10 minutos de pitch más 10 de preguntas), web del MVP.
- **Tarea técnica dada en clase:**
  1. Conseguir un dominio (ej. `ayudaya.com`).
  2. Usar **v0** (da hosting y dominio gratis para publicar) con el siguiente prompt del profesor.
  3. Usar **Supabase** (plan gratuito) para base de datos y login, con el mail de una compañera del grupo (Felicitas).
- **Prompt del profesor para v0 (textual, corregido de ortografía):**
  > Quiero que me ayudes a crear un proyecto. Vas a trabajar como un arquitecto de software. Vamos a hacer una web app para el proyecto; es muy importante que tengas en cuenta el frontend, backend, base de datos y posibilidad de MCP. El proyecto es una web que permite conectar a las personas con problemas domésticos en la casa, como de gas, plomería, electricista, con los oferentes de esos servicios, los que solucionan eso, los mecánicos en ese determinado área. Es para el segmento de Mar del Plata. Nuestra app tiene varias partes: lo que pasa en el super admin (damos de alta usuarios, y un dashboard que permita controlar y administrar todo lo que pasa en la app); el panel de los solucionadores de los problemas; y la parte para el usuario, que es la más estética: tiene que ser moderna y estética, con buen UI y UX.
- **Comentario de clase:** "MCP me permite conectar APIs". Diseño web, ERP, base de datos, login en Supabase.

---

## 3. Marco teórico de la materia (resumen de apuntes)

Usar estos conceptos y su vocabulario en todo lo que se escriba para la materia.

### 3.1 Lean Startup
- Modelo de negocio escalable, nace digital; puede crecer muy rápido si la idea está bien hecha. "El método no garantiza el éxito, pero sin método no hay éxito".
- Prueba de mercado con un público chico, que luego se amplía. Inversión inicial baja. Busca **validar** la idea con feedback del usuario.
- Ciclo **Construir → Medir → Aprender**:
  - **Construir = MVP** (mínimo producto viable): primera versión para salir al mercado. Tiene **frontend** (lo que se ve, UX) y **backend** (lo que no se ve).
  - **Medir = PMF** (product market fit): datos reales del comportamiento de los usuarios; se llega iterando el MVP.
  - **Aprender:** preservar, pivotar o abandonar según la evidencia.

### 3.2 Design Thinking (centrado en el humano)
Empatizar (UX/UI, entender problema y frustraciones) → Definir (objetivos, qué, cómo, cuándo, dónde, para quién, fechas) → Idear (soluciones; objetivos SMART) → Prototipar (rápido y económico) → Testear (clientes reales, feedback) → PMF.

### 3.3 Las 5 etapas de la escalabilidad
1. **Ideación:** nace la idea que atiende una necesidad.
2. **Validación:** clientes que pagan, camino al PMF.
3. **Desarrollo:** métricas del negocio, punto de equilibrio mínimo, listos para escalar.
4. **Crecimiento:** ventas crecen rápido, referentes en capitales, se levanta capital para expansión regional.
5. **Consolidación:** posicionamiento en la mente del consumidor, líder del segmento.

### 3.4 Desarrollo del cliente (integra las tres metodologías)
- Design Thinking: empatía y problema correcto.
- Customer Development (Steve Blank): validar hipótesis con clientes reales. "La actividad clave número 1 no es producir, es validar". Al inicio, tercerizar vulnerabiliza a la organización.
- Lean Startup: iterar rápido con el mínimo desperdicio.

### 3.5 Business Model Canvas (Osterwalder, 2010) — 9 bloques
1. **Segmentos de clientes:** ¿para quién creamos valor?
2. **Propuesta de valor:** tareas, frustraciones, alegrías; el diferenciador.
3. **Canales:** físicos/digitales, directos/indirectos. Esquema: notoriedad → evaluación → compra → entrega → posventa.
4. **Relación con clientes:** obtener (marketing de adquisición, promos de bienvenida), mantener (posventa), crecer (upselling, cross-selling). Tipos: asistencia personal, asistencia personal dedicada, autoservicio, servicios automáticos, comunidades, cocreación.
5. **Fuentes de ingreso:**
   - Precios fijos: por lista, según segmento, según características del producto, según volumen.
   - Precios dinámicos: negociación, subastas, tiempo real.
   - Monetización: venta de activos, cuota de uso, suscripción, alquiler/leasing, franquicias, **intermediario (comisión, ej. Mercado Libre, Airbnb, PedidosYa)**, publicidad, freemium, venta cruzada.
6. **Recursos clave:** físicos, intelectuales (know-how, marca, bases de datos), humanos, financieros.
7. **Actividades clave:** producción, resolución de problemas, plataforma/red.
8. **Socios clave:** alianzas entre no competidores, coopetición, joint venture, relación cliente-proveedor. Motivaciones: economías de escala, reducción de riesgo, adquisición de recursos. Riesgo de dependencia operativa. Matriz hacer vs. aliarse.
9. **Estructura de costos:** impulsada por costos o por valor; costos fijos y variables; economías de escala y de alcance.
   - **CAC** = costos de marketing y ventas ÷ clientes captados.
   - **LTV** = frecuencia × monto de **las fuentes de ingresos de la empresa** a lo largo de la vida del cliente.

### 3.6 Lienzo de propuesta de valor
- **Perfil del cliente:** trabajos (funcional, social, emocional), dolores (financiero, logístico, experiencia de compra, desconfianza), ganancias.
- **Mapa de valor:** productos y servicios, aliviadores de dolor, creadores de ganancias.
- **Encaje:** cada aliviador tacha una frustración y cada creador responde a una alegría del cliente.

### 3.7 Mercado
- **Curva de adopción:** innovadores 2,5%, adoptantes tempranos 13,5%, mayoría temprana 34%, mayoría tardía 34%, rezagados 16%. El MVP apunta a innovadores y adoptantes tempranos, que toleran la imperfección.
- **Tipos de mercado:** existente (clave: cuota y diferenciación) o nuevo (hay que educar al cliente).
- **Segmentación:** por bajo costo (aerolíneas low cost) o por nicho (Tesla).
- **TAM:** mercado global inalcanzable, cuánto factura la industria en un año.
- **SAM:** porción del TAM alcanzable por el modelo o la geografía, en un período y con una cantidad de posibles consumidores.
- **SOM:** objetivo de captación real a corto o mediano plazo.
- **Competencia:** directa (misma solución) o indirecta (sustituto).

### 3.8 Pitch
- **Elevator pitch:** quién es el cliente, cuál es el problema, qué solución tengo, modelo de negocio, cierre o llamado a la acción.
- Estructura: intro (15%, hook: silencio o estadística fuerte), nudo (conflicto), transformación.
- Storytelling: 10% lógica, 90% emociones. Un personaje como héroe; creatividad, autenticidad, conflicto y transformación. En el pitch deck del segundo parcial se puede contar la historia de un consumidor ejemplar.
- **Las 9 perlas del pitch deck:** 1) problema, 2) solución y producto (capturas de la web), 3) modelo de negocio (B2B/B2C, cómo genera ingresos), 4) tamaño de mercado (TAM, SAM, SOM), 5) tracción (lo único en que no se puede mentir: encuestas, logros), 6) competencia (por precio o por tiempo), 7) hitos y finanzas (CAC, LTV), 8) equipo, 9) llamado a la acción.
- **Demo day:** 3 minutos, entre 10 y 14 slides, fuente de 30 puntos, solo títulos como soporte visual, no leer.
- **Rondas de inversión:** friends & family; ángeles (USD 100.000 a 250.000, con unos USD 50.000 de facturación y presencia en varias provincias); incubadoras (USD 300.000 a 500.000). Ejemplos: Startup Chile, Y Combinator.
- En los apuntes figura un ejemplo de pedido de inversión del grupo: **USD 300.000 a cambio del 15%** (revisar si sigue vigente; es alto para una startup de estudiantes).

### 3.9 Recursos, actividades y alianzas definidas en clase por el grupo
- **Alianzas:** diseño y mantenimiento web con un diseñador; ferretería aliada para bajar el costo de materiales.
- **Lo hacemos nosotros:** publicidad en Meta y Google, servicio posventa, programas de fidelización, remarketing, community manager e imagen de marca.
- **Actividades críticas y recursos:**

| Actividad o recurso | Plazo | Costo | Quién |
|---|---|---|---|
| Búsqueda de prestadores de oficios | 3 a 6 semanas | — | Nosotros |
| UI apropiada / know-how de programación | 1 mes | USD 1.000 | Programador tercerizado (alianza) |
| Validación de un segmento mínimo (encuesta) | — | USD 800 a 1.000 | Nosotros |
| Cuentas para publicitar (Google y Meta) | 15 días para diseñar anuncios | USD 600 por mes | Nosotros |
| Capital inicial | — | USD 4.000 | Nosotros |

---

## 4. El proyecto: AyudaYa

### 4.1 Problema
Encontrar un profesional de confianza, rápido y con precio claro. El mercado funciona por recomendaciones: quien no tiene contactos no sabe quién entra a su casa, cuánto le van a cobrar y espera días. Del otro lado, muchos prestadores son informales y dependen del boca a boca.

Según la encuesta del grupo, los marplatenses tienen con frecuencia problemas eléctricos, de gas y de plomería. **Faltan los datos concretos de la encuesta** (cantidad de encuestados, porcentajes).

### 4.2 Propuesta de valor
- Prestadores **verificados** (DNI, matrícula cuando corresponde, referencias).
- **Precio cerrado:** el precio que se acepta es el final. Si el trabajo requiere más (materiales o tareas extra), se aprueba un presupuesto en la plataforma antes de empezar.
- Respuesta y asignación rápida, con horario confirmado.
- Calificaciones de los prestadores.
- Garantía: si el arreglo falla dentro de los 30 días, el prestador vuelve sin costo (supuesto a definir).
- Para el prestador: clientes sin gastar en publicidad.
- Frase del grupo: "¿Necesitás un plomero o un electricista? Encontrá profesionales verificados, con precio cerrado y en el día."

### 4.3 Diferencial frente a Clickie (ver sección 8)
Como Clickie ya ofrece precio cerrado en Mar del Plata, el diferencial propuesto (**todavía no aprobado por el grupo ni aplicado al TP**) es:
- **El cliente no paga comisión** (Clickie cobra 10% al cliente además del 15% al prestador).
- **Atención local y humana por WhatsApp**, sin registrarse ni bajar una app.
- **Foco en Mar del Plata** y respuesta en el día.
- Asistente con IA como herramienta, no como reemplazo de la atención humana.

---

## 5. Trabajo práctico (TP): estado y contenido

**Documento:** "TP – App de servicios para el hogar" (Claude Docs) → https://claude.ai/artifact/SRnstiTV5nDFXUnhEvw6Qb

**Estado:** completo, con supuestos marcados. **No incluye todavía** el asistente con IA ni la corrección por Clickie.

### Correcciones aplicadas al documento original del grupo
- El LTV de $500.000 estaba mal: usaba la facturación del prestador. Ahora se calcula sobre la comisión.
- Monetización: se reemplazó "venta de activos / cuota de uso" por **intermediario (comisión)**.
- Se agregó el CAC.
- Se quitaron "encaje perfecto" y "garantizamos el éxito"; el encaje lo valida el MVP.
- Se quitó "no existen otras aplicaciones"; se agregó análisis de competencia.
- Se resolvió la inconsistencia entre precio fijo y elegir entre varios profesionales.
- Perfil del cliente separado en trabajo funcional, social y emocional.

### Secciones del TP
1. **Descripción del proyecto:** plataforma web y luego app; precio cerrado; valor para ambos lados.
2. **Problema y oportunidad:** con un hueco para completar los resultados de la encuesta.
3. **MVP y Lean Startup:**
   - Web adaptada a celulares hecha con v0; backend en Supabase (gratis); asignación manual por WhatsApp.
   - Flujo: elegir servicio y ver precio → solicitud con dirección, horario y foto → asignación manual con perfil del prestador → trabajo al precio acordado (diagnóstico más presupuesto aprobado antes si hace falta) → pago por la plataforma y calificación.
   - Piloto: una zona de Mar del Plata (**a definir**), con 8 a 10 prestadores; difusión orgánica más Meta Ads con presupuesto controlado.
   - Público del MVP: innovadores y adoptantes tempranos (16%).
   - Tabla de hipótesis:

| Hipótesis | Métrica | Criterio de éxito (supuesto) |
|---|---|---|
| Existe demanda en la zona piloto | Solicitudes por semana | 15 o más en el primer mes |
| La web convierte visitas en pedidos | Visitas → solicitudes | 3% o más |
| Los pedidos se concretan | Solicitudes → contrataciones | 50% o más |
| Respondemos rápido | Tiempo hasta asignar | Menos de 2 h en horario laboral |
| El precio cerrado se cumple | Trabajos sin cambios no aprobados | 95% o más |
| Usuarios conformes | Calificación promedio | 4,5/5 o más |
| Usuarios vuelven | Segundo servicio en 90 días | 20% o más |
| Prestadores aceptan el modelo | Activos al segundo mes | 8 de cada 10 |

4. **Lienzo de propuesta de valor:**
   - Trabajos del cliente: funcional (resolver rápido y bien), social (quedar bien con familia o inquilinos), emocional (tranquilidad de que quien entra es confiable y no lo estafan).
   - Dolores: desconfianza, incertidumbre de precio, demora, falta de contactos.
   - Ganancias: conocer al profesional antes, saber el precio final, resolverlo en el día, tener respaldo.
   - Aliviadores: verificación; precio publicado y presupuesto aprobado antes; asignación rápida con horario; red de profesionales.
   - Creadores: perfil con foto, matrícula y calificaciones; garantía de 30 días; seguimiento del pedido; códigos de referido y descuento de bienvenida.
   - Tabla de encaje: cada dolor con su aliviador y cada ganancia con su creador.
5. **Estrategia de mercado:** mercado existente; segmentación por nicho; adoptantes tempranos (inquilinos o recién mudados, adultos de 25 a 45 años que usan apps, dueños de alquileres temporarios); TAM, SAM y SOM (sección 6); competencia (sección 8). Competimos **por tiempo** y confianza, no por precio.
6. **Modelo de ingresos y flujo de fondos:** ver sección 7.
7. **Supuestos a revisar:** tabla con ticket, comisión, frecuencia, vida del cliente, hogares, porcentajes de ciudades grandes y de contratación por internet, captación, clientes por mes, tipo de cambio y garantía.

---

## 6. Tamaño de mercado (versión final, aprobada por el usuario)

Criterio pedido por el usuario: **TAM = Latinoamérica, SAM = Argentina, SOM = Mar del Plata**, con números racionales para un emprendimiento de estudiantes. Por eso el SAM se acotó a "Argentina digital".

Supuestos comunes: ticket promedio de **$50.000** por servicio y **2 servicios por hogar por año**.

| Nivel | Para nuestro proyecto | Cálculo | Valor anual |
|---|---|---|---|
| **TAM** | Latinoamérica | 663 M habitantes (CEPAL 2024) ÷ 3,3 personas por hogar ≈ 201 M hogares × 2 × $50.000 | **$20.100.000 millones** (≈ USD 12.900 M) |
| **SAM** | Argentina digital, plan a 5 años | 17,8 M hogares × 50% en ciudades grandes × 30% que contrataría por internet = 2.670.000 hogares × 2 × $50.000 | **$267.000 millones** (≈ USD 171 M); 1,3% del TAM |
| **SOM** | Mar del Plata digital | 262.000 hogares × 30% = 78.600 hogares × 2 × $50.000 | **$7.860 millones** (≈ USD 5 M); 2,9% del SAM |
| **Objetivo del año 1** | 1% del SOM | 786 hogares (≈ 65 por mes) × 2 × $50.000 = $78,6 M facturados | **Ingreso de la app ≈ $11,8 M** (15%) |

- Argentina: 46,2 M habitantes (Censo 2022) ÷ 2,6 = 17,8 M hogares.
- General Pueyrredon: unos 682.000 habitantes ÷ 2,6 ≈ 262.000 hogares.
- Tipo de cambio supuesto: **$1.560 por dólar** (actualizar al día de entrega).
- Supuestos frágiles que pueden cuestionar: 3,3 personas por hogar en Latinoamérica; usar el mismo ticket para toda la región; el 50% y el 30%.

Historial: primero se puso Mar del Plata como TAM (error); después el mundo (USD 385.400 M, IMARC); luego Argentina; el usuario lo consideró irreal y pidió la versión actual.

---

## 7. Modelo de ingresos y finanzas

- **Fuente principal: intermediario.** Comisión del **15% pagada por el prestador**; el cliente ve precio final sin recargo. Con ticket de $50.000, la app ingresa **$7.500 por servicio**.
- **Fuente secundaria: publicidad** de ferreterías y corralones; a futuro, suscripción premium para prestadores.
- **Precios:** fijos basados en lista (servicios estándar); para trabajos no estandarizables, diagnóstico a precio fijo más presupuesto aprobado en la plataforma.
- **Cobro:** el cliente paga por la plataforma (ej. Mercado Pago) y se transfiere al prestador el neto.

### Costos (USD a $1.560)

| Concepto | Tipo | USD | Pesos |
|---|---|---|---|
| Desarrollo web (programador tercerizado) | Inversión inicial | 1.000 | $1.560.000 |
| Validación (encuesta) | Inversión inicial | 800 a 1.000 | $1,25 M a $1,56 M |
| Publicidad Meta y Google | Fijo mensual | 600 | $936.000 |
| Hosting y base de datos (v0 y Supabase gratis) | Fijo mensual | 0 | $0 |
| Comisión del medio de pago | Variable | — | A confirmar |
| Descuentos de bienvenida y referidos | Variable | — | A definir |

Capital inicial: USD 4.000 ($6.240.000), cubre desarrollo, validación y unos 3 meses de publicidad. No incluye sueldos.

### Métricas
- **CAC** = $936.000 ÷ 65 clientes nuevos por mes ≈ **$14.400** (≈ USD 9).
- **LTV** = $50.000 × 15% × 10 servicios (2,5 por año durante 4 años) = **$75.000** (≈ USD 48).
- **LTV/CAC ≈ 5,2** (mayor a 3 se considera sano). El cliente se recupera con el segundo servicio.
- **Punto de equilibrio:** $936.000 ÷ $7.500 ≈ **125 servicios por mes**. El objetivo del año 1 da unos 131 por mes, cerca del equilibrio operativo sin sueldos.
- **Matriz de coherencia financiera:** el cliente paga precio de mercado sin recargo, recibe algo que hoy no tiene, y el prestador acepta 15% porque consigue clientes. Es una hipótesis que valida el MVP.

---

## 8. Competencia

### 8.1 Clickie (competidor directo principal) — https://clickie.com.ar
Analizado el 6 de noviembre de 2026.
- Startup cordobesa, "Uber de los arreglos del hogar". Inversores: Guillermo Rauch (Vercel) y una ronda previa de USD 150.000.
- **Opera en toda Mar del Plata**, además de CABA (28 barrios), GBA (15 localidades), Córdoba Capital, Rosario y La Plata. **El TP dice que no opera en Mar del Plata y hay que corregirlo.**
- Rubros: plomería, gas, electricidad, aire acondicionado, pintura, albañilería, carpintería, lavarropas, heladeras.
- Cifras que publica: más de 50.000 usuarios, 9.800 profesionales verificados, 4,5 estrellas (198 reseñas), precios basados en más de 45.000 presupuestos, respuesta en menos de 5 minutos.
- **Proceso:** chat con IA (1 a 3 preguntas, admite fotos) → precio cerrado o presupuestos para comparar → dirección, horario y login con Google o mail → coordinación por chat → pago por la plataforma al terminar (transferencia o tarjeta).
- **Precio cerrado:** para trabajos comunes, calculado con lo pagado en trabajos anteriores; va el primer profesional disponible a ese precio. Para trabajos a medida, presupuestos.
- **Comisiones (cláusula 13 de sus términos):** **15% al prestador y 10% al cliente**, sobre el importe bruto, sin IVA. Paga al prestador en hasta 72 horas hábiles.
- **Garantía:** reintegro del 100% si el trabajo no se hace o queda mal; daños o equipos no devueltos hasta $500.000 por orden; reclamo dentro de 30 días; requiere pago y chat dentro de la plataforma.
- Materiales no incluidos en precio cerrado; trabajos adicionales se acuerdan por chat antes de hacerlos.
- **Precios (mano de obra, octubre de 2026):** destapación simple $50.000 a $83.000; cambio de canilla $43.000 a $65.000; arreglo de mochila o inodoro $41.000 a $60.000; pérdida en cañería a la vista $42.000 a $116.000; urgencias con recargo del 30% al 50%.
- Herramientas extra: comparador de presupuestos, presupuestador, índice de precios, blog.

**Conclusiones:**
- Precio cerrado ya no es diferencial exclusivo.
- **Nuestros precios están por debajo** de los de Clickie; conviene acercarlos al mercado para que los prestadores acepten.
- Diferencial real: sin comisión al cliente, WhatsApp sin registro, foco local, trato humano. Competimos por tiempo y cercanía, no por escala.

### 8.2 Otros competidores
| Competidor | Tipo | Notas |
|---|---|---|
| Arreglaram | Directa | App marplatense lanzada en 2017; cuota mensual al prestador. Verificar si sigue activa. |
| Servidos (servidos.ar) | Directa | Directorio con contacto por WhatsApp, sin comisión; no gestiona precio ni pago. |
| Tutti, Lavuro (Mendoza), Habitissimo, Yamba, Resolvé | Directa (otras zonas) | Plataformas similares en Argentina. |
| Recomendaciones de conocidos | Indirecta | Gratis y con confianza, pero no está disponible para todos. |
| Grupos barriales de Facebook y WhatsApp | Indirecta | Sin verificación ni precio claro. |

---

## 9. Web del MVP: especificación completa

**Artifact publicado (privado; se comparte desde el menú Compartir):** https://claude.ai/artifact/5MGRqZUrpWf7RT2nZL7BZy
**Código:** `ayudaya.html` (un solo archivo HTML con CSS y JS) más la carpeta `img/` con 12 fotos.

### 9.1 Estructura de la página (en orden)
1. **Header fijo:** logo "Ayuda**Ya**" (Ya en naranja), etiqueta "Mar del Plata · piloto", botón "Pedir un servicio".
2. **Hero:** "Un profesional verificado en tu casa, con precio cerrado antes de que entre." Botones: "Contanos qué pasa" (→ asistente) y "Ver servicios y precios". Chips: prestadores verificados, sin cargos sorpresa, garantía de 30 días. A la derecha, **mosaico de 3 fotos** y una **orden de trabajo de ejemplo** superpuesta (#AY-0142, destape de cañería, $45.000, sello "Precio cerrado").
3. **Cinta de seguridad** naranja y azul.
4. **"Lo que resolvemos":** galería de 6 fotos con precio "desde"; cada una lleva al tarifario del rubro.
5. **Asistente AyudaYa** (sección 10).
6. **Tarifario:** pestañas por rubro; a la izquierda foto del rubro con su nota, a la derecha la lista con código, descripción, precio y botón "Pedir".
7. **Cómo funciona:** 4 pasos sobre fondo de plano técnico.
8. **Por qué AyudaYa:** 4 bloques (quién entra a tu casa, precio que no cambia, respuesta en el día, si algo falla vuelve).
9. **Pedido:** formulario → resumen → WhatsApp.
10. **Prestadores:** fondo con foto del cinturón de herramientas; beneficios y comisión del 15%; botón "Quiero sumarme" (WhatsApp).
11. **Preguntas frecuentes:** precio, pago, zonas, quiénes son los prestadores.
12. **Footer:** "AyudaYa · Servicios para el hogar en Mar del Plata · Piloto 2026".

### 9.2 Tarifario (precios de referencia del piloto, mano de obra)

| Código | Rubro | Servicio | Descripción | Precio |
|---|---|---|---|---|
| PL-01 | Plomería | Visita de diagnóstico | Revisión y presupuesto si hace falta más trabajo | $15.000 |
| PL-02 | Plomería | Cambio de canilla o grifería | Mano de obra | $28.000 |
| PL-03 | Plomería | Reparación de depósito de inodoro | Pérdidas, flotante o descarga | $30.000 |
| PL-04 | Plomería | Destape de cañería | Cocina, baño o pluvial | $45.000 |
| GA-01 | Gas | Visita de diagnóstico | Revisión de artefactos e instalación | $18.000 |
| GA-02 | Gas | Service de calefactor o estufa | Limpieza, regulación, control de llama | $40.000 |
| GA-03 | Gas | Detección de pérdida y prueba de hermeticidad | Con informe | $55.000 |
| GA-04 | Gas | Cambio de calefón o termotanque | Mano de obra de instalación | $85.000 |
| EL-01 | Electricidad | Visita de diagnóstico | Tablero y circuito | $15.000 |
| EL-02 | Electricidad | Colocación o cambio de tomacorriente o llave | Por unidad | $18.000 |
| EL-03 | Electricidad | Corte de luz o disyuntor que salta | Búsqueda y reparación | $35.000 |
| EL-04 | Electricidad | Instalación de ventilador de techo | Con cableado existente | $45.000 |

Notas por rubro: plomería "Plomeros con experiencia comprobable"; gas "Solo gasistas matriculados"; electricidad "Electricistas matriculados para instalaciones".

**Pendiente:** subir precios hacia los valores de mercado (ver Clickie en 8.1) y confirmarlos con los prestadores del piloto.

### 9.3 Formulario de pedido
Campos: servicio (select agrupado por rubro, muestra el precio cerrado), "¿Qué está pasando?", barrio, dirección, día (lo antes posible, hoy, mañana, esta semana), franja (8 a 12, 12 a 16, 16 a 20, cualquier horario), nombre, celular. Validación en la página; si falta algo muestra error.

Al enviar muestra un resumen y un botón **"Enviar por WhatsApp"** (`https://wa.me/<número>?text=<mensaje>`), más "Copiar texto" y "Editar pedido". Formato del mensaje:

```
Hola AyudaYa, quiero pedir un servicio.

Servicio: <nombre> (<rubro>)
Precio cerrado: $<precio>
Problema: <texto>
Barrio: <barrio>
Dirección: <dirección>
Cuándo: <día>, <franja>
Nombre: <nombre>
Celular: <celular>
```

- **Número de WhatsApp:** variable `WA = "5492230000000"` y `WA_TXT = "+54 9 223 000-0000"`. **Es de ejemplo; hay que reemplazarlo por el real.**
- Aviso de gas en la sección: si hay pérdida de gas, cerrar la llave general, ventilar y llamar a la guardia de emergencias de Camuzzi antes de pedir.

### 9.4 Limitaciones conocidas
- Es un HTML estático: los pedidos **no se guardan en una base de datos**; se mandan por WhatsApp (coherente con la asignación manual del MVP).
- La IA del asistente (artifact capability `sample`) **solo funciona para quien abre la página con sesión en claude.ai** y usa su cuenta. Un visitante de Meta Ads ve la versión por palabras clave. Para producción hay que conectar una API de IA propia desde el backend.
- Las fotos son generadas con IA: el tomacorriente es de tipo estadounidense y la llave de gas tiene un grabado ilegible.

---

## 10. Asistente con IA: lógica, prompt y reglas

Pedido del usuario: integrar un asistente tipo Clickie, **pero como herramienta**, no como reemplazo. El tarifario y el formulario siguen funcionando solos.

### 10.1 Flujo
1. La persona describe el problema (o toca un ejemplo: "Gotea la canilla del baño", "Salta la térmica cuando prendo el horno", "El calefón no prende", "Siento olor a gas en la cocina"). Foto opcional si el entorno lo permite.
2. Si falta información, la IA devuelve de 1 a 3 preguntas con 2 a 4 opciones cada una (más un campo "Otra respuesta"). Se pueden saltear.
3. Sugerencia: código, servicio, precio, resumen ("lo que entendimos") y por qué. Si hay riesgo, aviso de seguridad arriba.
4. Botones: "Pedir este servicio" (completa el formulario con servicio y descripción más respuestas, cambia la pestaña del tarifario y lleva al pedido), "Elegir otro servicio", "Empezar de nuevo".
5. Etiqueta de origen: "Sugerencia del asistente con IA · revisala antes de pedir" o "Sugerencia automática por palabras clave · revisala antes de pedir".
6. Cancelar en cualquier momento (con control de concurrencia para ignorar respuestas viejas).

### 10.2 Prompt (se arma con el tarifario actual)
```
Sos el asistente de AyudaYa, una plataforma de Mar del Plata que conecta hogares con plomeros, gasistas y electricistas verificados. Tu tarea es ayudar a la persona a elegir el servicio correcto del tarifario. No sos el profesional: no des instrucciones para que la persona repare algo, solo orientación y consejos básicos de seguridad.

Tarifario (código | rubro | servicio | descripción | precio cerrado):
<una línea por servicio>

Reglas:
- Respondé en español rioplatense, breve y claro, tratando de vos.
- [Primera vuelta] Si la descripción alcanza para elegir con confianza, elegí el servicio y devolvé preguntas vacío. Si falta algo importante para elegir, devolvé de 1 a 3 preguntas cortas, cada una con 2 a 4 opciones de respuesta, y servicio null.
- [Segunda vuelta] La persona ya respondió tus preguntas: elegí un servicio sí o sí y devolvé preguntas vacío.
- Si el problema es de un rubro pero no encaja en un servicio específico, elegí la visita de diagnóstico de ese rubro.
- Si no es de plomería, gas ni electricidad, devolvé servicio null y explicá en resumen que por ahora no cubrimos ese rubro.
- Si hay riesgo (olor a gas, chispas, humo, cables quemados, agua cerca de la electricidad), urgente true y un consejo de seguridad de una o dos frases.

Respondé solo con este JSON: {"preguntas":[{"pregunta":"...","opciones":["...","..."]}],"servicio":"PL-04","resumen":"...","por_que":"...","urgente":false,"seguridad":""}

Descripción de la persona: <texto>
[Preguntas y respuestas: - <pregunta> → <respuesta>]
```
Modelo usado en el artifact: tier rápido (`modelTier: "quick"`), respuesta en JSON.

### 10.3 Alternativa sin IA (siempre disponible)
Se normaliza el texto (minúsculas, sin tildes) y se aplica la primera regla que coincida:

```js
[/olor a gas|huele a gas|perdida de gas|fuga de gas|escape de gas/, "GA-03"],
[/(cambi|instal|nuevo|coloc)[a-z]* .*(calefon|termotanque)|(calefon|termotanque).*(cambi|instal|nuevo)/, "GA-04"],
[/calefactor|estufa|tiro balanceado/, "GA-02"],
[/calefon|termotanque|hornalla|horno a gas|\bgas\b|piloto/, "GA-01"],
[/disyuntor|termica|salta|corte de luz|sin luz|se corta la luz|se fue la luz/, "EL-03"],
[/enchufe|tomacorriente|toma corriente|llave de luz|interruptor|tecla de luz/, "EL-02"],
[/ventilador/, "EL-04"],
[/\bluz\b|cable|electric|chispa|lampara|foco/, "EL-01"],
[/tapad|destap|no traga|no desagota|desagote|desague|cloaca/, "PL-04"],
[/canilla|griferia|gotea|monocomando/, "PL-02"],
[/inodoro|mochila|deposito|cadena/, "PL-03"],
[/agua|perdida|cano|humedad|filtra|gotera|bacha|pileta/, "PL-01"]
```
Probado: "Gotea la canilla del baño" → PL-02; "Salta la térmica…" → EL-03; "El calefón no prende" → GA-01; "Siento olor a gas…" → GA-03; "la pileta de la cocina no traga" → PL-04; "quiero cambiar el termotanque" → GA-04; "se cayó un cuadro" → sin sugerencia.

### 10.4 Avisos de seguridad (no dependen de la IA)
- Gas (`olor a gas|huele a gas|fuga|escape de gas|perdida de gas`): "Cerrá la llave general de gas, abrí puertas y ventanas, no prendas ni apagues luces ni uses fuego, y llamá a la guardia de emergencias de Camuzzi."
- Electricidad (`chispa|humo|quemad|olor a quemado|se quemo`): "Bajá la térmica general y no toques cables ni artefactos hasta que llegue el electricista."

---

## 11. Diseño visual y fotos

- **Colores (mantener azul oscuro y naranja):**
  - Claro: fondo `#F3F5F7`, superficie `#FFFFFF`, hundido `#E8EDF2`, tinta `#13233A`, apagado `#5A6B80`, línea `#D6DEE6`, acento `#D2510D`, acento texto `#B4440A`, ok `#0E8262`.
  - Oscuro: fondo `#0D1520`, superficie `#152030`, tinta `#E7EDF4`, acento `#FF7B36`, ok `#47C99F`.
  - Cobre `#F0B48A`/`#C46A36`/`#7E3F1C`, bronce `#C79A3A`.
- **Tipografías (Google Fonts):** Archivo condensada (títulos), Public Sans (texto), IBM Plex Mono (precios, códigos, etiquetas).
- **Elementos de oficio:** cinta de seguridad a rayas, tramo de caño de cobre con uniones de bronce sobre cada título, fondo de plano técnico (cuadrícula), orden de trabajo con sello "Precio cerrado", códigos de servicio tipo PL-04.
- **Fotos:** generadas con IA en Canva (collage de 12) y recortadas. Mapeo:

| Archivo | Contenido | Dónde se usa |
|---|---|---|
| `plomero-bacha.jpg` | Plomero bajo una bacha | Hero (grande) |
| `tablero-casco.jpg` | Electricista con casco en tablero | Hero; tarifario electricidad |
| `llama-gas.jpg` | Hornalla con llama azul | Hero; tarifario gas |
| `destapacion.jpg` | Destapación con máquina | Galería |
| `llave-sifon.jpg` | Llave ajustando sifón | Galería |
| `llave-cano.jpg` | Llave Stillson en caño | Galería |
| `llave-gas.jpg` | Llave de gas amarilla en caño de cobre | Galería |
| `tomacorriente.jpg` | Colocando un tomacorriente | Galería |
| `electricista-chaleco.jpg` | Electricista con chaleco en medidor | Galería |
| `manos-valvula.jpg` | Manos ajustando una válvula | Tarifario plomería |
| `herramientas-piso.jpg` | Herramientas y conexiones en el piso | Asistente |
| `cinturon.jpg` | Cinturón de herramientas | Fondo de prestadores |

Otros collages generados en Canva (sin descargar en alta): MAHaLm_iMPM (plomería), MAHaLpc_cms (gas), MAHaLgIkNlk (electricidad).

---

## 12. Decisiones tomadas (registro)

| Fecha | Decisión |
|---|---|
| 30/10/2026 | No hay consigna escrita: el TP se arma con las secciones del documento del grupo más lo que piden los apuntes. |
| 30/10/2026 | Modelo de ingresos: **comisión al prestador** (15%). |
| 30/10/2026 | Usar **supuestos razonables** marcados para revisión. |
| 30/10/2026 | La app sin nombre en el TP ("la app"). |
| 30/10/2026 | TAM debe seguir la definición de los apuntes (mercado global). |
| 06/11/2026 | **TAM Latinoamérica, SAM Argentina, SOM Mar del Plata**; números racionales para estudiantes; SAM acotado a "Argentina digital". |
| 06/11/2026 | Web: **web del MVP** (no la web app completa ni la landing institucional), armada como artifact, con el nombre **AyudaYa**. |
| 06/11/2026 | Clickie identificado como competidor directo en Mar del Plata. |
| 06/11/2026 | Asistente con IA integrado **como herramienta**, con alternativa sin IA. |
| 06/11/2026 | Diseño con más realismo: **fotos de oficios generadas con IA**, mantener azul oscuro y naranja. |

---

## 13. Pendientes y próximos pasos

**Datos que tiene que poner el grupo**
- [ ] Resultados de la encuesta (cantidad de encuestados, porcentajes) en el TP y como tracción en el pitch.
- [ ] Zona o barrio del piloto en Mar del Plata.
- [ ] Número real de WhatsApp de AyudaYa en la web.
- [ ] Confirmar precios con prestadores.
- [ ] Confirmar si Arreglaram sigue activa.

**TP**
- [ ] Corregir la tabla de competencia: Clickie opera en Mar del Plata y cobra 15% al prestador más 10% al cliente.
- [ ] Reescribir el diferencial: precio cerrado **sin comisión al cliente**, atención local por WhatsApp, respuesta en el día.
- [ ] Agregar el asistente con IA a la sección del MVP.
- [ ] Ajustar precios del tarifario y, si cambia el ticket, recalcular TAM/SAM/SOM, LTV, CAC y punto de equilibrio.
- [ ] Actualizar el tipo de cambio.

**Web**
- [ ] Subir los precios hacia el mercado.
- [ ] Reemplazar o quitar la foto del tomacorriente estadounidense y la de la llave de gas con grabado ilegible.
- [ ] Agregar el diferencial "sin comisión para el cliente" en hero y en "Por qué AyudaYa".

**Entregas**
- [ ] Pitch deck con las 9 perlas (10 a 14 slides).
- [ ] Guion del pitch de 3 minutos (storytelling con un consumidor ejemplar).
- [ ] Web app completa en v0 + Supabase (sección 14).
- [ ] Dominio (ej. `ayudaya.com`).

---

## 14. Propuesta de arquitectura para la web app completa (v0 + Supabase)

> Propuesta para seguir en Claude Code. No está construida todavía. Respetar el alcance del MVP: empezar simple.

### 14.1 Stack sugerido
- **Frontend:** Next.js (lo que genera v0) + Tailwind. Partir del diseño de `ayudaya.html` (colores, tipografías, secciones, textos).
- **Backend y base de datos:** Supabase (Postgres, Auth, Storage para fotos, Row Level Security).
- **IA del asistente:** route handler del servidor que llama a la API de Claude con el prompt de la sección 10.2. La clave va en variables de entorno del servidor, nunca en el cliente. Mantener la alternativa por palabras clave si la API falla.
- **Notificaciones:** al inicio, link a WhatsApp como hoy; más adelante, WhatsApp Business API.
- **Pagos (más adelante):** Mercado Pago.

### 14.2 Roles y paneles (pedido del profesor)
1. **Usuario (cliente):** landing, asistente, tarifario, pedido, seguimiento del pedido, calificación. La parte más cuidada en UI/UX.
2. **Prestador:** alta con datos y matrícula, ver pedidos asignados, aceptar o rechazar, marcar como hecho, cargar presupuesto adicional para aprobación.
3. **Super admin:** alta y verificación de prestadores, asignación manual de pedidos, edición del tarifario, dashboard con las métricas de las hipótesis del MVP.

### 14.3 Tablas sugeridas
- `profiles` (id = auth.users.id, rol: cliente | prestador | admin, nombre, celular)
- `prestadores` (profile_id, rubros[], matricula, zona, estado_verificacion, calificacion_promedio)
- `servicios` (codigo PL-01…, rubro, nombre, descripcion, precio, activo)
- `pedidos` (id, cliente_id, servicio_codigo, precio_cerrado, problema, barrio, direccion, dia, franja, estado: nuevo | asignado | en_curso | terminado | cancelado, prestador_id, origen: asistente_ia | palabras_clave | tarifario, created_at, asignado_at, terminado_at)
- `presupuestos_adicionales` (pedido_id, monto, detalle, estado: pendiente | aprobado | rechazado)
- `calificaciones` (pedido_id, puntaje 1-5, comentario)
- `eventos` (para medir: visita, inicio_asistente, sugerencia, pedido_enviado)

### 14.4 Métricas del dashboard (hipótesis del MVP)
Solicitudes por semana; conversión visitas → solicitudes; solicitudes → contrataciones; tiempo hasta asignar; % trabajos sin cambio de precio no aprobado; calificación promedio; recompra a 90 días; prestadores activos al segundo mes; servicios más pedidos; cancelaciones.

---

## 15. Archivos y enlaces

| Qué | Dónde |
|---|---|
| TP (documento editable) | https://claude.ai/artifact/SRnstiTV5nDFXUnhEvw6Qb |
| Web del MVP (artifact) | https://claude.ai/artifact/5MGRqZUrpWf7RT2nZL7BZy |
| Código de la web | `ayudaya.html` |
| Fotos | `img/*.jpg` (12 archivos) |
| Este contexto | `ayudaya-contexto.md` (se puede renombrar a `CLAUDE.md`) |

Para abrir la web localmente: abrir `ayudaya.html` en el navegador con la carpeta `img/` al lado. Fuera de claude.ai el asistente usa la versión por palabras clave.

---

## 16. Fuentes

- Clickie: https://clickie.com.ar/ , /como-funciona , /terminos-y-condiciones , /precios/plomero (consultadas el 6/11/2026)
- El Cronista, Clickie se expande a La Plata y Rosario (agosto de 2026): https://www.cronista.com/infotechnology/entreprenerds/crearon-el-uber-de-los-arreglos-del-hogar-y-ahora-desembarcan-en-dos-grandes-ciudades-argentinas/
- La Capital de Mar del Plata, Arreglaram (septiembre de 2017): https://www.lacapitalmdp.com/el-uber-de-los-servicios-al-alcance-de-todos/
- Servidos: https://servidos.ar/nosotros
- CEPAL, tendencias demográficas de América Latina y el Caribe (julio de 2025): https://rtc-cea.cepal.org/sites/default/files/2025-07/presentacion-simone-cecchini.pdf
- Datos definitivos del Censo 2022 (El Heraldo, noviembre de 2023): https://www.elheraldo.com.ar/noticias/interes-general/datos-definitivos-del-censo-2022-la-argentina-tiene-46234830-habitantes
- Apuntes de clase de Taller Emprendedor (Lean Startup, Canvas, lienzo de propuesta de valor, tamaño de mercado, recursos y actividades clave, pitch).

---

## 17. Actualización del 6 de noviembre de 2026 (web real en `web/`)

Se pasó del HTML estático a una web app **Next.js + Supabase** en la carpeta `web/` (el `ayudaya.html` queda como referencia del primer diseño).

**Decisiones nuevas (reemplazan lo contrario de las secciones 4 y 9):**
- **Puja inversa:** el cliente publica el problema (oficio, descripción, foto, día y turno), los prestadores ofertan y el cliente elige. La oferta elegida queda como precio cerrado. La cuenta regresiva de **1 hora arranca con la primera oferta**; el cliente elige recién cuando cierra.
- **Turnos de 4 horas:** 8–12, 12–16 y 16–20.
- **Sin límite geográfico:** se quitó "Mar del Plata" de la web (el piloto en el TP sigue siendo zona Constitución).
- **Registro completo:** nombre, celular, mail, dirección, barrio (opcional), código postal, ciudad, provincia, indicaciones y consentimiento para compartir la dirección con el prestador.
- **Mail de recordatorio 24 h antes:** pedido en el PDF "MVP AyudaYa", pero **se dejó de lado** por ahora.
- **Diseño:** estilo app móvil (naranja y negro, mosaicos con íconos, buscador, barra inferior), tomado de una referencia que cargó el usuario.

**Estado de `web/`:** portada, registro, completar datos, login, nuevo pedido, ofertas con cuenta regresiva y mis pedidos. Esquema en `web/supabase/schema.sql`.

**Falta:** conectar Supabase (copiar `.env.example` a `.env.local` y correr el SQL), panel del prestador (hoy nadie puede ofertar), IA de consultas siempre disponible, panel admin, y actualizar el TP (Clickie sí opera en Mar del Plata; el diferencial ya no es "no competimos por precio"; "1% del SOM", no del SAM).

**Para correrla:** `cd web && npm install && npm run dev`.
