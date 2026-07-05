import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockPath = path.join(__dirname, "../src/data/motorcycles-mock.json");
const data = JSON.parse(fs.readFileSync(mockPath, "utf-8"));

const imageUrl =
  "https://extranet.incolmotos-yamaha.com.co/wp-content/uploads/2025/08/mt15-sp.jpg";

const descriptions = {
  "tenere-700": {
    description:
      "La Ténéré 700 es una adventure verdadera, diseñada para conquistar cualquier terreno con su motor bicilíndrico y suspensión de largo recorrido.",
    fullDescription:
      "La Yamaha Ténéré 700 es la compañera perfecta para aventuras sin límites. Inspirada en las legendarias Dakar, combina un motor CP2 de 689cc con un chasis tubular de acero y suspensión de largo recorrido. Su diseño minimalista y robusto la hace ideal para explorar caminos desconocidos con total confianza.",
  },
  "xmax-300": {
    description:
      "El XMAX 300 es el scooter premium de Yamaha, que combina estilo, confort y tecnología avanzada para la movilidad urbana.",
    fullDescription:
      "El Yamaha XMAX 300 redefine el concepto de scooter premium. Con su motor Blue Core de 292cc, ofrece un rendimiento excepcional y bajo consumo. Equipado con Smart Key, conectividad Bluetooth y un amplio espacio de almacenamiento, es la elección perfecta para riders urbanos que buscan comodidad y estilo.",
  },
  "mt-07": {
    description:
      "La MT-07 es la naked accesible que ofrece diversión pura con su motor CP2 y chasis ultraligero.",
    fullDescription:
      "La Yamaha MT-07 es sinónimo de diversión en estado puro. Su motor bicilíndrico CP2 de 689cc entrega un par generoso desde bajas revoluciones, mientras que su chasis ligero de solo 184 kg garantiza una agilidad excepcional. Perfecta para riders que buscan emociones sin complicaciones.",
  },
  "yzf-r7": {
    description:
      "La YZF-R7 es la deportiva supersport que combina rendimiento de pista con usabilidad diaria.",
    fullDescription:
      "La Yamaha YZF-R7 trae la emoción de las carreras a la calle. Con el probado motor CP2 de 689cc en un chasis deportivo inspirado en la R1, ofrece un equilibrio perfecto entre rendimiento y accesibilidad. Su diseño aerodinámico y posición de conducción deportiva la convierten en la elección ideal para track days y carreteras sinuosas.",
  },
  "tracer-9-gt": {
    description:
      "La Tracer 9 GT es la sport touring definitiva, con tecnología de vanguardia y comodidad para largos viajes.",
    fullDescription:
      "La Yamaha Tracer 9 GT es la máquina perfecta para devoradores de kilómetros. Equipada con control de crucero adaptativo, suspensión electrónica y maletas laterales integradas, combina el motor CP3 de 119 HP con el confort necesario para viajes de larga distancia. Su TFT a color de 7 pulgadas y múltiples ayudas electrónicas la hacen una touring de última generación.",
  },
  xsr900: {
    description:
      "La XSR900 combina diseño retro con tecnología moderna, creando una naked heritage única.",
    fullDescription:
      "La Yamaha XSR900 es un tributo al legado de Yamaha con tecnología del siglo XXI. Su estética neo-retro esconde un corazón moderno: el potente motor CP3 de 890cc con 119 HP. Con control de tracción, modos de conducción y TFT display, ofrece una experiencia de conducción emocionante envuelta en un diseño atemporal.",
  },
  niken: {
    description:
      "La Niken es revolucionaria con su sistema LMW de tres ruedas, ofreciendo estabilidad y confianza sin precedentes.",
    fullDescription:
      "La Yamaha Niken rompe todos los esquemas con su innovador sistema LMW (Leaning Multi-Wheel). Sus dos ruedas delanteras le otorgan una tracción y estabilidad superiores en cualquier condición, mientras mantiene la emoción y agilidad de una moto deportiva. Equipada con el motor CP3 de 847cc, es una experiencia de conducción única.",
  },
  wr250f: {
    description:
      "La WR250F es una enduro de competición homologada para calle, diseñada para dominar el off-road.",
    fullDescription:
      "La Yamaha WR250F es una auténtica máquina de enduro con matrícula. Su motor monocilíndrico de 250cc de 4 tiempos ofrece potencia explosiva, mientras que su suspensión totalmente ajustable y chasis ligero de 119 kg la hacen increíblemente ágil en terrenos técnicos. Perfecta para riders que viven para el off-road.",
  },
};

data.motorcycles = data.motorcycles.map((moto) => {
  const slug = moto.id;
  const desc = descriptions[slug] || {
    description: `La ${moto.name} es una motocicleta ${moto.category} de alto rendimiento.`,
    fullDescription: `La Yamaha ${moto.name} representa lo mejor de la categoría ${moto.category}. Equipada con un motor ${moto.engine.type} de ${moto.engine.displacement}, ofrece ${moto.engine.power} de potencia y un rendimiento excepcional.`,
  };

  return {
    ...moto,
    slug,
    description: desc.description,
    fullDescription: desc.fullDescription,
    images: {
      main: imageUrl,
      gallery: [imageUrl, imageUrl, imageUrl, imageUrl],
    },
  };
});

fs.writeFileSync(mockPath, JSON.stringify(data, null, 2));
console.log("✅ Mock actualizado correctamente!");
