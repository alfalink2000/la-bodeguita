// components/admin/AdminHeader/AdminHeader.jsx - VERSIÓN OPTIMIZADA
import "./AdminHeader.css";

const AdminHeader = ({ children }) => (
  <header className="admin-header">
    <div className="admin-header__container">{children}</div>
  </header>
);

export default AdminHeader;
