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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <span>Mapa</span>
        </button>
        <button
          className={`tab-button ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => onTabChange("logs")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>Logs</span>
        </button>
      </div>
    </div>
  );
}
