import { ReactNode } from "react";
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
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === "map" ? "active" : ""}`}
          onClick={() => onTabChange("map")}
        >
          Mapa
        </button>
        <button
          className={`tab-button ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => onTabChange("logs")}
        >
          Logs
        </button>
      </div>
      {recentQuadras && activeTab === "map" && (
        <div className="tabs-recent-quadras">{recentQuadras}</div>
      )}
      <div className="tabs-content">
        {activeTab === "map" ? mapContent : logsContent}
      </div>
    </div>
  );
}
