import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import bg1 from "../../assets/bg1.jpg";
import "./LoginPage.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const navigate = useNavigate();

  // Limpa erro quando o usuário começa a digitar
  useEffect(() => {
    if (error && (username || password)) {
      setError("");
    }
  }, [username, password, error]);

  const validateField = (field: "username" | "password", value: string) => {
    if (!value.trim()) {
      return `${field === "username" ? "Usuário" : "Senha"} é obrigatório`;
    }
    if (field === "username" && value.trim().length < 3) {
      return "Usuário deve ter pelo menos 3 caracteres";
    }
    if (field === "password" && value.length < 4) {
      return "Senha deve ter pelo menos 4 caracteres";
    }
    return "";
  };

  const handleBlur = (field: "username" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === "username" ? username : password;
    const fieldError = validateField(field, value);
    if (fieldError) {
      setError(fieldError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    setError("");

    // Validação
    const usernameError = validateField("username", username);
    const passwordError = validateField("password", password);

    if (usernameError || passwordError) {
      setError(usernameError || passwordError);
      return;
    }

    setIsLoading(true);

    // Simula delay de autenticação (em produção, seria uma chamada à API)
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // Autenticação simples - em produção, isso seria uma chamada à API
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", username);
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }
      navigate("/mapas");
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  };

  const usernameError = touched.username
    ? validateField("username", username)
    : "";
  const passwordError = touched.password
    ? validateField("password", password)
    : "";
  // Botão desabilitado quando username ou password não estão preenchidos
  const hasUsername = username.trim().length > 0;
  const hasPassword = password.trim().length > 0;
  const isFormValid =
    hasUsername && hasPassword && !usernameError && !passwordError;

  return (
    <div
      className="login-page"
      style={
        {
          "--bg": `url(${bg1})`,
        } as React.CSSProperties
      }
    >
      <div className="login-container">
        <div className="login-header">
          <h1>Login</h1>
          <p>Welcome back! Please login to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className={`form-group ${usernameError ? "has-error" : ""}`}>
            <label htmlFor="username">User Name</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (touched.username) {
                  const err = validateField("username", e.target.value);
                  setError(err || "");
                }
              }}
              onBlur={() => handleBlur("username")}
              placeholder="username@gmail.com"
              autoComplete="username"
              autoFocus
              aria-invalid={!!usernameError}
              aria-describedby={usernameError ? "username-error" : undefined}
            />
            {usernameError && (
              <span id="username-error" className="field-error" role="alert">
                {usernameError}
              </span>
            )}
          </div>

          <div className={`form-group ${passwordError ? "has-error" : ""}`}>
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) {
                    const err = validateField("password", e.target.value);
                    setError(err || "");
                  }
                }}
                onBlur={() => handleBlur("password")}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && (
              <span id="password-error" className="field-error" role="alert">
                {passwordError}
              </span>
            )}
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">Remember Me</span>
            </label>
            <a
              href="#"
              className="forgot-password"
              onClick={(e) => e.preventDefault()}
            >
              Forget Password?
            </a>
          </div>

          <button
            type="submit"
            className={`login-button ${isLoading ? "loading" : ""} ${
              !isFormValid ? "disabled" : ""
            }`}
            disabled={isLoading || !isFormValid}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Logging in...</span>
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="signup-prompt">
            New User?{" "}
            <a
              href="#"
              className="signup-link"
              onClick={(e) => e.preventDefault()}
            >
              Signup
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
