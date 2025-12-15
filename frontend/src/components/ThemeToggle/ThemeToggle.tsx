import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // Verifica se há um tema salvo no localStorage
    const savedTheme = localStorage.getItem("theme");
    // Valida se o tema salvo é válido
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    // Retorna o tema padrão caso não haja tema salvo ou seja inválido
    return "light";
  });

  useEffect(() => {
    // Aplica o tema ao documento
    document.documentElement.setAttribute("data-theme", theme);
    // Salva o tema no localStorage para persistir a escolha do usuário
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Alternar para tema ${theme === "light" ? "escuro" : "claro"}`}
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

