// components/admin/AdminDiagnostic/AdminDiagnostic.jsx
import React, { useState, useEffect } from "react";
import {
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineRefresh,
  HiOutlineClipboardCopy,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExclamation,
} from "react-icons/hi";
import "./AdminDiagnostic.css";

const API_URL = import.meta.env.VITE_API_URL || "https://minimarket-backend-6z9m.onrender.com";

const AdminDiagnostic = () => {
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Decodificar token JWT
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
        exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : "N/A",
        iat: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : "N/A",
        isValid: payload.exp ? payload.exp * 1000 > Date.now() : false,
      });
    } catch (error) {
      setTokenInfo({ error: `Error decodificando token: ${error.message}` });
    }
  };

  // Obtener perfil del usuario desde el backend
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

  // Probar endpoint de debug
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

  // Forzar login con admin
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
        alert("✅ Login con admin exitoso! Recargando página...");
        window.location.reload();
      } else {
        alert(`❌ Error: ${data.msg}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Copiar diagnóstico al portapapeles
  const copyDiagnostic = () => {
    const diagnosticText = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        token: tokenInfo,
        user: userInfo,
        debug: diagnosticData,
      },
      null,
      2
    );
    navigator.clipboard.writeText(diagnosticText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cargar datos al montar
  useEffect(() => {
    decodeToken();
    fetchUserProfile();
    runDebugEndpoint();
  }, []);

  const isAdmin = tokenInfo?.role === "admin" || userInfo?.user?.role === "admin";

  return (
    <div className="admin-diagnostic">
      <div className="admin-diagnostic__header">
        <HiOutlineShieldCheck className="admin-diagnostic__icon" />
        <h2>Diagnóstico de Administrador</h2>
        <button className="admin-diagnostic__copy" onClick={copyDiagnostic}>
          {copied ? <HiOutlineCheck /> : <HiOutlineClipboardCopy />}
          {copied ? "Copiado" : "Copiar diagnóstico"}
        </button>
      </div>

      {/* Estado del Admin */}
      <div className={`admin-diagnostic__status ${isAdmin ? "success" : "error"}`}>
        <div className="status-icon">
          {isAdmin ? <HiOutlineCheck size={24} /> : <HiOutlineX size={24} />}
        </div>
        <div className="status-info">
          <h3>{isAdmin ? "✅ Usuario Administrador" : "❌ NO es Administrador"}</h3>
          <p>
            {isAdmin
              ? "Tienes permisos para gestionar usuarios"
              : "No tienes permisos para eliminar usuarios. Debes iniciar sesión con una cuenta de administrador."}
          </p>
        </div>
      </div>

      {/* Token Info */}
      <div className="admin-diagnostic__section">
        <h3>
          <HiOutlineUser /> Token JWT
        </h3>
        {tokenInfo?.error ? (
          <div className="error-message">{tokenInfo.error}</div>
        ) : (
          <div className="info-grid">
            <div className="info-row">
              <span className="label">UID:</span>
              <span className="value">{tokenInfo?.uid || "N/A"}</span>
            </div>
            <div className="info-row">
              <span className="label">Rol en token:</span>
              <span className={`value ${tokenInfo?.role === "admin" ? "admin" : "not-admin"}`}>
                {tokenInfo?.role || "NO DEFINIDO"}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Token válido:</span>
              <span className={`value ${tokenInfo?.isValid ? "valid" : "invalid"}`}>
                {tokenInfo?.isValid ? "Sí" : "No (expirado)"}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Expira:</span>
              <span className="value">{tokenInfo?.exp || "N/A"}</span>
            </div>
            <div className="info-row full-width">
              <span className="label">Payload completo:</span>
              <pre className="json-preview">{JSON.stringify(tokenInfo?.raw, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Perfil desde backend */}
      <div className="admin-diagnostic__section">
        <h3>
          <HiOutlineUser /> Perfil (API /profile)
        </h3>
        {loading && <div className="loading">Cargando...</div>}
        {userInfo?.error ? (
          <div className="error-message">{userInfo.error}</div>
        ) : (
          <div className="info-grid">
            <div className="info-row">
              <span className="label">Username:</span>
              <span className="value">{userInfo?.user?.username || "N/A"}</span>
            </div>
            <div className="info-row">
              <span className="label">Rol en BD:</span>
              <span className={`value ${userInfo?.user?.role === "admin" ? "admin" : "not-admin"}`}>
                {userInfo?.user?.role || "NO DEFINIDO"}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Activo:</span>
              <span className={`value ${userInfo?.user?.is_active ? "valid" : "invalid"}`}>
                {userInfo?.user?.is_active ? "Sí" : "No"}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{userInfo?.user?.email || "N/A"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Debug endpoint */}
      <div className="admin-diagnostic__section">
        <h3>🔧 Debug (/debug/me)</h3>
        {diagnosticData?.error ? (
          <div className="error-message">
            {diagnosticData.error}
            <p className="hint">
              El endpoint /debug/me no existe. Agrégalo temporalmente en routes/auth.js
            </p>
          </div>
        ) : (
          <pre className="json-preview">{JSON.stringify(diagnosticData, null, 2)}</pre>
        )}
      </div>

      {/* Acciones */}
      <div className="admin-diagnostic__actions">
        <button className="btn-refresh" onClick={() => window.location.reload()}>
          <HiOutlineRefresh /> Recargar página
        </button>
        <button className="btn-force-login" onClick={forceAdminLogin} disabled={loading}>
          {loading ? "Cargando..." : "🔐 Forzar login como Admin"}
        </button>
      </div>

      {/* Soluciones */}
      <div className="admin-diagnostic__solutions">
        <h3>💡 Posibles soluciones</h3>
        <ul>
          <li>
            <strong>Si el rol en token es "NO DEFINIDO":</strong> El backend no está incluyendo el rol al generar el JWT.
            Revisa el archivo <code>helpers/jwt.js</code> - debe incluir <code>role</code> en el payload.
          </li>
          <li>
            <strong>Si el rol en token es "customer" o "cliente":</strong> No estás logueado como admin.
            Usa el botón "Forzar login como Admin" arriba.
          </li>
          <li>
            <strong>Si el token está expirado:</strong> Haz logout y vuelve a iniciar sesión.
          </li>
          <li>
            <strong>Si el usuario no existe en BD o no es admin:</strong> Ejecuta este SQL:
            <pre className="sql-code">
{`UPDATE users SET role = 'admin' WHERE username = 'admin';
-- Si no existe:
INSERT INTO users (username, password_hash, email, full_name, role, is_active) 
VALUES ('admin', crypt('admin123', gen_salt('bf')), 'admin@farmaexpress.com', 'Administrador', 'admin', true);`}
            </pre>
          </li>
          <li>
            <strong>Si todo falla:</strong> Verifica que el middleware <code>validarJWT</code> extraiga el rol correctamente:
            <pre className="code">
{`const { uid, role } = jwt.verify(token, process.env.JWT_SECRET);
req.uid = uid;
req.role = role; // 👈 Esto es CRÍTICO`}
            </pre>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminDiagnostic;