import { useState } from "react";
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  User,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../hooks/useLanguage";

function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // 1. SIGN UP
      if (mode === "signup") {
        if (!name || !email || !password) {
          setError(t("login.errors.fillAllFields"));
          setLoading(false);
          return;
        }

        const signupResponse = await fetch("http://127.0.0.1:8001/api/v1/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    full_name: name, // Ensure this matches your backend model key
    email: email, 
    password: password 
  }),
});

        const signupData = await signupResponse.json();

        if (!signupResponse.ok) {
          throw new Error(signupData.detail || t("login.errors.emailExists"));
        }

        setSuccess(t("login.success.accountCreated"));
        setMode("login");
        setName("");
        setPassword("");
        setLoading(false);
        return;
      }

      // 2. LOGIN
      const loginResponse = await fetch("http://127.0.0.1:8001/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginData.detail || t("login.errors.incorrectCredentials"));
      }

      // Extract access_token from response
      const token = loginData.access_token || loginData.token;

      if (!token) {
        throw new Error("No token returned from server");
      }

      // Save token directly into localStorage for backend headers
      localStorage.setItem("token", token);
      localStorage.setItem(
        "koaSession",
        JSON.stringify({
          loggedIn: true,
          token: token,
          name: loginData.user?.full_name || email.split("@")[0],
          email: email,
        })
      );

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* LEFT SIDE */}
      <div style={styles.hero}>
        <div style={styles.brand}>
          <div style={styles.logo}>
            <Activity size={28} />
          </div>
          <span>KOA Assist</span>
        </div>

        <div style={styles.heroContent}>
          <div style={styles.badge}>{t("login.hero.badge")}</div>
          <h1 style={styles.heroTitle}>
            {t("login.hero.titleLine1")}
            <br />
            {t("login.hero.titleLine2")}
          </h1>
          <p style={styles.heroText}>{t("login.hero.description")}</p>
        </div>

        <div style={styles.heroFooter}>{t("login.hero.footer")}</div>
      </div>

      {/* RIGHT SIDE */}
      <div style={styles.loginSection}>
        <div style={styles.loginCard}>
          {/* LANGUAGE SELECTOR */}
          <div style={styles.languageContainer}>
            <LanguageSelector />
          </div>

          <div style={styles.heading}>
            <div style={styles.formIcon}>
              {mode === "login" ? <Lock size={23} /> : <UserPlus size={23} />}
            </div>

            <h2 style={styles.title}>
              {mode === "login"
                ? t("login.title.signIn")
                : t("login.title.createAccount")}
            </h2>

            <p style={styles.subtitle}>
              {mode === "login"
                ? t("login.subtitle.signIn")
                : t("login.subtitle.createAccount")}
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* NAME — SIGN UP ONLY */}
            {mode === "signup" && (
              <>
                <label style={styles.label}>
                  {t("login.fields.fullName")}
                </label>
                <div style={styles.inputWrapper}>
                  <User size={19} style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder={t("login.placeholders.fullName")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </>
            )}

            {/* EMAIL */}
            <label style={styles.label}>{t("login.fields.email")}</label>
            <div style={styles.inputWrapper}>
              <Mail size={19} style={styles.inputIcon} />
              <input
                type="email"
                placeholder={t("login.placeholders.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            {/* PASSWORD */}
            <label style={styles.label}>{t("login.fields.password")}</label>
            <div style={styles.inputWrapper}>
              <Lock size={19} style={styles.inputIcon} />
              <input
                type="password"
                placeholder={t("login.placeholders.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading
                ? "Processing..."
                : mode === "login"
                ? t("login.buttons.signIn")
                : t("login.buttons.createAccount")}
              <ArrowRight size={19} />
            </button>
          </form>

          {/* SWITCH LOGIN / SIGNUP */}
          <div style={styles.switchContainer}>
            <span style={styles.switchText}>
              {mode === "login"
                ? t("login.switch.noAccount")
                : t("login.switch.haveAccount")}
            </span>

            <button
              type="button"
              style={styles.switchButton}
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setSuccess("");
              }}
            >
              {mode === "login"
                ? t("login.switch.createAccount")
                : t("login.switch.signIn")}
            </button>
          </div>

          <p style={styles.demoText}>{t("login.footer")}</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f8fafc",
  },
  hero: {
    width: "52%",
    minHeight: "100vh",
    padding: "42px 60px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background:
      "linear-gradient(145deg, #0f3b82 0%, #2563eb 55%, #38bdf8 100%)",
    color: "white",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "22px",
    fontWeight: "700",
  },
  logo: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.16)",
  },
  heroContent: {
    maxWidth: "560px",
  },
  badge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.14)",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1px",
    marginBottom: "22px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "52px",
    lineHeight: "1.12",
    fontWeight: "600",
    fontFamily: "Lora, serif",
  },
  heroText: {
    marginTop: "25px",
    maxWidth: "510px",
    fontSize: "16px",
    lineHeight: "1.8",
    color: "rgba(255,255,255,0.85)",
  },
  heroFooter: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.65)",
  },
  loginSection: {
    width: "48%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  loginCard: {
    width: "100%",
    maxWidth: "440px",
  },
  languageContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "30px",
  },
  heading: {
    marginBottom: "25px",
  },
  formIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "600",
    fontFamily: "Lora, serif",
  },
  subtitle: {
    marginTop: "10px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    marginTop: "20px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    color: "#94a3b8",
  },
  input: {
    width: "100%",
    height: "50px",
    border: "1px solid #dbe3ef",
    borderRadius: "10px",
    outline: "none",
    padding: "0 15px 0 45px",
    fontSize: "14px",
    color: "#0f172a",
    background: "white",
  },
  button: {
    width: "100%",
    height: "52px",
    marginTop: "28px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    fontWeight: "600",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 8px 20px rgba(37,99,235,0.2)",
    cursor: "pointer",
  },
  switchContainer: {
    marginTop: "25px",
    display: "flex",
    justifyContent: "center",
    gap: "6px",
    fontSize: "13px",
  },
  switchText: {
    color: "#64748b",
  },
  switchButton: {
    border: "none",
    background: "none",
    color: "#2563eb",
    fontWeight: "600",
    cursor: "pointer",
    padding: 0,
  },
  error: {
    padding: "11px 14px",
    marginBottom: "15px",
    borderRadius: "8px",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: "13px",
  },
  success: {
    padding: "11px 14px",
    marginBottom: "15px",
    borderRadius: "8px",
    background: "#f0fdf4",
    color: "#16a34a",
    fontSize: "13px",
  },
  demoText: {
    textAlign: "center",
    marginTop: "22px",
    color: "#94a3b8",
    fontSize: "11px",
  },
};

export default Login;