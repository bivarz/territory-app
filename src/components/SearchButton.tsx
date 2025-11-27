import { Search } from "lucide-react";
import "./SearchButton.css";

interface SearchButtonProps {
  onClick: () => void;
}

export default function SearchButton({ onClick }: SearchButtonProps) {
  return (
    <button
      className="search-button"
      onClick={onClick}
      title="Pesquisar localização"
    >
      <Search size={18} />
    </button>
  );
}
