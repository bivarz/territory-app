import { useState, useEffect } from "react";
import { X, Search as SearchIcon } from "lucide-react";
import { PolygonFeature, GeoJSONData } from "../../App";
import "./SearchModal.css";

type TerritoryType = "cidade" | "bairro" | "distrito" | "todos";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  geoJsonData: GeoJSONData | null;
  onSelectPolygon: (polygon: PolygonFeature) => void;
  onHighlightPolygon: (polygonId: string | null) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  geoJsonData,
  onSelectPolygon,
  onHighlightPolygon,
}: SearchModalProps) {
  const [territoryType, setTerritoryType] = useState<TerritoryType>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<PolygonFeature[]>([]);
  const [selectedResult, setSelectedResult] = useState<PolygonFeature | null>(
    null
  );

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setResults([]);
      setSelectedResult(null);
    }
  }, [isOpen]);

  const searchPolygons = () => {
    if (!geoJsonData || !searchTerm.trim()) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered: PolygonFeature[] = [];

    geoJsonData.features.forEach((feature) => {
      const props = feature.properties;
      let matchScore = 0;

      // Busca exata por número da quadra (prioridade alta)
      const quadraNumber = extractQuadraNumber(props);
      if (quadraNumber) {
        // Busca exata tem prioridade máxima
        if (quadraNumber === term) {
          matchScore = 100;
        } else if (
          quadraNumber.startsWith(term) &&
          term.length < quadraNumber.length
        ) {
          // Números que começam com o termo mas não são exatos (ex: "1" encontra "10", "100")
          // Mas só se o termo for menor que o número completo
          matchScore = 40;
        } else if (quadraNumber.includes(term) && term.length >= 2) {
          // Busca parcial apenas para termos com 2+ caracteres para evitar muitos falsos positivos
          matchScore = 20;
        }
      }

      // Se o termo é apenas um número, prioriza correspondência exata
      if (/^\d+$/.test(term)) {
        // Se é busca numérica, só aceita se for exata ou começar com o termo
        if (
          quadraNumber &&
          quadraNumber !== term &&
          !quadraNumber.startsWith(term)
        ) {
          matchScore = 0;
        }
      }

      // Busca por nome de rua nas propriedades (prioridade média)
      for (const [key, value] of Object.entries(props)) {
        if (
          key.toLowerCase().includes("rua") ||
          key.toLowerCase().includes("avenida") ||
          key.toLowerCase().includes("estrada") ||
          key.toLowerCase().includes("logradouro") ||
          key.toLowerCase().includes("endereco") ||
          key.toLowerCase().includes("endereço") ||
          key.toLowerCase().includes("street") ||
          key.toLowerCase().includes("address")
        ) {
          const valueStr = String(value).toLowerCase();
          // Busca exata tem prioridade
          if (valueStr === term) {
            matchScore = Math.max(matchScore, 80);
          } else if (valueStr.includes(term)) {
            matchScore = Math.max(matchScore, 40);
          }
        }
      }

      // Busca em todas as propriedades (prioridade baixa)
      for (const [key, value] of Object.entries(props)) {
        const keyLower = key.toLowerCase();
        const valueStr = String(value).toLowerCase();

        // Verifica se é um campo de território relevante
        const isTerritoryField =
          keyLower.includes("cidade") ||
          keyLower.includes("bairro") ||
          keyLower.includes("distrito") ||
          keyLower.includes("municipio") ||
          keyLower.includes("município");

        if (isTerritoryField && valueStr.includes(term)) {
          // Verifica o tipo de território selecionado
          let territoryMatches = false;
          if (territoryType === "todos") {
            territoryMatches = true;
          } else if (
            territoryType === "cidade" &&
            keyLower.includes("cidade")
          ) {
            territoryMatches = true;
          } else if (
            territoryType === "bairro" &&
            keyLower.includes("bairro")
          ) {
            territoryMatches = true;
          } else if (
            territoryType === "distrito" &&
            keyLower.includes("distrito")
          ) {
            territoryMatches = true;
          }

          if (territoryMatches) {
            if (valueStr === term) {
              matchScore = Math.max(matchScore, 60);
            } else {
              matchScore = Math.max(matchScore, 20);
            }
          }
        }
      }

      // Busca no nome do polígono
      const nome = String(props.nome || "").toLowerCase();
      if (nome === term) {
        matchScore = Math.max(matchScore, 70);
      } else if (nome.includes(term)) {
        matchScore = Math.max(matchScore, 30);
      }

      if (matchScore > 0) {
        filtered.push({ feature, score: matchScore } as {
          feature: PolygonFeature;
          score: number;
        });
      }
    });

    // Ordena por score (maior primeiro) e retorna apenas os features
    filtered.sort((a, b) => b.score - a.score);
    setResults(
      filtered.map(
        (item: { feature: PolygonFeature; score: number }) => item.feature
      )
    );
  };

  const extractQuadraNumber = (props: Record<string, any>): string | null => {
    // Tenta extrair número da quadra de várias formas
    for (const [key, value] of Object.entries(props)) {
      if (
        key.includes("Quadra") ||
        key.includes("Cartão") ||
        key.includes("Cartao")
      ) {
        const match = String(value).match(/(\d+)/);
        if (match) return match[1];
      }
    }

    const nome = props.nome || "";
    const nomeMatch = nome.match(/(\d+)/);
    if (nomeMatch) return nomeMatch[1];

    const id = props.id || "";
    const idMatch = id.match(/(\d+)/);
    if (idMatch) return idMatch[1];

    return null;
  };

  const handleSearch = () => {
    searchPolygons();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelectResult = (polygon: PolygonFeature) => {
    console.log(
      "Polígono selecionado:",
      polygon.properties.id,
      polygon.properties.nome
    );
    setSelectedResult(polygon);
    // Primeiro destaca o polígono
    onHighlightPolygon(polygon.properties.id);
    // Depois centraliza no polígono
    onSelectPolygon(polygon);
    // Remove o destaque após 5 segundos
    setTimeout(() => {
      onHighlightPolygon(null);
    }, 5000);
    // Fecha o modal após um pequeno delay
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div
        className="search-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-modal-header">
          <h2>Pesquisar Localização</h2>
          <button onClick={onClose} className="search-modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="search-modal-body">
          <div className="search-field-group">
            <label htmlFor="territory-type">Tipo de Território:</label>
            <select
              id="territory-type"
              value={territoryType}
              onChange={(e) =>
                setTerritoryType(e.target.value as TerritoryType)
              }
            >
              <option value="todos">Todos</option>
              <option value="cidade">Cidade</option>
              <option value="bairro">Bairro</option>
              <option value="distrito">Distrito</option>
            </select>
          </div>

          <div className="search-field-group">
            <label htmlFor="search-input">
              Pesquisar (Rua ou Número da Quadra):
            </label>
            <div className="search-input-container">
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite o nome da rua ou número da quadra..."
                className="search-input"
              />
              <button onClick={handleSearch} className="search-submit-button">
                <SearchIcon size={20} />
              </button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="search-results">
              <h3>Resultados ({results.length}):</h3>
              <div className="results-list">
                {results.map((polygon) => {
                  const quadraNumber = extractQuadraNumber(polygon.properties);
                  return (
                    <div
                      key={polygon.properties.id}
                      className={`result-item ${
                        selectedResult?.properties.id === polygon.properties.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        console.log(
                          "Clicou no resultado:",
                          polygon.properties.id,
                          polygon.properties.nome,
                          "Quadra:",
                          quadraNumber
                        );
                        handleSelectResult(polygon);
                      }}
                    >
                      <div className="result-header">
                        <strong>{polygon.properties.nome}</strong>
                        <span className="result-id">
                          ID: {polygon.properties.id}
                        </span>
                        {quadraNumber && (
                          <span className="quadra-badge">Q{quadraNumber}</span>
                        )}
                      </div>
                      <div className="result-details">
                        {Object.entries(polygon.properties)
                          .filter(
                            ([key]) => !["id", "nome", "status"].includes(key)
                          )
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <div key={key} className="result-property">
                              <span className="property-key">{key}:</span>
                              <span className="property-value">
                                {String(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {searchTerm && results.length === 0 && (
            <div className="search-no-results">
              Nenhum resultado encontrado para "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

