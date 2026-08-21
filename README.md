# 🎟️ Cupon — Marketplace de Promociones para Restaurantes

Plataforma web donde los **restaurantes** publican promociones y cupones de descuento, los **clientes** las descubren, filtran y guardan como favoritas, y los **administradores** gestionan la aprobación de restaurantes y moderan el contenido.

---

## 🛠️ Tech Stack

| Capa | Tecnología |
|------|-----------|
| **Backend** | Java 21 (LTS) · Spring Boot 4.1 · Spring Security · Spring Data JPA · Spring Data Redis |
| **Base de Datos** | PostgreSQL 16 · Flyway (migraciones) |
| **Cache** | Redis 7 (Spring Cache + RedisTemplate) |
| **Autenticación** | JWT (jjwt 0.12.x) · BCrypt |
| **Mapeo DTO** | MapStruct 1.6 + Lombok |
| **Documentación API** | SpringDoc OpenAPI (Swagger UI) |
| **Frontend** | React 19 · TypeScript · Vite · React Router · Axios · TanStack Query |
| **Infraestructura** | Docker · Docker Compose |

---

## 📐 Arquitectura

```
backend/src/main/java/com/cupon/
├── config/                          # SecurityConfig, RedisConfig, OpenApiConfig, JwtFilter
├── common/                          # BaseEntity, ApiResponse, PageResponse, excepciones
└── modules/
    ├── user/          → Entidades: User, Role, ClientProfile, RestaurantProfile
    ├── auth/          → Login, registro (cliente/restaurante), JWT
    ├── restaurant/    → Catálogo público, gestión perfil restaurante
    ├── promotion/     → CRUD promociones, favoritos, búsqueda (con cache Redis)
    └── admin/         → Aprobación restaurantes, moderación, métricas
```

**Patrón por módulo:** Cada módulo tiene sus propias capas `controller/`, `service/`, `repository/`, `dto/`, `entity/`, `mapper/`.

---

## 📋 Requisitos Previos

- **Java 21** (JDK)
- **Docker** y **Docker Compose**
- **Node.js 20+** y **npm** (para desarrollo frontend)

---

## 🚀 Levantar el Proyecto

### Con Docker Compose (recomendado)

```bash
# Clonar el repositorio
git clone <tu-repo-url> && cd cupon

# Copiar variables de entorno
cp .env.example .env

# Levantar todos los servicios
docker compose up -d
```

| Servicio | URL |
|----------|-----|
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Frontend | http://localhost:3000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Desarrollo Local (sin Docker)

```bash
# 1. Levantar solo la infraestructura
docker compose up -d db redis

# 2. Backend
cd backend
./gradlew bootRun

# 3. Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

---

## 🔐 Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_NAME` | `cupon_db` | Nombre de la base de datos |
| `DB_USER` | `cupon` | Usuario de la base de datos |
| `DB_PASSWORD` | `cupon123` | Contraseña de la base de datos |
| `REDIS_HOST` | `localhost` | Host de Redis |
| `REDIS_PORT` | `6379` | Puerto de Redis |
| `JWT_SECRET` | (dev key) | Secreto para firmar JWT (Base64, mín. 256 bits) |
| `JWT_EXPIRATION` | `86400000` | Duración del token en ms (24h) |

---

## 📡 API Endpoints

### Autenticación (`/api/v1/auth`)
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/register/client` | Registrar cliente | Público |
| POST | `/register/restaurant` | Registrar restaurante | Público |
| POST | `/login` | Iniciar sesión | Público |

### Restaurantes (`/api/v1/restaurants`)
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar restaurantes aprobados | Público |
| GET | `/{id}` | Detalle de restaurante | Público |
| PUT | `/me` | Actualizar mi perfil | RESTAURANTE |

### Promociones (`/api/v1/promotions`)
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/` | Listar activas (con búsqueda) | Público |
| GET | `/{id}` | Detalle | Público |
| POST | `/` | Crear promoción | RESTAURANTE |
| PUT | `/{id}` | Actualizar promoción | RESTAURANTE |
| DELETE | `/{id}` | Eliminar promoción | RESTAURANTE |
| POST | `/{id}/favorite` | Toggle favorito | CLIENTE |
| GET | `/favorites` | Mis favoritos | CLIENTE |
| GET | `/mine` | Mis promociones | RESTAURANTE |

### Administración (`/api/v1/admin`)
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/restaurants/pending` | Restaurantes pendientes | ADMIN |
| PUT | `/restaurants/{id}/approve` | Aprobar/rechazar restaurante | ADMIN |
| PUT | `/users/{id}/suspend` | Suspender/reactivar usuario | ADMIN |
| DELETE | `/promotions/{id}` | Moderar promoción | ADMIN |
| GET | `/metrics` | Métricas del sistema | ADMIN |

---

## 🗂️ Estructura del Proyecto

```
cupon/
├── README.md
├── .env.example
├── docker-compose.yml
├── backend/
│   ├── build.gradle.kts
│   ├── Dockerfile
│   └── src/main/java/com/cupon/
│       ├── config/
│       ├── common/
│       └── modules/ (user, auth, restaurant, promotion, admin)
└── frontend/
    ├── package.json
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── api/
        ├── types/
        ├── routes/
        ├── features/ (auth, client, restaurant, admin)
        └── components/
```

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature: `git checkout -b feature/mi-feature`
3. Commit tus cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/mi-feature`
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.
