import { ReactNode } from "react";
import { FileText, Map } from "lucide-react";
import "./Tabs.css";

interface TabsProps {
  activeTab: "map" | "logs";
  onTabChange: (tab: "map" | "logs") => void;
  mapContent: ReactNode;
  logsContent: ReactNode;
  recentQuadras?: ReactNode;
}

export default function Tabs({
  activeTab,
  onTabChange,
  mapContent,
  logsContent,
  recentQuadras,
}: TabsProps) {
  return (
    <div className="tabs-container">
      {recentQuadras && activeTab === "map" && (
        <div className="tabs-recent-quadras">{recentQuadras}</div>
      )}
      <div className="tabs-content">
        {activeTab === "map" ? mapContent : logsContent}
      </div>
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === "map" ? "active" : ""}`}
          onClick={() => onTabChange("map")}
        >
          <Map size={20} />
          <span>Mapa</span>
        </button>
        <button
          className={`tab-button ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => onTabChange("logs")}
        >
          <FileText size={20} />
          <span>Logs</span>
        </button>
      </div>
    </div>
  );
}
