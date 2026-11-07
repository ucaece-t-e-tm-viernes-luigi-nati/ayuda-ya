export const OFICIOS = [
  { id: "plomeria", nombre: "Plomería", foto: "/img/plomero-bacha.jpg", ejemplo: "Pérdidas, canillas, destapes" },
  { id: "electricidad", nombre: "Electricista", foto: "/img/tablero-casco.jpg", ejemplo: "Tomas, térmica, tablero" },
  { id: "gas", nombre: "Gasista", foto: "/img/llama-gas.jpg", ejemplo: "Calefones, estufas, pérdidas" },
  { id: "aire", nombre: "Aire acondicionado", ejemplo: "Instalación y service" },
  { id: "pintura", nombre: "Pintura", ejemplo: "Interiores, exteriores, humedad" },
  { id: "albanileria", nombre: "Albañilería", ejemplo: "Revoques, reparaciones, pisos" },
  { id: "carpinteria", nombre: "Carpintería", ejemplo: "Puertas, muebles, placares" },
  { id: "cerrajeria", nombre: "Cerrajería", ejemplo: "Cerraduras, aperturas, llaves" },
  { id: "electrodomesticos", nombre: "Electrodomésticos", ejemplo: "Lavarropas, heladeras" },
  { id: "otro", nombre: "Otro oficio", ejemplo: "Contanos qué necesitás" },
] as const;

export const TURNOS = [
  { id: "8-12", nombre: "Mañana", rango: "8 a 12 hs" },
  { id: "12-16", nombre: "Tarde", rango: "12 a 16 hs" },
  { id: "16-20", nombre: "Noche temprana", rango: "16 a 20 hs" },
] as const;

export const nombreOficio = (id: string) => OFICIOS.find((o) => o.id === id)?.nombre ?? id;
export const rangoTurno = (id: string) => TURNOS.find((t) => t.id === id)?.rango ?? id;
export const pesos = (n: number) => "$" + n.toLocaleString("es-AR");
