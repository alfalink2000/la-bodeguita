import React, { useState, useEffect } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const AdminDiagnostic = () => {
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const decodeToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setTokenInfo({ error: "No hay token en localStorage" });
      return;
    }
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        setTokenInfo({ error: "Token inválido - formato incorrecto" });
        return;
      }
      const payload = JSON.parse(atob(parts[1]));
      setTokenInfo({
        raw: payload,
        uid: payload.uid,
        role: payload.role,
        exp: payload.exp
          ? new Date(payload.exp * 1000).toLocaleString()
          : "N/A",
        iat: payload.iat
          ? new Date(payload.iat * 1000).toLocaleString()
          : "N/A",
        isValid: payload.exp ? payload.exp * 1000 > Date.now() : false,
      });
    } catch (error) {
      setTokenInfo({ error: `Error decodificando token: ${error.message}` });
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { "x-token": token },
      });
      const data = await res.json();
      setUserInfo(data);
    } catch (error) {
      setUserInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const runDebugEndpoint = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/debug/me`, {
        headers: { "x-token": token },
      });
      const data = await res.json();
      setDiagnosticData(data);
    } catch (error) {
      setDiagnosticData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const forceAdminLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password_hash: "admin123" }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("token", data.token);
        alert("[OK] Login con admin exitoso! Recargando página...");
        window.location.reload();
      } else {
        alert(`[ERROR] ${data.msg}`);
      }
    } catch (error) {
      alert(`[ERROR] ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyDiagnostic = () => {
    const diagnosticText = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        token: tokenInfo,
        user: userInfo,
        debug: diagnosticData,
      },
      null,
      2,
    );
    navigator.clipboard.writeText(diagnosticText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    decodeToken();
    fetchUserProfile();
    runDebugEndpoint();
  }, []);

  const isAdmin =
    tokenInfo?.role === "admin" || userInfo?.user?.role === "admin";

  return (
    <div className="admin-diagnostic">
      <div className="admin-diagnostic__header">
        <div className="admin-diagnostic__header-left">
          <span className="admin-diagnostic__icon material-symbols-outlined">verified</span>
          <h2 className="admin-diagnostic__title">Diagnóstico de Administrador</h2>
        </div>
        <button
          className="admin-btn admin-btn--secondary admin-btn--sm"
          onClick={copyDiagnostic}
        >
          <span className="admin-btn__icon admin-btn__icon--sm material-symbols-outlined">{copied ? "check" : "content_copy"}</span>
          {copied ? "Copiado" : "Copiar diagnóstico"}
        </button>
      </div>

      <div className={`admin-diagnostic__status ${isAdmin ? "admin-diagnostic__status--success" : "admin-diagnostic__status--error"}`}>
        <div className="admin-diagnostic__status-icon">
          <span className="material-symbols-outlined">{isAdmin ? "check" : "close"}</span>
        </div>
        <div>
          <h3 className="admin-diagnostic__status-title">
            {isAdmin ? "Usuario Administrador" : "NO es Administrador"}
          </h3>
          <p className="admin-diagnostic__status-text">
            {isAdmin
              ? "Tienes permisos para gestionar usuarios"
              : "No tienes permisos para eliminar usuarios. Debes iniciar sesión con una cuenta de administrador."}
          </p>
        </div>
      </div>

      <div className="admin-diagnostic__section">
        <h3 className="admin-diagnostic__section-title">
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--color-on-surface-variant)" }}>person</span>
          Token JWT
        </h3>
        {tokenInfo?.error ? (
          <div className="admin-diagnostic__code" style={{ color: "var(--color-error)" }}>{tokenInfo.error}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div className="admin-diagnostic__row">
              <span className="admin-diagnostic__row-label">UID:</span>
              <span className="admin-diagnostic__row-value">{tokenInfo?.uid || "N/A"}</span>
            </div>
            <div className="admin-diagnostic__row">
              <span className="admin-diagnostic__row-label">Rol en token:</span>
              <span className={`admin-diagnostic__row-value ${tokenInfo?.role === "admin" ? "admin-diagnostic__row-value--success" : "admin-diagnostic__row-value--error"}`}>
                {tokenInfo?.role || "NO DEFINIDO"}
              </span>
            </div>
            <div className="admin-diagnostic__row">
              <span className="admin-diagnostic__row-label">Token válido:</span>
              <span className={`admin-diagnostic__row-value ${tokenInfo?.isValid ? "admin-diagnostic__row-value--success" : "admin-diagnostic__row-value--error"}`}>
                {tokenInfo?.isValid ? "Sí" : "No (expirado)"}
              </span>
            </div>
            <div className="admin-diagnostic__row">
              <span className="admin-diagnostic__row-label">Expira:</span>
              <span className="admin-diagnostic__row-value">{tokenInfo?.exp || "N/A"}</span>
            </div>
            <div style={{ paddingTop: "4px" }}>
              <span className="admin-diagnostic__row-label" style={{ display: "block", marginBottom: "8px" }}>Payload completo:</span>
              <pre className="admin-diagnostic__code">
                {JSON.stringify(tokenInfo?.raw, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="admin-diagnostic__section">
        <h3 className="admin-diagnostic__section-title">
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--color-on-surface-variant)" }}>person</span>
          Perfil (API /profile)
        </h3>
        {loading && <div className="admin-loading"><div className="admin-spinner admin-spinner--sm" /></div>}
        {userInfo?.error ? (
          <div className="admin-diagnostic__code" style={{ color: "var(--color-error)" }}>{userInfo.error}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div className="admin-diagnostic__row">
              <span className="admin-diagnostic__row-label">Username:</span>
              <span className="admin-diagnostic__row-value">{userInfo?.user?.username || "N/A"}</span>
            </div>
            <div className="admin-diagnostic__row">
              <span className="admin-diagnostic__row-label">Rol en BD:</span>
              <span className={`admin-diagnostic__row-value ${userInfo?.user?.role === "admin" ? "admin-diagnostic__row-value--success" : "admin-diagnostic__row-value--error"}`}>
                {userInfo?.user?.role || "NO DEFINIDO"}
              </span>
            </div>
            <div className="admin-diagnostic__row">
              <span className="admin-diagnostic__row-label">Activo:</span>
              <span className={`admin-diagnostic__row-value ${userInfo?.user?.is_active ? "admin-diagnostic__row-value--success" : "admin-diagnostic__row-value--error"}`}>
                {userInfo?.user?.is_active ? "Sí" : "No"}
              </span>
            </div>
            <div className="admin-diagnostic__row">
              <span className="admin-diagnostic__row-label">Email:</span>
              <span className="admin-diagnostic__row-value">{userInfo?.user?.email || "N/A"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="admin-diagnostic__section">
        <h3 className="admin-diagnostic__section-title">
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--color-on-surface-variant)" }}>build</span>
          Debug (/debug/me)
        </h3>
        {diagnosticData?.error ? (
          <div>
            <div className="admin-diagnostic__code" style={{ color: "var(--color-error)" }}>
              {diagnosticData.error}
            </div>
            <p className="admin-diagnostic__row-label" style={{ marginTop: "8px" }}>
              El endpoint /debug/me no existe. Agrégalo temporalmente en routes/auth.js
            </p>
          </div>
        ) : (
          <pre className="admin-diagnostic__code">
            {JSON.stringify(diagnosticData, null, 2)}
          </pre>
        )}
      </div>

      <div className="admin-diagnostic__actions">
        <button
          className="admin-btn admin-btn--primary"
          onClick={() => window.location.reload()}
        >
          <span className="admin-btn__icon material-symbols-outlined">refresh</span>
          Recargar página
        </button>
        <button
          className="admin-btn admin-btn--secondary"
          onClick={forceAdminLogin}
          disabled={loading}
        >
          {loading ? "Cargando..." : "Forzar login como Admin"}
        </button>
      </div>

      <div className="admin-diagnostic__section">
        <h3 className="admin-diagnostic__section-title">
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--color-on-surface-variant)" }}>lightbulb</span>
          Posibles soluciones
        </h3>
        <ul style={{ display: "flex", flexDirection: "column", gap: "16px", margin: 0, padding: 0, listStyle: "none" }}>
          <li style={{ fontFamily: "var(--font-body-md)", fontSize: "var(--text-body-md)", color: "var(--color-on-surface-variant)" }}>
            <strong>Si el rol en token es &quot;NO DEFINIDO&quot;:</strong> El backend no
            está incluyendo el rol al generar el JWT. Revisa el archivo{" "}
            <code className="admin-diagnostic__code" style={{ display: "inline", padding: "2px 6px" }}>helpers/jwt.js</code> - debe incluir <code className="admin-diagnostic__code" style={{ display: "inline", padding: "2px 6px" }}>role</code> en el
            payload.
          </li>
          <li style={{ fontFamily: "var(--font-body-md)", fontSize: "var(--text-body-md)", color: "var(--color-on-surface-variant)" }}>
            <strong>Si el rol en token es &quot;customer&quot; o &quot;cliente&quot;:</strong> No
            estás logueado como admin. Usa el botón &quot;Forzar login como Admin&quot;
            arriba.
          </li>
          <li style={{ fontFamily: "var(--font-body-md)", fontSize: "var(--text-body-md)", color: "var(--color-on-surface-variant)" }}>
            <strong>Si el token está expirado:</strong> Haz logout y vuelve a
            iniciar sesión.
          </li>
          <li style={{ fontFamily: "var(--font-body-md)", fontSize: "var(--text-body-md)", color: "var(--color-on-surface-variant)" }}>
            <strong>Si el usuario no existe en BD o no es admin:</strong>{" "}
            Ejecuta este SQL:
            <pre className="admin-diagnostic__code" style={{ marginTop: "8px" }}>{`UPDATE users SET role = 'admin' WHERE username = 'admin';
INSERT INTO users (username, password_hash, email, full_name, role, is_active) VALUES ('admin', crypt('admin123', gen_salt('bf')), 'admin@farmaexpress.com', 'Administrador', 'admin', true);`}</pre>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminDiagnostic;
