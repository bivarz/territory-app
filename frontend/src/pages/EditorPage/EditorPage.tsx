import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Trash2, Save, Map, LogOut } from "lucide-react";
import "./EditorPage.css";

export default function EditorPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="editor-page">
      <div className="page-header">
        <h1>Editor de Quadras</h1>
        <div className="header-actions">
          <button
            className="nav-button"
            onClick={() => navigate("/mapas")}
            title="Voltar para Mapas"
          >
            <Map size={16} />
            <span>Mapas</span>
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-sidebar">
          <div className="sidebar-section">
            <h3>Ferramentas</h3>
            <div className="tool-buttons">
              <button className="tool-button">
                <Plus size={20} />
                <span>Criar Quadra</span>
              </button>
              <button className="tool-button">
                <MapPin size={20} />
                <span>Desenhar Polígono</span>
              </button>
              <button className="tool-button">
                <Save size={20} />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Agrupamentos</h3>
            <div className="group-list">
              <p className="empty-state">
                Nenhum agrupamento criado ainda
              </p>
            </div>
          </div>
        </div>

        <div className="editor-main">
          <div className="editor-placeholder">
            <MapPin size={64} />
            <h2>Editor de Quadras</h2>
            <p>
              Esta página será usada para criar, desenhar e definir quadras e
              agrupamentos de quadras.
            </p>
            <p className="placeholder-hint">
              Funcionalidade em desenvolvimento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

