import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { QuadraLog } from "../../types/logs";
import { GeoJSONData } from "../../types/polygon";
import { formatShortDate } from "../../utils/dateFormatter";
import "./RecentQuadras.css";

interface RecentQuadrasProps {
  quadraLogs: Map<string, QuadraLog>;
  geoJsonData: GeoJSONData | null;
  onFocusQuadra: (quadraId: string) => void;
  onSwitchToMap: () => void;
}

export default function RecentQuadras({
  quadraLogs,
  geoJsonData,
  onFocusQuadra,
  onSwitchToMap,
}: RecentQuadrasProps) {
  const lastQuadra = useMemo(() => {
    const quadras = Array.from(quadraLogs.values())
      .filter((log) => log.inicio !== undefined) // Apenas quadras que foram iniciadas
      .sort((a, b) => {
        // Ordena por data mais recente
        const aDate = a.finalizado?.data || a.inicio?.data;
        const bDate = b.finalizado?.data || b.inicio?.data;

        if (!aDate || !bDate) return 0;
        return bDate.getTime() - aDate.getTime();
      });

    return quadras[0] || null; // Retorna apenas a mais recente
  }, [quadraLogs]);

  const handleQuadraClick = (quadraId: string) => {
    onFocusQuadra(quadraId);
    onSwitchToMap();
  };

  if (!lastQuadra) {
    return null;
  }

  const date = lastQuadra.finalizado?.data || lastQuadra.inicio?.data;
  const dateFormatted = date ? formatShortDate(date) : "";

  return (
    <div className="recent-quadras">
      <h3 className="recent-quadras-title">Última quadra trabalhada:</h3>
      <div className="recent-quadra-item">
        <span className="quadra-label">Q{lastQuadra.quadraNumber}:</span>
        <span className="quadra-date">{dateFormatted}</span>
        <button
          className="quadra-link"
          onClick={() => handleQuadraClick(lastQuadra.quadraId)}
          title="Mostrar no mapa"
        >
          <MapPin size={16} />
          Ver no mapa
        </button>
      </div>
    </div>
  );
}

