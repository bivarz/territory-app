import { useState, useEffect, useCallback } from "react";
import { X, Search as SearchIcon } from "lucide-react";
import { PolygonFeature, GeoJSONData } from "../../types/polygon";
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

  // Função para carregar propriedades do localStorage (igual ao EditPolygonModal)
  const loadPolygonProperties = (polygonId: string, originalProps: Record<string, any>): Record<string, any> => {
    const STORAGE_PREFIX = 'polygon-';
    const STORAGE_SUFFIX = '-properties';
    const key = `${STORAGE_PREFIX}${polygonId}${STORAGE_SUFFIX}`;
    const savedData = localStorage.getItem(key);
    if (savedData) {
      try {
        const savedProps = JSON.parse(savedData);
        return { ...originalProps, ...savedProps };
      } catch {
        return originalProps;
      }
    }
    return originalProps;
  };

  const searchPolygons = useCallback(() => {
    if (!geoJsonData || !searchTerm.trim()) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered: Array<{ feature: PolygonFeature; score: number }> = [];

    geoJsonData.features.forEach((feature) => {
      // Carrega propriedades originais + propriedades salvas no localStorage
      const originalProps = feature.properties;
      const allProps = loadPolygonProperties(originalProps.id, originalProps);
      
      let matchScore = 0;
      let matchedFields: string[] = [];

      // Busca específica por QUADRA (prioridade máxima)
      for (const [key, value] of Object.entries(allProps)) {
        const keyLower = key.toLowerCase();
        const valueStr = String(value).toLowerCase();
        
        // Verifica se é um campo de quadra
        if (
          keyLower.includes("quadra") ||
          keyLower.includes("cartão") ||
          keyLower.includes("cartao")
        ) {
          // Busca exata no valor
          if (valueStr === term) {
            matchScore = Math.max(matchScore, 100);
            matchedFields.push(key);
          } 
          // Busca parcial no valor
          else if (valueStr.includes(term)) {
            matchScore = Math.max(matchScore, 90);
            matchedFields.push(key);
          }
          // Busca por número extraído
          else {
            const match = valueStr.match(/(\d+)/);
            if (match && match[1] === term) {
              matchScore = Math.max(matchScore, 95);
              matchedFields.push(key);
            } else if (match && match[1].includes(term)) {
              matchScore = Math.max(matchScore, 85);
              matchedFields.push(key);
            }
          }
        }
      }

      // Busca específica por RUA (prioridade alta)
      for (const [key, value] of Object.entries(allProps)) {
        const keyLower = key.toLowerCase();
        const valueStr = String(value).toLowerCase();
        
        if (
          keyLower.includes("rua") ||
          keyLower.includes("avenida") ||
          keyLower.includes("estrada") ||
          keyLower.includes("logradouro") ||
          keyLower.includes("endereco") ||
          keyLower.includes("endereço") ||
          keyLower.includes("street") ||
          keyLower.includes("address")
        ) {
          // Busca exata
          if (valueStr === term) {
            matchScore = Math.max(matchScore, 80);
            if (!matchedFields.includes(key)) matchedFields.push(key);
          } 
          // Busca parcial
          else if (valueStr.includes(term)) {
            matchScore = Math.max(matchScore, 70);
            if (!matchedFields.includes(key)) matchedFields.push(key);
          }
        }
      }

      // Busca específica por BAIRRO (prioridade alta)
      for (const [key, value] of Object.entries(allProps)) {
        const keyLower = key.toLowerCase();
        const valueStr = String(value).toLowerCase();
        
        if (keyLower.includes("bairro")) {
          // Verifica o filtro de território
          let shouldSearch = false;
          if (territoryType === "todos" || territoryType === "bairro") {
            shouldSearch = true;
          }

          if (shouldSearch) {
            // Busca exata
            if (valueStr === term) {
              matchScore = Math.max(matchScore, 80);
              if (!matchedFields.includes(key)) matchedFields.push(key);
            } 
            // Busca parcial
            else if (valueStr.includes(term)) {
              matchScore = Math.max(matchScore, 70);
              if (!matchedFields.includes(key)) matchedFields.push(key);
            }
          }
        }
      }

      // Busca em outros campos de território (cidade, distrito)
      if (territoryType !== "todos") {
        for (const [key, value] of Object.entries(allProps)) {
          const keyLower = key.toLowerCase();
          const valueStr = String(value).toLowerCase();
          
          if (
            (territoryType === "cidade" && keyLower.includes("cidade")) ||
            (territoryType === "distrito" && keyLower.includes("distrito")) ||
            (territoryType === "cidade" && (keyLower.includes("municipio") || keyLower.includes("município")))
          ) {
            if (valueStr === term) {
              matchScore = Math.max(matchScore, 75);
              if (!matchedFields.includes(key)) matchedFields.push(key);
            } else if (valueStr.includes(term)) {
              matchScore = Math.max(matchScore, 65);
              if (!matchedFields.includes(key)) matchedFields.push(key);
            }
          }
        }
      }

      // Se encontrou correspondência em campos específicos (rua, bairro, quadra), adiciona aos resultados
      if (matchScore > 0 && matchedFields.length > 0) {
        filtered.push({ feature, score: matchScore });
      }
    });

    // Ordena por score (maior primeiro) e retorna apenas os features
    filtered.sort((a, b) => b.score - a.score);
    setResults(filtered.map((item) => item.feature));
  }, [geoJsonData, searchTerm, territoryType]);

  // Busca automática quando o termo muda (com debounce)
  useEffect(() => {
    if (!isOpen || !searchTerm.trim()) {
      setResults([]);
      return;
    }

    // Debounce: aguarda 300ms após o usuário parar de digitar
    const timeoutId = setTimeout(() => {
      searchPolygons();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isOpen, searchPolygons]);

  const extractQuadraNumber = (props: Record<string, any>): string | null => {
    // Tenta extrair número da quadra de várias formas
    // Primeiro, procura em campos específicos de quadra
    for (const [key, value] of Object.entries(props)) {
      if (
        key.toLowerCase().includes("quadra") ||
        key.toLowerCase().includes("cartão") ||
        key.toLowerCase().includes("cartao")
      ) {
        const match = String(value).match(/(\d+)/);
        if (match) return match[1];
      }
    }

    // Tenta extrair do nome (ex: "Polígono 1" -> "1", "Quadra 5" -> "5")
    const nome = String(props.nome || "");
    const nomeMatch = nome.match(/(\d+)/);
    if (nomeMatch) return nomeMatch[1];

    // Tenta extrair do ID (ex: "polygon-1" -> "1", "polygon-123" -> "123")
    const id = String(props.id || "");
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
              Pesquisar por Rua, Bairro ou Quadra:
            </label>
            <div className="search-input-container">
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite o nome da rua, bairro ou número da quadra..."
                className="search-input"
              />
              <button onClick={handleSearch} className="search-submit-button">
                <SearchIcon size={20} />
              </button>
            </div>
            <small className="search-hint">
              A busca é específica e procura nas propriedades de cada polígono
            </small>
          </div>

          {results.length > 0 && (
            <div className="search-results">
              <h3>Resultados ({results.length}):</h3>
              <div className="results-list">
                {results.map((polygon) => {
                  const allProps = loadPolygonProperties(
                    polygon.properties.id,
                    polygon.properties
                  );
                  const quadraNumber = extractQuadraNumber(allProps);
                  
                  // Identifica quais campos foram encontrados
                  const term = searchTerm.toLowerCase().trim();
                  const foundFields: string[] = [];
                  
                  for (const [key, value] of Object.entries(allProps)) {
                    const keyLower = key.toLowerCase();
                    const valueStr = String(value).toLowerCase();
                    
                    // Verifica se é campo de quadra
                    if (
                      (keyLower.includes("quadra") ||
                        keyLower.includes("cartão") ||
                        keyLower.includes("cartao")) &&
                      valueStr.includes(term)
                    ) {
                      foundFields.push(key);
                    }
                    // Verifica se é campo de rua
                    else if (
                      (keyLower.includes("rua") ||
                        keyLower.includes("avenida") ||
                        keyLower.includes("estrada") ||
                        keyLower.includes("logradouro") ||
                        keyLower.includes("endereco") ||
                        keyLower.includes("endereço")) &&
                      valueStr.includes(term)
                    ) {
                      foundFields.push(key);
                    }
                    // Verifica se é campo de bairro
                    else if (
                      keyLower.includes("bairro") &&
                      valueStr.includes(term)
                    ) {
                      foundFields.push(key);
                    }
                  }
                  
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
                      {foundFields.length > 0 && (
                        <div className="result-matched-fields">
                          <small>
                            Encontrado em: {foundFields.join(", ")}
                          </small>
                        </div>
                      )}
                      <div className="result-details">
                        {Object.entries(allProps)
                          .filter(
                            ([key]) => !["id", "nome", "status"].includes(key)
                          )
                          .slice(0, 5)
                          .map(([key, value]) => {
                            const isMatched = foundFields.includes(key);
                            return (
                              <div
                                key={key}
                                className={`result-property ${
                                  isMatched ? "matched" : ""
                                }`}
                              >
                                <span className="property-key">{key}:</span>
                                <span className="property-value">
                                  {String(value)}
                                </span>
                              </div>
                            );
                          })}
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

