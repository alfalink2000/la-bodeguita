import "./RoleSelector.css";

const RoleSelector = ({ userData, onSelectClient, onSelectAdmin }) => {
  const userName = userData?.full_name || userData?.name || "Admin";

  return (
    <div className="role-selector" role="main">
      {/* Fondos decorativos */}
      <div className="role-selector__bg-pattern" aria-hidden="true" />
      <div
        className="role-selector__bg-blob role-selector__bg-blob--top"
        aria-hidden="true"
      />
      <div
        className="role-selector__bg-blob role-selector__bg-blob--bottom"
        aria-hidden="true"
      />

      {/* Contenido principal */}
      <main className="role-selector__content">
        {/* Header */}
        <header className="role-selector__header">
          <h1 className="role-selector__app-name">La Bodeguita</h1>
          <p className="role-selector__greeting">
            ¡Hola, {userName}! Selecciona a dónde deseas acceder
          </p>
          <span className="role-selector__badge">
            <span className="role-selector__badge-dot" aria-hidden="true" />
            Administrador
          </span>
        </header>

        {/* Tarjetas de selección */}
        <div className="role-selector__cards">
          {/* Tarjeta: Vista Cliente */}
          <button
            onClick={onSelectClient}
            className="role-selector__card"
            type="button"
          >
            {/* Imagen */}
            <div className="role-selector__card-image">
              <img
                className="role-selector__card-img"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsa3Rt3hmsKreMoIbhyyoO_zjv6Etb1FOHEpfIqBJSrpdnCeI7b7oKNV5dJZ_1mNJCDtGaaRCfDSxlEZw1nkWvfyqAI4JIhdaEei3MD8PIGlBuDe-KRd2VN430Jo-Wuh_pcwOkyGfglnNK6iM6D8bLNswMI49mUKFiuSDl4l4E_Xi_762JsRiy9AP7xz3gL3zkvi3j_pgarsfYdqRIkACtLfR6DUg9U06JFf4Ingx8mwn4i2ebjFWZ"
                alt="Vista Cliente"
                loading="lazy"
              />
              <div
                className="role-selector__card-image-overlay"
                aria-hidden="true"
              />
              <div className="role-selector__card-image-icon">
                <span className="material-symbols-outlined">storefront</span>
              </div>
            </div>

            {/* Contenido */}
            <div className="role-selector__card-body">
              <div className="role-selector__card-text">
                <h2 className="role-selector__card-title">Vista Cliente</h2>
                <p className="role-selector__card-description">
                  Ver el catálogo como lo ven tus clientes. Explora productos,
                  gestiona el carrito y compra.
                </p>
              </div>

              <div className="role-selector__card-action">
                <span>Entrar a la Tienda</span>
                <span className="role-selector__card-arrow material-symbols-outlined">
                  arrow_forward
                </span>
              </div>
            </div>
          </button>

          {/* Tarjeta: Panel Admin */}
          <button
            onClick={onSelectAdmin}
            className="role-selector__card"
            type="button"
          >
            {/* Imagen */}
            <div className="role-selector__card-image">
              <img
                className="role-selector__card-img"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAexrUf1oeEOq-qwGpxI8NmK4BCTfcnwoGzu5KJkVwaBnyyo9jidqOhpBvwbV56AMGVo_vZZxvyGaoQuqDftOfqSqjPtR58ELG56CJjZhvNLEns9b2ki5RIeVDSHwA1VX3i0mWGQzHJ-A1T_CndHRGEKYk1BwznENZ8y_GkY1AxnvgDxeyeU_VLx2xKNPFz-CKV4Qk1GKAOJdsE-IbywDju5fU7UYM2XiF92vgB-NGfV-3Q2LIr8vaj"
                alt="Panel de Administración"
                loading="lazy"
              />
              <div
                className="role-selector__card-image-overlay"
                aria-hidden="true"
              />
              <div className="role-selector__card-image-icon">
                <span className="material-symbols-outlined">dashboard</span>
              </div>
            </div>

            {/* Contenido */}
            <div className="role-selector__card-body">
              <div className="role-selector__card-text">
                <h2 className="role-selector__card-title">
                  Panel de Administración
                </h2>
                <p className="role-selector__card-description">
                  Gestionar productos, inventario, pedidos, chats y
                  configuración de la tienda.
                </p>
              </div>

              <div className="role-selector__card-action">
                <span>Abrir Panel</span>
                <span className="role-selector__card-arrow material-symbols-outlined">
                  arrow_forward
                </span>
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default RoleSelector;
