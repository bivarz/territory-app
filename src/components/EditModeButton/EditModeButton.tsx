import { Settings } from "lucide-react";
import "./EditModeButton.css";

interface EditModeButtonProps {
  isEditMode: boolean;
  onToggle: () => void;
}

export default function EditModeButton({
  isEditMode,
  onToggle,
}: EditModeButtonProps) {
  return (
    <button
      className={`edit-mode-button ${isEditMode ? "active" : ""}`}
      onClick={onToggle}
      title={isEditMode ? "Desativar modo de edição" : "Ativar modo de edição"}
    >
      <Settings size={18} />
    </button>
  );
}

