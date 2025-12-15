const fs = require('fs');

// GeoJSON fornecido pelo usuário
const userGeoJson = {
  "type": "FeatureCollection",
  "features": [
    // O JSON completo será processado aqui
  ]
};

// Função para processar cada feature
function processFeature(feature, index) {
  const props = feature.properties || {};
  const id = props.id || feature.id || `polygon-${index + 1}`;
  const nome = props.nome || props["Quadra 1"] || `Polígono ${index + 1}`;
  const status = props.status || "nao_iniciado";
  
  // Preservar outras propriedades
  const otherProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (!['id', 'nome', 'status'].includes(key)) {
      otherProps[key] = value;
    }
  }
  
  return {
    type: "Feature",
    properties: {
      id: String(id),
      nome: String(nome),
      status: status,
      ...otherProps
    },
    geometry: feature.geometry
  };
}

// Ler o JSON do usuário de um arquivo temporário ou processar diretamente
// Por enquanto, vou criar uma função que pode ser chamada com o JSON completo

function processGeoJson(inputGeoJson) {
  return {
    type: "FeatureCollection",
    features: inputGeoJson.features.map(processFeature)
  };
}

// Se executado diretamente, tentar ler de um arquivo
if (require.main === module) {
  const inputFile = process.argv[2];
  if (inputFile && fs.existsSync(inputFile)) {
    const inputGeoJson = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const processed = processGeoJson(inputGeoJson);
    fs.writeFileSync('src/data/dormentes-blocks.json', JSON.stringify(processed, null, 2));
    console.log(`✓ Processed ${processed.features.length} polygons`);
    console.log(`✓ Saved to src/data/dormentes-blocks.json`);
  } else {
    console.log('Usage: node update-polygons.js <input-geojson-file>');
    console.log('Or provide the JSON directly in the code');
  }
}

module.exports = { processGeoJson, processFeature };

