const categorias = [
  { nombre: "Hamburguesas", emoji: "🍔" },
  { nombre: "Pizza", emoji: "🍕" },
  { nombre: "Sushi", emoji: "🍣" },
  { nombre: "Postres", emoji: "🍰" },
  { nombre: "Bebidas", emoji: "🍹" },
  { nombre: "Desayunos", emoji: "🍳" },
  { nombre: "Mexicana", emoji: "🌮" },
  { nombre: "Más", emoji: "⋯" },
];

const cupones = [
  {
    nombre: "Pizza Hut",
    descripcion: "30% de descuento en pizzas familiares",
    descuento: "-30%",
    valido: "Válido hasta 31 may 2024",
    img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=250&fit=crop",
  },
  {
    nombre: "McDonald's",
    descripcion: "25% de descuento en compras + $30.000",
    descuento: "-25%",
    valido: "Válido hasta 25 may 2024",
    img: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=250&fit=crop",
  },
  {
    nombre: "Sushi World",
    descripcion: "2x1 en rolls seleccionados",
    descuento: "2x1",
    valido: "Válido hasta 20 may 2024",
    img: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=250&fit=crop",
  },
  {
    nombre: "Juan Valdez Café",
    descripcion: "20% de descuento en bebidas calientes",
    descuento: "-20%",
    valido: "Válido hasta 20 may 2024",
    img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop",
  },
];

export default function App() {
  return (
    <div style={{ backgroundColor: "#f8f7fb", minHeight: "100vh" }}>
      {/* HEADER */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm py-3">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center fw-bold" href="#inicio">
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle me-2"
              style={{ width: 36, height: 36, background: "#ff5a1f", fontSize: 20 }}
            >
              🧡
            </span>
            Sabor y Ahorro
          </a>
          <div className="collapse navbar-collapse justify-content-between">
            <ul className="navbar-nav mx-auto gap-4">
              <li className="nav-item">
                <a className="nav-link fw-semibold" href="#inicio">Inicio</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#cupones">Cupones</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#categorias">Categorías</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#como-funciona">Cómo funciona</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#contacto">Contacto</a>
              </li>
            </ul>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary rounded-pill px-4">
                Iniciar sesión
              </button>
              <button
                className="btn rounded-pill px-4 text-white"
                style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
              >
                Regístrate
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO BANNER */}
      <div className="container mt-4">
        <div
          className="rounded-4 p-5 position-relative overflow-hidden text-white"
          style={{
            background: "linear-gradient(120deg, #7b2ff7 0%, #f2394a 55%, #ff8a1f 100%)",
          }}
        >
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="fw-bold display-5 mb-3">
                Los mejores restaurantes, con los mejores{" "}
                <span style={{ color: "#ffd54a" }}>descuentos</span>
              </h1>
              <p className="mb-4" style={{ opacity: 0.9 }}>
                Descubre cupones exclusivos y ahorra en tus restaurantes favoritos.
              </p>
              <div className="input-group input-group-lg" style={{ maxWidth: 480 }}>
                <span className="input-group-text bg-white border-0">🔍</span>
                <input
                  type="text"
                  className="form-control border-0"
                  placeholder="Buscar restaurantes o comidas..."
                />
                <button
                  className="btn text-white fw-semibold px-4"
                  style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                >
                  Buscar
                </button>
              </div>
            </div>
            <div className="col-lg-6 text-center d-none d-lg-block">
              <img
                src="https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=500&h=400&fit=crop"
                alt="Hamburguesa"
                className="img-fluid rounded-4"
                style={{ maxHeight: 300, objectFit: "cover" }}
              />
            </div>
          </div>

          <div
            className="position-absolute d-flex flex-column align-items-center justify-content-center rounded-circle bg-white text-dark fw-bold"
            style={{ width: 100, height: 100, top: 30, right: 30 }}
          >
            <span className="small">HASTA</span>
            <span className="fs-4 lh-1" style={{ color: "#f2394a" }}>50%</span>
            <span className="small">DE DESCUENTO</span>
          </div>
        </div>
      </div>

      {/* CATEGORIAS */}
      <div className="container mt-5" id="categorias">
        <div className="d-flex justify-content-between flex-wrap gap-3">
          {categorias.map((cat) => (
            <div key={cat.nombre} className="text-center" style={{ width: 90 }}>
              <div
                className="d-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm mx-auto mb-2"
                style={{ width: 60, height: 60, fontSize: 26 }}
              >
                {cat.emoji}
              </div>
              <small className="fw-semibold">{cat.nombre}</small>
            </div>
          ))}
        </div>
      </div>

      {/* CUPONES DESTACADOS */}
      <div className="container mt-5" id="cupones">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold mb-0">Cupones destacados</h4>
          <a href="#todos" className="text-decoration-none fw-semibold" style={{ color: "#7b2ff7" }}>
            Ver todos &gt;
          </a>
        </div>
        <div className="row g-4">
          {cupones.map((cupon) => (
            <div className="col-12 col-md-6 col-lg-3" key={cupon.nombre}>
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="position-relative">
                  <img src={cupon.img} className="card-img-top" style={{ height: 160, objectFit: "cover" }} alt={cupon.nombre} />
                  <span
                    className="position-absolute top-0 end-0 m-2 badge rounded-pill text-white"
                    style={{ background: "#ff5a1f" }}
                  >
                    {cupon.descuento}
                  </span>
                </div>
                <div className="card-body">
                  <h6 className="fw-bold mb-1">{cupon.nombre}</h6>
                  <p className="text-muted small mb-2">{cupon.descripcion}</p>
                  <p className="text-muted small mb-3">🕒 {cupon.valido}</p>
                  <button
                    className="btn w-100 text-white fw-semibold rounded-pill"
                    style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                  >
                    Ver cupón
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BANNER ALIADOS */}
      <div className="container my-5">
        <div
          className="rounded-4 p-4 p-lg-5 text-white d-flex flex-column flex-lg-row align-items-center justify-content-between"
          style={{ background: "linear-gradient(90deg, #7b2ff7, #6a2ff0)" }}
        >
          <div className="mb-3 mb-lg-0">
            <h5 className="fw-bold mb-1">¿Tienes un restaurante?</h5>
            <p className="mb-0" style={{ opacity: 0.9 }}>
              Únete a nuestra red y aumenta tus ventas
            </p>
          </div>
          <button
            className="btn fw-bold rounded-pill px-4 py-2"
            style={{ background: "#ffd54a", color: "#3a2a00" }}
          >
            Quiero ser aliado
          </button>
        </div>

        <div className="row text-center mt-4 g-3">
          <div className="col-6 col-md-3">
            <div className="small fw-semibold">🍴 Fácil y rápido de usar</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small fw-semibold">🏷️ Cupones exclusivos todos los días</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small fw-semibold">💰 Ahorra en tus restaurantes favoritos</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small fw-semibold">🛡️ Seguro y confiable</div>
          </div>
        </div>
      </div>
    </div>
  );
}