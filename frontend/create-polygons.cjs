const fs = require("fs");

// JSON fornecido pelo usuário - vou processar diretamente
// Como o JSON é muito grande, vou criar uma função que processa cada feature

// Função para processar cada feature
function processFeature(feature, index) {
  const props = feature.properties || {};
  const id = props.id || feature.id || `polygon-${index + 1}`;
  const nome = props.nome || props["Quadra 1"] || `Polígono ${index + 1}`;
  const status = props.status || "nao_iniciado";

  // Preservar outras propriedades
  const otherProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (!["id", "nome", "status"].includes(key)) {
      otherProps[key] = value;
    }
  }

  return {
    type: "Feature",
    properties: {
      id: String(id),
      nome: String(nome),
      status: status,
      ...otherProps,
    },
    geometry: feature.geometry,
  };
}

// O JSON completo será fornecido aqui
// Por enquanto, vou criar uma função que processa qualquer GeoJSON
function processGeoJson(inputGeoJson) {
  return {
    type: "FeatureCollection",
    features: inputGeoJson.features.map(processFeature),
  };
}

// Se executado diretamente, processar o JSON fornecido
if (require.main === module) {
  const inputFile = process.argv[2];

  if (inputFile && fs.existsSync(inputFile)) {
    try {
      let fileContent = fs.readFileSync(inputFile, "utf8");
      // Remove BOM se existir
      if (fileContent.charCodeAt(0) === 0xfeff) {
        fileContent = fileContent.slice(1);
      }
      const inputGeoJson = JSON.parse(fileContent);
      const processed = processGeoJson(inputGeoJson);
      fs.writeFileSync(
        "src/data/dormentes-blocks.json",
        JSON.stringify(processed, null, 2),
        "utf8"
      );
      console.log(`✓ Processed ${processed.features.length} polygons`);
      console.log(`✓ Saved to src/data/dormentes-blocks.json`);
    } catch (error) {
      console.error("Error processing JSON:", error.message);
      console.error("Stack:", error.stack);
    }
  } else {
    console.log("Usage: node create-polygons.cjs <input-geojson-file>");
    console.log("Por favor, salve o JSON fornecido em um arquivo primeiro.");
  }
}

module.exports = { processGeoJson, processFeature };
