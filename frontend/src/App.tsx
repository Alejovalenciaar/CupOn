import { useEffect, useState } from "react";
import RestaurantDashboard from "./features/restaurant/RestaurantDashboard";
import AdminDashboard from "./features/admin/AdminDashboard";
import { getRestaurants, updateMyRestaurant, getMyRestaurant } from "./api/restaurantServices";
import { getMyProfile, updateMyProfile } from "./api/userServices";
import { getPromotions, getMyPromotions, createPromotion, updatePromotion, deletePromotion, updatePromotionStatus } from "./api/promotionServices";
import { registerClient, registerRestaurant, login, forgotPassword, resetPassword } from "./api/authServices";
import {
  Restaurant,
  Promotion,
  RegisterClientRequest,
  RegisterRestaurantRequest,
  LoginRequest,
  UserProfileResponse,
  UpdateUserRequest,
  UpdateRestaurantRequest,
  CreatePromotionRequest,
} from "./types";

const categories = [
  { name: "Hamburguesas", emoji: "🍔", query: "Burger" },
  { name: "Pizza", emoji: "🍕", query: "Pizza" },
  { name: "Sushi", emoji: "🍣", query: "Sushi" },
  { name: "Tacos", emoji: "🌮", query: "Taco" },
  { name: "Postres", emoji: "🍰", query: "Postre" },
  { name: "Bebidas", emoji: "🍹", query: "Bebida" },
  { name: "Desayunos", emoji: "🍳", query: "Desayuno" },
  { name: "Todos", emoji: "🍽️", query: "" },
];

export default function App() {
  // Estados para restaurantes
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState<boolean>(true);
  const [errorRestaurants, setErrorRestaurants] = useState<string | null>(null);

  // Estados para promociones / cupones
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState<boolean>(true);
  const [errorPromotions, setErrorPromotions] = useState<string | null>(null);

  // Estados para el buscador interactivo de cupones
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeSearch, setActiveSearch] = useState<string>("");

  // Estado para el buscador de Restaurantes Aliados (HU 14)
  const [restaurantSearch, setRestaurantSearch] = useState<string>("");

  // Estado para la vista de Favoritos (HU 15)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Estados para el Modal de detalle de cupón y compartir (HU 2.5)
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [sharedToast, setSharedToast] = useState<boolean>(false);

  // Estado para favoritos (HU 2.4)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("cupon_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Estado de usuario autenticado
  // Modo de visualización para dueños de restaurante (Épica 3, 4 y 5)
  const [viewMode, setViewMode] = useState<"customer" | "restaurant" | "admin">("customer");

  const [currentUser, setCurrentUser] = useState<{ email: string; role: string } | null>(() => {
    try {
      const saved = localStorage.getItem("cupon_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });





  // Estados para Gestión de Promociones (Épica 4)
  const [restaurantModalTab, setRestaurantModalTab] = useState<"profile" | "promotions">("profile");
  const [myPromotions, setMyPromotions] = useState<Promotion[]>([]);
  const [loadingMyPromotions, setLoadingMyPromotions] = useState<boolean>(false);
  const [isPromoFormModalOpen, setIsPromoFormModalOpen] = useState<boolean>(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoFormSaving, setPromoFormSaving] = useState<boolean>(false);
  const [promoFormError, setPromoFormError] = useState<string | null>(null);
  const [promoFormSuccess, setPromoFormSuccess] = useState<string | null>(null);
  const [copiedShareCode, setCopiedShareCode] = useState<string | null>(null);

  const [promoForm, setPromoForm] = useState<CreatePromotionRequest>({
    title: "",
    description: "",
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minPurchase: 0,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    maxRedemptions: 100,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop",
    daysOfWeek: [],
  });

  // Estados para Perfil de Usuario (HU 1.4)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<UpdateUserRequest>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });
  const [restaurantProfileForm, setRestaurantProfileForm] = useState<UpdateRestaurantRequest>({
    businessName: "",
    description: "",
    address: "",
    phoneNumber: "",
    logoUrl: "",
  });
  const [userProfileData, setUserProfileData] = useState<UserProfileResponse | null>(null);
  const [myRestaurantData, setMyRestaurantData] = useState<Restaurant | null>(null);

  // Estados para Recuperación de Contraseña (HU 1.3)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [forgotTab, setForgotTab] = useState<"request" | "reset">("request");
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotFeedbackMessage, setForgotFeedbackMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Estados para el Modal de Inicio de Sesión (HU 1.2)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginForm, setLoginForm] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Estados para el Modal de Registro (HU 1.1)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [registerRoleTab, setRegisterRoleTab] = useState<"client" | "restaurant">("client");
  const [registerLoading, setRegisterLoading] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccessMessage, setRegisterSuccessMessage] = useState<string | null>(null);

  // Formulario de Cliente
  const [clientForm, setClientForm] = useState<RegisterClientRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  // Formulario de Restaurante
  const [restaurantForm, setRestaurantForm] = useState<RegisterRestaurantRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    businessName: "",
    address: "",
    description: "",
  });

  // Carga inicial
  useEffect(() => {
    fetchRestaurants();
    fetchPromotions();
    try {
      const savedUser = localStorage.getItem("cupon_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === "ROLE_RESTAURANTE") {
          setViewMode("restaurant");
        } else if (parsed.role === "ROLE_ADMIN") {
          setViewMode("admin");
        }
      }
    } catch {}
  }, []);

  // Detectar token en URL si viene de enlace de correo (?token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setResetToken(tokenParam);
      setForgotTab("reset");
      setIsForgotModalOpen(true);
    }
  }, []);


  const fetchRestaurants = () => {
    setLoadingRestaurants(true);
    getRestaurants(0, 6)
      .then((data) => {
        setRestaurants(data.content);
        setLoadingRestaurants(false);
      })
      .catch((err) => {
        console.error("Error loading restaurants:", err);
        setErrorRestaurants("No se pudieron cargar los restaurantes desde el servidor.");
        setLoadingRestaurants(false);
      });
  };

  const fetchPromotions = (searchQuery?: string) => {
    setLoadingPromotions(true);
    setErrorPromotions(null);

    const query = searchQuery !== undefined ? searchQuery : searchTerm;
    const cleanQuery = query.trim() ? query.trim() : undefined;

    getPromotions(cleanQuery, 0, 8)
      .then((data) => {
        setPromotions(data.content);
        setActiveSearch(cleanQuery || "");
        setLoadingPromotions(false);
      })
      .catch((err) => {
        console.error("Error loading promotions:", err);
        setErrorPromotions("No se pudieron cargar los cupones desde el servidor.");
        setLoadingPromotions(false);
      });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPromotions(searchTerm);

    const couponsSection = document.getElementById("cupones");
    if (couponsSection) {
      couponsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchPromotions("");
  };

  const handleCategoryClick = (query: string) => {
    setSearchTerm(query);
    fetchPromotions(query);

    const couponsSection = document.getElementById("cupones");
    if (couponsSection) {
      couponsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleToggleFavorite = (promotionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const isFav = prev.includes(promotionId);
      const next = isFav ? prev.filter((id) => id !== promotionId) : [...prev, promotionId];
      localStorage.setItem("cupon_favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleOpenModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setCopiedCode(false);
    setSharedToast(false);
  };

  const handleCloseModal = () => {
    setSelectedPromotion(null);
    setCopiedCode(false);
    setSharedToast(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  const handleSharePromotion = (promotion: Promotion) => {
    const textToShare = `¡Descubre este cupón exclusivo en CupOn! ${promotion.title} en ${promotion.restaurantName}. Usa el código: ${promotion.code}`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: promotion.title,
        text: textToShare,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${textToShare} - ${shareUrl}`).then(() => {
        setSharedToast(true);
        setTimeout(() => setSharedToast(false), 3000);
      });
    }
  };

  // Enviar Registro Cliente (HU 1.1)
  const handleSubmitClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError(null);
    setRegisterSuccessMessage(null);

    try {
      const response = await registerClient(clientForm);
      localStorage.setItem("token", response.token);
      localStorage.setItem("cupon_user", JSON.stringify({ email: response.email, role: response.role }));
      setCurrentUser({ email: response.email, role: response.role });
      setRegisterSuccessMessage("¡Tu cuenta de cliente ha sido creada exitosamente! Bienvenido a CupOn.");
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegisterSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Ocurrió un error al registrar la cuenta.";
      setRegisterError(msg);
    } finally {
      setRegisterLoading(false);
    }
  };

  // Enviar Registro Restaurante (HU 1.1)
  const handleSubmitRestaurantRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError(null);
    setRegisterSuccessMessage(null);

    try {
      await registerRestaurant(restaurantForm);
      setRegisterSuccessMessage(
        "¡Tu restaurante ha sido registrado con éxito! Tu perfil se encuentra en estado 'PENDING' mientras el administrador valida tus datos comerciales."
      );
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegisterSuccessMessage(null);
      }, 3500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Ocurrió un error al registrar el restaurante.";
      setRegisterError(msg);
    } finally {
      setRegisterLoading(false);
    }
  };





  // Cargar promociones del restaurante (Épica 4)
  const fetchMyRestaurantPromotions = async () => {
    setLoadingMyPromotions(true);
    try {
      const data = await getMyPromotions(0, 50);
      setMyPromotions(data.content);
    } catch (err) {
      console.error("Error al cargar promociones del restaurante:", err);
    } finally {
      setLoadingMyPromotions(false);
    }
  };

  // Abrir formulario para crear promocion (HU 4.1)
  const handleOpenCreatePromo = () => {
    setEditingPromoId(null);
    setPromoFormError(null);
    setPromoFormSuccess(null);
    setPromoForm({
      title: "",
      description: "",
      code: "",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minPurchase: 0,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      maxRedemptions: 100,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop",
      daysOfWeek: [],
    });
    setIsPromoFormModalOpen(true);
  };

  // Abrir formulario para editar promocion (HU 4.2)
  const handleOpenEditPromo = (promo: Promotion) => {
    setEditingPromoId(promo.id);
    setPromoFormError(null);
    setPromoFormSuccess(null);
    setPromoForm({
      title: promo.title,
      description: promo.description || "",
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minPurchase: promo.minPurchase || 0,
      startDate: promo.startDate ? promo.startDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDate: promo.endDate ? promo.endDate.slice(0, 16) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      maxRedemptions: promo.maxRedemptions || 100,
      imageUrl: promo.imageUrl || "",
      daysOfWeek: (promo as any).daysOfWeek || [],
    });
    setIsPromoFormModalOpen(true);
  };

  // Guardar promocion (Crear HU 4.1 o Editar HU 4.2)
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoFormSaving(true);
    setPromoFormError(null);
    setPromoFormSuccess(null);

    const formattedPayload: CreatePromotionRequest = {
      ...promoForm,
      startDate: promoForm.startDate.length === 16 ? `${promoForm.startDate}:00` : promoForm.startDate,
      endDate: promoForm.endDate.length === 16 ? `${promoForm.endDate}:00` : promoForm.endDate,
    };

    try {
      if (editingPromoId) {
        await updatePromotion(editingPromoId, formattedPayload);
        setPromoFormSuccess("¡Promoción actualizada exitosamente!");
      } else {
        await createPromotion(formattedPayload);
        setPromoFormSuccess("¡Promoción creada exitosamente!");
      }

      await fetchMyRestaurantPromotions();
      fetchPromotions();

      setTimeout(() => {
        setIsPromoFormModalOpen(false);
        setPromoFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Ocurrió un error al guardar la promoción.";
      setPromoFormError(msg);
    } finally {
      setPromoFormSaving(false);
    }
  };

  // Eliminar promocion (HU 4.3)
  const handleDeletePromo = async (promoId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta promoción? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await deletePromotion(promoId);
      await fetchMyRestaurantPromotions();
      fetchPromotions();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar la promoción.");
    }
  };

  // Activar / Pausar promocion (HU 4.4)
  const handleTogglePromoStatus = async (promo: Promotion) => {
    const newStatus = promo.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await updatePromotionStatus(promo.id, newStatus);
      await fetchMyRestaurantPromotions();
      fetchPromotions();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al cambiar el estado de la promoción.");
    }
  };

  // Compartir promocion (HU 4.5)
  const handleSharePromoFromList = (promo: Promotion) => {
    const shareUrl = `${window.location.origin}/?promo=${promo.id}`;
    if (navigator.share) {
      navigator.share({
        title: promo.title,
        text: `¡Aprovecha esta promoción exclusiva de ${promo.restaurantName}! Código: ${promo.code}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedShareCode(promo.id);
      setTimeout(() => setCopiedShareCode(null), 2500);
    }
  };

  // Abrir Modal de Perfil y cargar datos (HU 1.4, HU 3.1, HU 3.2)
  const handleOpenProfileModal = async () => {
    setIsProfileModalOpen(true);
    setProfileLoading(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      const data = await getMyProfile();
      setUserProfileData(data);
      setProfileForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phoneNumber: data.phoneNumber || "",
      });

      if (currentUser?.role === "ROLE_RESTAURANTE") {
        try {
          const restData = await getMyRestaurant();
          setMyRestaurantData(restData);
          setRestaurantProfileForm({
            businessName: restData.businessName || "",
            description: restData.description || "",
            address: restData.address || "",
            phoneNumber: restData.phoneNumber || data.phoneNumber || "",
            logoUrl: restData.logoUrl || "",
          });
          fetchMyRestaurantPromotions();
        } catch (e) {
          console.error("Error cargando restaurante:", e);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "No se pudo cargar la información del perfil.";
      setProfileError(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  // Guardar Cambios del Perfil (HU 1.4)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      if (currentUser?.role === "ROLE_CLIENTE") {
        const updated = await updateMyProfile(profileForm);
        setUserProfileData(updated);
        setProfileMessage("¡Tus datos de perfil han sido actualizados exitosamente!");
      } else if (currentUser?.role === "ROLE_RESTAURANTE") {
        const updatedRest = await updateMyRestaurant(restaurantProfileForm);
        setMyRestaurantData(updatedRest);
        setProfileMessage("¡Los datos de tu restaurante han sido actualizados exitosamente!");
        fetchRestaurants();
      }
      setTimeout(() => {
        setProfileMessage(null);
      }, 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Ocurrió un error al actualizar el perfil.";
      setProfileError(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  // Solicitar recuperación (HU 1.3)
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotFeedbackMessage(null);

    try {
      await forgotPassword({ email: forgotEmail });
      setForgotFeedbackMessage(
        "Si el correo está registrado, recibirás un enlace o token para restablecer tu contraseña."
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || "Ocurrió un error al procesar la solicitud.";
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Restablecer contraseña con token (HU 1.3)
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotFeedbackMessage(null);

    try {
      await resetPassword({ token: resetToken, newPassword });
      setForgotFeedbackMessage("¡Tu contraseña ha sido restablecida exitosamente! Ya puedes iniciar sesión.");
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setIsLoginModalOpen(true);
        setForgotFeedbackMessage(null);
        setResetToken("");
        setNewPassword("");
      }, 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "El token es inválido o ha expirado.";
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Enviar Inicio de Sesión (HU 1.2)
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const authData = await login(loginForm);
      localStorage.setItem("token", authData.token);
      localStorage.setItem("cupon_user", JSON.stringify({ email: authData.email, role: authData.role }));
      setCurrentUser({ email: authData.email, role: authData.role });
      if (authData.role === "ROLE_RESTAURANTE") {
        setViewMode("restaurant");
      } else if (authData.role === "ROLE_ADMIN") {
        setViewMode("admin");
      } else {
        setViewMode("customer");
      }
      setIsLoginModalOpen(false);
      setLoginForm({ email: "", password: "" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Credenciales incorrectas o cuenta inactiva.";
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cupon_user");
    setCurrentUser(null);
    setViewMode("customer");
  };

  // Si es SuperAdmin autenticado y está en modo admin, renderizar AdminDashboard (Épica 6)
  if (currentUser?.role === "ROLE_ADMIN" && viewMode === "admin") {
    return (
      <AdminDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchToCustomerView={() => setViewMode("customer")}
        onCatalogNeedsRefresh={() => {
          fetchRestaurants();
          fetchPromotions();
        }}
      />
    );
  }

  // Si es un restaurante autenticado y está en modo restaurante, renderizar el Portal / Dashboard (Épicas 3, 4 y 5)
  if (currentUser?.role === "ROLE_RESTAURANTE" && viewMode === "restaurant") {
    return (
      <RestaurantDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchToCustomerView={() => setViewMode("customer")}
        onCatalogNeedsRefresh={() => {
          fetchRestaurants();
          fetchPromotions();
        }}
      />
    );
  }

  return (
    <div style={{ backgroundColor: "#f8f7fb", minHeight: "100vh" }}>
      {/* BANNER INFORMATIVO PARA ADMIN EN MODO CLIENTE */}
      {currentUser?.role === "ROLE_ADMIN" && viewMode === "customer" && (
        <div className="bg-danger text-white py-2 px-3 d-flex justify-content-between align-items-center small sticky-top" style={{ zIndex: 1050 }}>
          <div className="d-flex align-items-center gap-2">
            <span>🛡️</span>
            <span>Estás navegando CupOn como cliente regular.</span>
          </div>
          <button
            onClick={() => setViewMode("admin")}
            className="btn btn-sm btn-light rounded-pill px-3 fw-bold text-danger"
            style={{ fontSize: "0.75rem" }}
          >
            ← Volver a Panel SuperAdmin
          </button>
        </div>
      )}
      {/* BANNER INFORMATIVO PARA RESTAURANTE EN MODO CLIENTE */}
      {currentUser?.role === "ROLE_RESTAURANTE" && viewMode === "customer" && (
        <div className="bg-dark text-white py-2 px-3 d-flex justify-content-between align-items-center small sticky-top" style={{ zIndex: 1050 }}>
          <div className="d-flex align-items-center gap-2">
            <span>🏪</span>
            <span>Estás navegando CupOn como un cliente regular.</span>
          </div>
          <button
            onClick={() => setViewMode("restaurant")}
            className="btn btn-sm btn-warning rounded-pill px-3 fw-bold"
            style={{ fontSize: "0.75rem" }}
          >
            ← Volver a mi Dashboard de Restaurante
          </button>
        </div>
      )}
      {/* HEADER */}
      <nav className="navbar navbar-expand-lg bg-white shadow-sm py-3 sticky-top">
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
                <a className="nav-link" href="#restaurantes">Restaurantes</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#cupones">
                  Mis Favoritos {favoriteIds.length > 0 && <span className="badge bg-danger rounded-pill ms-1">{favoriteIds.length}</span>}
                </a>
              </li>
            </ul>

            {/* Auth Buttons / User status */}
            <div className="d-flex align-items-center gap-2">
              {currentUser ? (
                <div className="d-flex align-items-center gap-2">
                  {currentUser.role === "ROLE_ADMIN" && (
                    <button
                      onClick={() => setViewMode("admin")}
                      className="btn btn-sm btn-danger rounded-pill px-3 fw-bold shadow-sm"
                      title="Volver al panel administrativo (Épica 6)"
                    >
                      🛡️ Panel SuperAdmin
                    </button>
                  )}
                  {currentUser.role === "ROLE_RESTAURANTE" && (
                    <button
                      onClick={() => {
                        setRestaurantModalTab("promotions");
                        handleOpenProfileModal();
                      }}
                      className="btn btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm"
                      style={{ background: "#ffd54a", color: "#3a2a00" }}
                      title="Administrar promociones y datos de mi restaurante (Épica 3 & 4)"
                    >
                      🎟️ Mis Promociones
                    </button>
                  )}
                  <button
                    onClick={handleOpenProfileModal}
                    className="btn btn-light text-dark border px-3 py-1 rounded-pill small fw-semibold d-flex align-items-center gap-1 shadow-sm"
                    title="Ver y editar mi perfil"
                  >
                    👤 <span>{currentUser.email.split("@")[0]}</span>
                    <span className="badge bg-secondary-subtle text-dark border rounded-pill ms-1" style={{ fontSize: "0.7rem" }}>
                      {currentUser.role === "ROLE_RESTAURANTE" ? "Restaurante" : "Cliente"}
                    </span>
                    <span className="text-muted ms-1" style={{ fontSize: "0.75rem" }}>✏️</span>
                  </button>
                  <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3">
                    Salir
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      setLoginError(null);
                    }}
                    className="btn btn-outline-secondary rounded-pill px-4"
                  >
                    Iniciar sesión
                  </button>
                  <button
                    onClick={() => {
                      setIsRegisterModalOpen(true);
                      setRegisterError(null);
                      setRegisterSuccessMessage(null);
                    }}
                    className="btn rounded-pill px-4 text-white shadow-sm"
                    style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                  >
                    Regístrate
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO BANNER CON BUSCADOR INTERACTIVO */}
      <div className="container mt-4" id="inicio">
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

              {/* Formulario de Búsqueda */}
              <form onSubmit={handleSearch} className="input-group input-group-lg bg-white rounded-pill p-1 shadow" style={{ maxWidth: 500 }}>
                <span className="input-group-text bg-transparent border-0 ps-3">🔍</span>
                <input
                  type="text"
                  className="form-control border-0 shadow-none text-dark"
                  placeholder="Buscar comida, restaurante o cupón..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="btn bg-transparent border-0 text-muted px-2"
                    onClick={handleClearSearch}
                    title="Borrar búsqueda"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="submit"
                  className="btn rounded-pill text-white fw-semibold px-4"
                  style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                >
                  Buscar
                </button>
              </form>
            </div>
            <div className="col-lg-6 text-center d-none d-lg-block">
              <img
                src="https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=500&h=400&fit=crop"
                alt="Hamburguesa"
                className="img-fluid rounded-4 shadow"
                style={{ maxHeight: 300, objectFit: "cover" }}
              />
            </div>
          </div>

          <div
            className="position-absolute d-flex flex-column align-items-center justify-content-center rounded-circle bg-white text-dark fw-bold shadow"
            style={{ width: 100, height: 100, top: 30, right: 30 }}
          >
            <span className="small">HASTA</span>
            <span className="fs-4 lh-1" style={{ color: "#f2394a" }}>50%</span>
            <span className="small">DE DESCUENTO</span>
          </div>
        </div>
      </div>

      {/* CATEGORIAS CLICABLES */}
      <div className="container mt-5" id="categorias">
        <div className="d-flex justify-content-between flex-wrap gap-3">
          {categories.map((category) => (
            <div
              key={category.name}
              className="text-center"
              style={{ width: 90, cursor: "pointer" }}
              onClick={() => handleCategoryClick(category.query)}
              title={`Buscar ${category.name}`}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm mx-auto mb-2"
                style={{
                  width: 60,
                  height: 60,
                  fontSize: 26,
                  border: activeSearch.toLowerCase() === category.query.toLowerCase() && category.query !== "" ? "2px solid #7b2ff7" : "none"
                }}
              >
                {category.emoji}
              </div>
              <small className={`fw-semibold ${activeSearch.toLowerCase() === category.query.toLowerCase() && category.query !== "" ? "text-primary fw-bold" : ""}`}>
                {category.name}
              </small>
            </div>
          ))}
        </div>
      </div>

      {/* CUPONES DESTACADOS (CON BUSCADOR Y FAVORITOS HU 2.4) */}
      <div className="container mt-5" id="cupones">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-0">
              {activeSearch ? `Cupones encontrados para "${activeSearch}"` : "Cupones destacados"}
            </h4>
            <small className="text-muted">
              {activeSearch ? "Resultados filtrados en tiempo real" : "Promociones vigentes obtenidas de la base de datos"}
            </small>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Toggle Mis Favoritos (HU 15) */}
            <button
              id="btn-toggle-favorites"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`btn btn-sm rounded-pill px-3 fw-semibold d-flex align-items-center gap-1 ${showFavoritesOnly ? "btn-danger" : "btn-outline-danger"}`}
              aria-pressed={showFavoritesOnly}
              title="Filtrar solo mis cupones favoritos (HU 15)"
            >
              {showFavoritesOnly ? "❤️" : "🤍"} Mis Favoritos
              {favoriteIds.length > 0 && (
                <span className={`badge rounded-pill ms-1 ${showFavoritesOnly ? "bg-white text-danger" : "bg-danger text-white"}`}>
                  {favoriteIds.length}
                </span>
              )}
            </button>
            {activeSearch && (
              <button
                onClick={handleClearSearch}
                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
              >
                ✕ Ver todos los cupones
              </button>
            )}
            <span className="badge bg-primary rounded-pill px-3 py-2">● En vivo</span>
          </div>
        </div>

        {/* Indicador de carga de cupones */}
        {loadingPromotions && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Buscando cupones en el servidor...</p>
          </div>
        )}

        {/* Error de cupones */}
        {errorPromotions && (
          <div className="alert alert-danger rounded-4" role="alert">
            {errorPromotions}
          </div>
        )}

        {/* Si no hay resultados de búsqueda o favoritos */}
        {!loadingPromotions && !errorPromotions && (() => {
          const displayedPromotions = showFavoritesOnly
            ? promotions.filter((p) => favoriteIds.includes(p.id))
            : promotions;

          if (displayedPromotions.length === 0) {
            return (
              <div className="text-center py-5 bg-white rounded-4 shadow-sm p-4">
                <div style={{ fontSize: 48 }}>{showFavoritesOnly ? "❤️" : "🔍"}</div>
                <h5 className="fw-bold mt-2">
                  {showFavoritesOnly
                    ? "Aún no tienes cupones guardados"
                    : `No encontramos cupones para "${activeSearch}"`}
                </h5>
                <p className="text-muted small">
                  {showFavoritesOnly
                    ? "Explora las promociones y guarda las que más te gusten tocando el corazón ❤️"
                    : 'Intenta buscar con otra palabra como "Burger", "Taco", "Sushi" o borra el filtro.'}
                </p>
                <button
                  onClick={() => { setShowFavoritesOnly(false); if (!showFavoritesOnly) handleClearSearch(); }}
                  className="btn btn-primary rounded-pill px-4"
                  style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)", border: "none" }}
                >
                  {showFavoritesOnly ? "Ver todos los cupones" : "Ver todos los cupones"}
                </button>
              </div>
            );
          }

          return null;
        })()}

        {/* Lista dinámica de cupones (con filtro de favoritos HU 15) */}
        {!loadingPromotions && !errorPromotions && (() => {
          const displayedPromotions = showFavoritesOnly
            ? promotions.filter((p) => favoriteIds.includes(p.id))
            : promotions;

          if (displayedPromotions.length === 0) return null;

          return (
          <div className="row g-4">
            {displayedPromotions.map((promotion) => {
              const isFavorite = favoriteIds.includes(promotion.id);
              return (
                <div className="col-12 col-md-6 col-lg-3" key={promotion.id}>
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                    <div className="position-relative">
                      <img
                        src={promotion.imageUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=250&fit=crop"}
                        className="card-img-top"
                        style={{ height: 160, objectFit: "cover" }}
                        alt={promotion.title}
                      />
                      {/* Botón de Favorito (HU 2.4) */}
                      <button
                        onClick={(e) => handleToggleFavorite(promotion.id, e)}
                        className="position-absolute top-0 start-0 m-2 btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center p-0"
                        style={{ width: 36, height: 36, border: "none", zIndex: 2 }}
                        title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                      >
                        <span style={{ fontSize: 18 }}>{isFavorite ? "❤️" : "🤍"}</span>
                      </button>

                      {/* Badge de Descuento */}
                      <span
                        className="position-absolute top-0 end-0 m-2 badge rounded-pill text-white fw-bold px-3 py-2 shadow-sm"
                        style={{ background: "#ff5a1f", fontSize: "0.85rem" }}
                      >
                        {promotion.discountType === "PERCENTAGE"
                          ? `-${promotion.discountValue}%`
                          : `-$${Number(promotion.discountValue).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="card-body d-flex flex-column">
                      <div className="text-primary fw-semibold small mb-1">{promotion.restaurantName}</div>
                      <h6 className="fw-bold mb-1">{promotion.title}</h6>
                      <p className="text-muted small mb-2 flex-grow-1">{promotion.description}</p>
                      <p className="text-muted small mb-2">
                        🕒 Válido hasta: {new Date(promotion.endDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <div className="d-flex align-items-center justify-content-between bg-light rounded-3 p-2 mb-3">
                        <span className="small text-secondary fw-semibold">Código:</span>
                        <code className="fw-bold text-dark">{promotion.code}</code>
                      </div>
                      <button
                        onClick={() => handleOpenModal(promotion)}
                        className="btn w-100 text-white fw-semibold rounded-pill shadow-sm"
                        style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                      >
                        Ver cupón
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          );
        })()}
      </div>

      {/* RESTAURANTES ALIADOS */}
      <div className="container mt-5" id="restaurantes">
        {/* Cabecera + buscador (HU 14) */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div>
            <h4 className="fw-bold mb-0">Restaurantes Aliados</h4>
            <small className="text-muted">
              {restaurantSearch
                ? `${restaurants.filter((r) => r.businessName.toLowerCase().includes(restaurantSearch.toLowerCase()) || r.address.toLowerCase().includes(restaurantSearch.toLowerCase())).length} resultado(s) para "${restaurantSearch}"`
                : "Conectados directamente a la base de datos PostgreSQL"}
            </small>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Buscador de restaurantes (HU 14) */}
            <div className="input-group" style={{ maxWidth: 280 }}>
              <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                🔍
              </span>
              <input
                type="text"
                className="form-control border-start-0 rounded-end-pill"
                placeholder="Buscar restaurante..."
                value={restaurantSearch}
                onChange={(e) => setRestaurantSearch(e.target.value)}
                id="restaurant-search-input"
                aria-label="Buscar restaurante por nombre o dirección"
              />
              {restaurantSearch && (
                <button
                  className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y pe-3"
                  style={{ zIndex: 5 }}
                  onClick={() => setRestaurantSearch("")}
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="badge bg-success rounded-pill px-3 py-2">● En vivo</span>
          </div>
        </div>

        {/* Indicador de carga de restaurantes */}
        {loadingRestaurants && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Cargando restaurantes desde el servidor...</p>
          </div>
        )}

        {/* Mensaje de error de restaurantes */}
        {errorRestaurants && (
          <div className="alert alert-danger rounded-4" role="alert">
            {errorRestaurants}
          </div>
        )}

        {/* Lista dinámica de restaurantes con filtro por búsqueda (HU 14) */}
        {!loadingRestaurants && !errorRestaurants && (() => {
          const filtered = restaurantSearch.trim()
            ? restaurants.filter(
                (r) =>
                  r.businessName.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
                  r.address.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
                  (r.description || "").toLowerCase().includes(restaurantSearch.toLowerCase())
              )
            : restaurants;

          if (filtered.length === 0) {
            return (
              <div className="text-center py-5 bg-white rounded-4 shadow-sm p-4">
                <div style={{ fontSize: 48 }}>🍽️</div>
                <h5 className="fw-bold mt-2">No encontramos restaurantes para "{restaurantSearch}"</h5>
                <p className="text-muted small">Intenta con el nombre del restaurante o la dirección.</p>
                <button
                  onClick={() => setRestaurantSearch("")}
                  className="btn btn-outline-dark rounded-pill px-4"
                >
                  Ver todos los restaurantes
                </button>
              </div>
            );
          }

          return (
            <div className="row g-4">
              {filtered.map((restaurant) => (
                <div className="col-12 col-md-6 col-lg-4" key={restaurant.id}>
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                    <img
                      src={restaurant.logoUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop"}
                      className="card-img-top"
                      style={{ height: 160, objectFit: "cover" }}
                      alt={restaurant.businessName}
                    />
                    <div className="card-body d-flex flex-column">
                      <h5 className="fw-bold mb-1">{restaurant.businessName}</h5>
                      <p className="text-muted small flex-grow-1">{restaurant.description}</p>
                      <p className="small mb-1 text-secondary">📍 {restaurant.address}</p>
                      <p className="small mb-3 text-secondary">📞 {restaurant.phoneNumber}</p>
                      <button
                        className="btn btn-outline-dark rounded-pill w-100 fw-semibold"
                        onClick={() => {
                          setSearchTerm(restaurant.businessName);
                          fetchPromotions(restaurant.businessName);
                          document.getElementById("cupones")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Ver cupones de este restaurante
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
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
            onClick={() => {
              setRegisterRoleTab("restaurant");
              setIsRegisterModalOpen(true);
            }}
            className="btn fw-bold rounded-pill px-4 py-2"
            style={{ background: "#ffd54a", color: "#3a2a00" }}
          >
            Quiero ser aliado
          </button>
        </div>
      </div>

      {/* MODAL DETALLE DE CUPÓN Y COMPARTIR (HU 2.5) */}
      {selectedPromotion && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", zIndex: 1050, backdropFilter: "blur(4px)" }}
          onClick={handleCloseModal}
        >
          <div
            className="card border-0 shadow-lg rounded-4 overflow-hidden"
            style={{ maxWidth: 480, width: "90%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="position-relative">
              <img
                src={selectedPromotion.imageUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=300&fit=crop"}
                alt={selectedPromotion.title}
                style={{ width: "100%", height: 200, objectFit: "cover" }}
              />
              <button
                type="button"
                className="btn btn-light rounded-circle position-absolute top-0 end-0 m-3 shadow-sm d-flex align-items-center justify-content-center p-0"
                style={{ width: 34, height: 34, border: "none" }}
                onClick={handleCloseModal}
              >
                ✕
              </button>
              <span
                className="position-absolute bottom-0 start-0 m-3 badge rounded-pill text-white fw-bold px-3 py-2 shadow"
                style={{ background: "#ff5a1f", fontSize: "1rem" }}
              >
                {selectedPromotion.discountType === "PERCENTAGE"
                  ? `${selectedPromotion.discountValue}% DE DESCUENTO`
                  : `$${Number(selectedPromotion.discountValue).toLocaleString()} DE DESCUENTO`}
              </span>
            </div>

            <div className="card-body p-4">
              <div className="text-primary fw-bold text-uppercase small mb-1">
                {selectedPromotion.restaurantName}
              </div>
              <h4 className="fw-bold mb-2">{selectedPromotion.title}</h4>
              <p className="text-secondary small mb-3">{selectedPromotion.description}</p>

              {/* Información de compra mínima y validez */}
              <div className="bg-light rounded-4 p-3 mb-4">
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Consumo mínimo:</span>
                  <span className="fw-bold text-dark">
                    {Number(selectedPromotion.minPurchase) > 0
                      ? `$${Number(selectedPromotion.minPurchase).toLocaleString()}`
                      : "Sin consumo mínimo"}
                  </span>
                </div>
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Vigencia:</span>
                  <span className="fw-bold text-dark">
                    Hasta {new Date(selectedPromotion.endDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="d-flex justify-content-between small text-muted">
                  <span>Redenciones disponibles:</span>
                  <span className="fw-bold text-dark">
                    {selectedPromotion.maxRedemptions > 0
                      ? `${selectedPromotion.maxRedemptions - selectedPromotion.currentRedemptions} cupones restantes`
                      : "Ilimitados"}
                  </span>
                </div>
              </div>

              {/* Cupón y botón de copiar */}
              <div className="text-center border border-2 border-dashed border-primary rounded-4 p-3 mb-3 bg-light">
                <small className="text-muted d-block mb-1">Código de descuento:</small>
                <div className="display-6 fw-bold text-primary letter-spacing-2 mb-2 font-monospace">
                  {selectedPromotion.code}
                </div>
                <button
                  onClick={() => handleCopyCode(selectedPromotion.code)}
                  className={`btn rounded-pill px-4 fw-semibold ${copiedCode ? "btn-success" : "btn-dark"}`}
                >
                  {copiedCode ? "¡Código copiado! ✓" : "📋 Copiar código"}
                </button>
              </div>

              {/* Acciones inferiores: Compartir y Favorito */}
              <div className="d-flex gap-2">
                <button
                  onClick={() => handleSharePromotion(selectedPromotion)}
                  className="btn btn-outline-primary rounded-pill w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                >
                  <span>🔗</span> {sharedToast ? "¡Enlace copiado! ✓" : "Compartir cupón"}
                </button>
                <button
                  onClick={(e) => handleToggleFavorite(selectedPromotion.id, e)}
                  className={`btn rounded-pill px-4 fw-semibold ${favoriteIds.includes(selectedPromotion.id) ? "btn-danger" : "btn-outline-danger"}`}
                  title="Guardar en favoritos"
                >
                  {favoriteIds.includes(selectedPromotion.id) ? "❤️ Guardado" : "🤍 Favorito"}
                </button>
              </div>

              <div className="text-center mt-3">
                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Muestra este código al momento de pagar en el restaurante o menciónalo en tu compra.
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO DE CUENTA (HU 1.1) */}
      {isRegisterModalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", zIndex: 1060, backdropFilter: "blur(4px)" }}
          onClick={() => setIsRegisterModalOpen(false)}
        >
          <div
            className="card border-0 shadow-lg rounded-4 overflow-hidden"
            style={{ maxWidth: 520, width: "92%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-white">
              <div>
                <h4 className="fw-bold mb-0">Crear una cuenta</h4>
                <small className="text-muted">Únete a CupOn para disfrutar o publicar cupones</small>
              </div>
              <button
                type="button"
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0"
                style={{ width: 34, height: 34 }}
                onClick={() => setIsRegisterModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Pestañas: Cliente vs Restaurante */}
            <div className="d-flex border-bottom bg-light p-2 gap-2">
              <button
                type="button"
                className={`btn flex-fill rounded-pill fw-semibold py-2 ${registerRoleTab === "client" ? "btn-white shadow-sm text-primary fw-bold" : "btn-light text-muted"}`}
                style={{ background: registerRoleTab === "client" ? "#ffffff" : "transparent" }}
                onClick={() => {
                  setRegisterRoleTab("client");
                  setRegisterError(null);
                  setRegisterSuccessMessage(null);
                }}
              >
                👤 Soy Cliente
              </button>
              <button
                type="button"
                className={`btn flex-fill rounded-pill fw-semibold py-2 ${registerRoleTab === "restaurant" ? "btn-white shadow-sm text-primary fw-bold" : "btn-light text-muted"}`}
                style={{ background: registerRoleTab === "restaurant" ? "#ffffff" : "transparent" }}
                onClick={() => {
                  setRegisterRoleTab("restaurant");
                  setRegisterError(null);
                  setRegisterSuccessMessage(null);
                }}
              >
                🏪 Soy Restaurante
              </button>
            </div>

            <div className="card-body p-4">
              {/* Mensajes de feedback */}
              {registerSuccessMessage && (
                <div className="alert alert-success rounded-4" role="alert">
                  {registerSuccessMessage}
                </div>
              )}

              {registerError && (
                <div className="alert alert-danger rounded-4" role="alert">
                  {registerError}
                </div>
              )}

              {/* FORMULARIO CLIENTE */}
              {registerRoleTab === "client" ? (
                <form onSubmit={handleSubmitClientRegister}>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Nombre</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="Ej. Juan"
                        required
                        value={clientForm.firstName}
                        onChange={(e) => setClientForm({ ...clientForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Apellido</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="Ej. Pérez"
                        required
                        value={clientForm.lastName}
                        onChange={(e) => setClientForm({ ...clientForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Correo electrónico</label>
                    <input
                      type="email"
                      className="form-control rounded-3"
                      placeholder="nombre@correo.com"
                      required
                      value={clientForm.email}
                      onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold">Contraseña</label>
                    <input
                      type="password"
                      className="form-control rounded-3"
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                      value={clientForm.password}
                      onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                    />
                    <small className="text-muted">Debe tener al menos 8 caracteres.</small>
                  </div>

                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="btn w-100 text-white fw-bold rounded-pill py-2 shadow-sm"
                    style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                  >
                    {registerLoading ? "Creando cuenta..." : "Registrarme como Cliente"}
                  </button>
                </form>
              ) : (
                /* FORMULARIO RESTAURANTE */
                <form onSubmit={handleSubmitRestaurantRegister}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Nombre del restaurante / negocio</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="Ej. Pizzería Napolitana"
                      required
                      value={restaurantForm.businessName}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, businessName: e.target.value })}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Nombre del responsable</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="Ej. Carlos"
                        required
                        value={restaurantForm.firstName}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Apellido</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="Ej. Gómez"
                        required
                        value={restaurantForm.lastName}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Dirección física</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="Ej. Calle 100 # 15-20, Bogotá"
                      required
                      value={restaurantForm.address}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Correo de acceso</label>
                    <input
                      type="email"
                      className="form-control rounded-3"
                      placeholder="restaurante@ejemplo.com"
                      required
                      value={restaurantForm.email}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, email: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Contraseña</label>
                    <input
                      type="password"
                      className="form-control rounded-3"
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                      value={restaurantForm.password}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, password: e.target.value })}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold">Descripción del negocio (opcional)</label>
                    <textarea
                      className="form-control rounded-3"
                      rows={2}
                      placeholder="Especialidad, tipo de cocina, horario..."
                      value={restaurantForm.description}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="btn w-100 fw-bold rounded-pill py-2 shadow-sm"
                    style={{ background: "#ffd54a", color: "#3a2a00" }}
                  >
                    {registerLoading ? "Enviando solicitud..." : "Solicitar Registro de Restaurante"}
                  </button>
                  <small className="text-muted d-block text-center mt-2" style={{ fontSize: "0.75rem" }}>
                    Tu cuenta quedará en estado de aprobación por el equipo administrador.
                  </small>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INICIO DE SESIÓN (HU 1.2) */}
      {isLoginModalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", zIndex: 1060, backdropFilter: "blur(4px)" }}
          onClick={() => setIsLoginModalOpen(false)}
        >
          <div
            className="card border-0 shadow-lg rounded-4 overflow-hidden"
            style={{ maxWidth: 440, width: "92%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-white">
              <div>
                <h4 className="fw-bold mb-0">Iniciar sesión</h4>
                <small className="text-muted">Ingresa a tu cuenta de CupOn</small>
              </div>
              <button
                type="button"
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0"
                style={{ width: 34, height: 34 }}
                onClick={() => setIsLoginModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="card-body p-4">
              {loginError && (
                <div className="alert alert-danger rounded-4 py-2 small" role="alert">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleSubmitLogin}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Correo electrónico</label>
                  <input
                    type="email"
                    className="form-control rounded-3"
                    placeholder="nombre@correo.com"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold mb-0">Contraseña</label>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small text-muted"
                      style={{ fontSize: "0.8rem" }}
                      onClick={() => {
                        setIsLoginModalOpen(false);
                        setIsForgotModalOpen(true);
                        setForgotFeedbackMessage(null);
                        setForgotError(null);
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <input
                    type="password"
                    className="form-control rounded-3"
                    placeholder="Tu contraseña"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="btn w-100 text-white fw-bold rounded-pill py-2 shadow-sm mb-3"
                  style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                >
                  {loginLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </button>

                <div className="text-center">
                  <small className="text-muted">
                    ¿No tienes una cuenta?{" "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold"
                      style={{ color: "#7b2ff7", fontSize: "0.875rem" }}
                      onClick={() => {
                        setIsLoginModalOpen(false);
                        setIsRegisterModalOpen(true);
                      }}
                    >
                      Regístrate aquí
                    </button>
                  </small>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA (HU 1.3) */}
      {isForgotModalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", zIndex: 1060, backdropFilter: "blur(4px)" }}
          onClick={() => setIsForgotModalOpen(false)}
        >
          <div
            className="card border-0 shadow-lg rounded-4 overflow-hidden"
            style={{ maxWidth: 460, width: "92%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-white">
              <div>
                <h4 className="fw-bold mb-0">Recuperar contraseña</h4>
                <small className="text-muted">Restablece el acceso a tu cuenta</small>
              </div>
              <button
                type="button"
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0"
                style={{ width: 34, height: 34 }}
                onClick={() => setIsForgotModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Pestañas: Solicitar enlace vs Ingresar token */}
            <div className="d-flex border-bottom bg-light p-2 gap-2">
              <button
                type="button"
                className={`btn flex-fill rounded-pill fw-semibold py-2 ${forgotTab === "request" ? "btn-white shadow-sm text-primary fw-bold" : "btn-light text-muted"}`}
                style={{ background: forgotTab === "request" ? "#ffffff" : "transparent" }}
                onClick={() => {
                  setForgotTab("request");
                  setForgotError(null);
                  setForgotFeedbackMessage(null);
                }}
              >
                ✉️ Solicitar enlace
              </button>
              <button
                type="button"
                className={`btn flex-fill rounded-pill fw-semibold py-2 ${forgotTab === "reset" ? "btn-white shadow-sm text-primary fw-bold" : "btn-light text-muted"}`}
                style={{ background: forgotTab === "reset" ? "#ffffff" : "transparent" }}
                onClick={() => {
                  setForgotTab("reset");
                  setForgotError(null);
                  setForgotFeedbackMessage(null);
                }}
              >
                🔑 Tengo un código
              </button>
            </div>

            <div className="card-body p-4">
              {forgotFeedbackMessage && (
                <div className="alert alert-success rounded-4 py-2 small" role="alert">
                  {forgotFeedbackMessage}
                </div>
              )}

              {forgotError && (
                <div className="alert alert-danger rounded-4 py-2 small" role="alert">
                  {forgotError}
                </div>
              )}

              {forgotTab === "request" ? (
                /* FORMULARIO SOLICITUD DE RECUPERACIÓN */
                <form onSubmit={handleRequestPasswordReset}>
                  <p className="small text-muted mb-3">
                    Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos instrucciones para restablecer tu contraseña.
                  </p>
                  <div className="mb-4">
                    <label className="form-label small fw-semibold">Correo electrónico</label>
                    <input
                      type="email"
                      className="form-control rounded-3"
                      placeholder="nombre@correo.com"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn w-100 text-white fw-bold rounded-pill py-2 shadow-sm mb-3"
                    style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                  >
                    {forgotLoading ? "Enviando solicitud..." : "Enviar enlace de recuperación"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small text-muted"
                      onClick={() => {
                        setIsForgotModalOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                    >
                      ← Volver al inicio de sesión
                    </button>
                  </div>
                </form>
              ) : (
                /* FORMULARIO RESTABLECIMIENTO CON TOKEN */
                <form onSubmit={handleConfirmPasswordReset}>
                  <p className="small text-muted mb-3">
                    Ingresa el código o token de recuperación que recibiste y define tu nueva contraseña.
                  </p>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Token de recuperación</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="Pega aquí tu token"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold">Nueva contraseña</label>
                    <input
                      type="password"
                      className="form-control rounded-3"
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn w-100 text-white fw-bold rounded-pill py-2 shadow-sm mb-3"
                    style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                  >
                    {forgotLoading ? "Restableciendo..." : "Actualizar Contraseña"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small text-muted"
                      onClick={() => {
                        setIsForgotModalOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                    >
                      ← Volver al inicio de sesión
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PERFIL DE USUARIO (HU 1.4) */}
      {isProfileModalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", zIndex: 1060, backdropFilter: "blur(4px)" }}
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div
            className="card border-0 shadow-lg rounded-4 overflow-hidden"
            style={{ maxWidth: 520, width: "92%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-white">
              <div>
                <h4 className="fw-bold mb-0">Mi Perfil</h4>
                <small className="text-muted">Gestiona tus datos personales y de cuenta</small>
              </div>
              <button
                type="button"
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0"
                style={{ width: 34, height: 34 }}
                onClick={() => setIsProfileModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {currentUser?.role === "ROLE_RESTAURANTE" && (
              <div className="d-flex border-bottom bg-light p-2 gap-2">
                <button
                  type="button"
                  className={`btn flex-fill rounded-pill fw-semibold py-2 ${restaurantModalTab === "promotions" ? "btn-white shadow-sm text-primary fw-bold" : "btn-light text-muted"}`}
                  style={{ background: restaurantModalTab === "promotions" ? "#ffffff" : "transparent" }}
                  onClick={() => setRestaurantModalTab("promotions")}
                >
                  🎟️ Mis Promociones ({myPromotions.length})
                </button>
                <button
                  type="button"
                  className={`btn flex-fill rounded-pill fw-semibold py-2 ${restaurantModalTab === "profile" ? "btn-white shadow-sm text-primary fw-bold" : "btn-light text-muted"}`}
                  style={{ background: restaurantModalTab === "profile" ? "#ffffff" : "transparent" }}
                  onClick={() => setRestaurantModalTab("profile")}
                >
                  🏢 Datos del Local
                </button>
              </div>
            )}

            <div className="card-body p-4">
              {profileLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2 text-muted small">Cargando información del perfil...</p>
                </div>
              ) : (
                <>
                  {profileMessage && (
                    <div className="alert alert-success rounded-4 py-2 small" role="alert">
                      {profileMessage}
                    </div>
                  )}

                  {profileError && (
                    <div className="alert alert-danger rounded-4 py-2 small" role="alert">
                      {profileError}
                    </div>
                  )}

                  {/* Datos fijos de la cuenta */}
                  <div className="bg-light p-3 rounded-4 mb-4 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-muted fw-semibold">Correo registrado:</span>
                      <span className="badge bg-secondary rounded-pill">
                        {currentUser?.role === "ROLE_RESTAURANTE" ? "Restaurante" : "Cliente"}
                      </span>
                    </div>
                    <div className="fw-bold text-dark">{userProfileData?.email || currentUser?.email}</div>
                  </div>

                  {/* FORMULARIO CLIENTE */}
                  {currentUser?.role === "ROLE_CLIENTE" ? (
                    <form onSubmit={handleSaveProfile}>
                      <div className="row g-3 mb-3">
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Nombre</label>
                          <input
                            type="text"
                            className="form-control rounded-3"
                            required
                            value={profileForm.firstName || ""}
                            onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Apellido</label>
                          <input
                            type="text"
                            className="form-control rounded-3"
                            required
                            value={profileForm.lastName || ""}
                            onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-semibold">Teléfono de contacto</label>
                        <input
                          type="tel"
                          className="form-control rounded-3"
                          placeholder="Ej. +57 300 1234567"
                          value={profileForm.phoneNumber || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="btn w-100 text-white fw-bold rounded-pill py-2 shadow-sm"
                        style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                      >
                        {profileSaving ? "Guardando cambios..." : "Guardar Cambios"}
                      </button>
                    </form>
                  ) : (
                    /* FORMULARIO RESTAURANTE (HU 3.1, HU 3.2 & ÉPICA 4) */
                    <div>
                      {restaurantModalTab === "promotions" ? (
                        /* PESTAÑA: MIS PROMOCIONES (ÉPICA 4) */
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <h5 className="fw-bold mb-0">Tus Promociones Activas</h5>
                              <small className="text-muted">Crea, edita o pausa tus ofertas en tiempo real</small>
                            </div>
                            <button
                              type="button"
                              onClick={handleOpenCreatePromo}
                              className="btn btn-sm text-white fw-bold rounded-pill px-3 shadow-sm"
                              style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                            >
                              + Nueva Promoción
                            </button>
                          </div>

                          {loadingMyPromotions ? (
                            <div className="text-center py-4">
                              <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
                              <span className="ms-2 text-muted small">Cargando tus promociones...</span>
                            </div>
                          ) : myPromotions.length === 0 ? (
                            <div className="text-center py-4 bg-light rounded-4 border">
                              <span style={{ fontSize: "2rem" }}>🎟️</span>
                              <h6 className="fw-bold mt-2">Aún no tienes promociones creadas</h6>
                              <p className="text-muted small mb-3">Crea tu primera promoción para atraer comensales a tu restaurante.</p>
                              <button
                                type="button"
                                onClick={handleOpenCreatePromo}
                                className="btn btn-sm btn-primary rounded-pill px-4 fw-bold"
                              >
                                Crear mi primer cupón
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex flex-column gap-3">
                              {myPromotions.map((promo) => (
                                <div key={promo.id} className="card border rounded-4 shadow-sm p-3 bg-white">
                                  <div className="d-flex justify-content-between align-items-start gap-3">
                                    <img
                                      src={promo.imageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop"}
                                      alt={promo.title}
                                      className="rounded-3"
                                      style={{ width: 80, height: 70, objectFit: "cover" }}
                                    />
                                    <div className="flex-fill">
                                      <div className="d-flex align-items-center gap-2 mb-1">
                                        <span className="badge rounded-pill fw-bold" style={{
                                          backgroundColor: promo.status === "ACTIVE" ? "#eefcf3" : "#f1f1f4",
                                          color: promo.status === "ACTIVE" ? "#198754" : "#6c757d",
                                          border: `1px solid ${promo.status === "ACTIVE" ? "#c3e6cb" : "#dee2e6"}`
                                        }}>
                                          {promo.status === "ACTIVE" ? "🟢 Activa" : "⚪ Pausada"}
                                        </span>
                                        <span className="badge bg-light text-dark border font-monospace">
                                          🏷️ {promo.code}
                                        </span>
                                      </div>
                                      <h6 className="fw-bold mb-1">{promo.title}</h6>
                                      <small className="text-muted d-block">
                                        Descuento: <span className="fw-semibold text-danger">{promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% OFF` : `$${promo.discountValue.toLocaleString()}`}</span> • Canjes: {promo.currentRedemptions || 0}/{promo.maxRedemptions || "∞"}
                                      </small>
                                    </div>
                                  </div>

                                  {/* Botones de acción de la promocion (HU 4.2, 4.3, 4.4, 4.5) */}
                                  <div className="d-flex justify-content-end align-items-center gap-2 mt-3 pt-2 border-top">
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePromoStatus(promo)}
                                      className={`btn btn-sm rounded-pill px-3 fw-semibold ${promo.status === "ACTIVE" ? "btn-outline-secondary" : "btn-outline-success"}`}
                                      title={promo.status === "ACTIVE" ? "Pausar promoción (HU 4.4)" : "Activar promoción (HU 4.4)"}
                                    >
                                      {promo.status === "ACTIVE" ? "⏸️ Pausar" : "▶️ Activar"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditPromo(promo)}
                                      className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold"
                                      title="Editar promoción (HU 4.2)"
                                    >
                                      ✏️ Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSharePromoFromList(promo)}
                                      className="btn btn-sm btn-outline-info rounded-pill px-3 fw-semibold"
                                      title="Compartir promoción (HU 4.5)"
                                    >
                                      {copiedShareCode === promo.id ? "¡Copiado!" : "↗️ Compartir"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePromo(promo.id)}
                                      className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold"
                                      title="Eliminar promoción (HU 4.3)"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* PESTAÑA: DATOS DEL LOCAL (HU 3.1 & 3.2) */
                        <div>
                      {/* Estado de Aprobación de la Plataforma (HU 3.1) */}
                      <div className="p-3 rounded-4 mb-4 border d-flex align-items-center gap-3" style={{
                        backgroundColor: myRestaurantData?.approvalStatus === "APPROVED" ? "#eefcf3" : myRestaurantData?.approvalStatus === "REJECTED" ? "#fdf2f2" : "#fef9e7",
                        borderColor: myRestaurantData?.approvalStatus === "APPROVED" ? "#c3e6cb" : myRestaurantData?.approvalStatus === "REJECTED" ? "#f5c6cb" : "#ffeeba"
                      }}>
                        <div style={{ fontSize: "2rem" }}>
                          {myRestaurantData?.approvalStatus === "APPROVED" ? "🟢" : myRestaurantData?.approvalStatus === "REJECTED" ? "🔴" : "🟡"}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">
                            Estado: {myRestaurantData?.approvalStatus === "APPROVED" ? "Aprobado y Activo" : myRestaurantData?.approvalStatus === "REJECTED" ? "Solicitud Rechazada" : "Pendiente de Aprobación"}
                          </div>
                          <small className="text-muted">
                            {myRestaurantData?.approvalStatus === "APPROVED"
                              ? "Tu restaurante está visible en el catálogo y listo para crear promociones."
                              : myRestaurantData?.approvalStatus === "REJECTED"
                              ? "Tu cuenta fue rechazada por el equipo administrador. Actualiza tus datos o contáctanos."
                              : "Tu negocio está siendo revisado por el equipo de CupOn. Te notificaremos una vez sea aprobado."}
                          </small>
                        </div>
                      </div>

                      <form onSubmit={handleSaveProfile}>
                        <div className="mb-3">
                          <label className="form-label small fw-semibold">Nombre comercial del restaurante</label>
                          <input
                            type="text"
                            className="form-control rounded-3"
                            placeholder="Nombre comercial"
                            required
                            value={restaurantProfileForm.businessName || ""}
                            onChange={(e) =>
                              setRestaurantProfileForm({ ...restaurantProfileForm, businessName: e.target.value })
                            }
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-semibold">Dirección física</label>
                          <input
                            type="text"
                            className="form-control rounded-3"
                            placeholder="Dirección del local"
                            required
                            value={restaurantProfileForm.address || ""}
                            onChange={(e) =>
                              setRestaurantProfileForm({ ...restaurantProfileForm, address: e.target.value })
                            }
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-semibold">Teléfono de contacto</label>
                          <input
                            type="tel"
                            className="form-control rounded-3"
                            placeholder="Teléfono del restaurante"
                            value={restaurantProfileForm.phoneNumber || ""}
                            onChange={(e) =>
                              setRestaurantProfileForm({ ...restaurantProfileForm, phoneNumber: e.target.value })
                            }
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-semibold">URL del Logo o Imagen representativa</label>
                          <input
                            type="url"
                            className="form-control rounded-3"
                            placeholder="https://images.unsplash.com/..."
                            value={restaurantProfileForm.logoUrl || ""}
                            onChange={(e) =>
                              setRestaurantProfileForm({ ...restaurantProfileForm, logoUrl: e.target.value })
                            }
                          />
                          {/* Vista previa en vivo del Logo */}
                          {restaurantProfileForm.logoUrl && (
                            <div className="mt-2 p-2 border rounded-3 bg-light d-flex align-items-center gap-3">
                              <img
                                src={restaurantProfileForm.logoUrl}
                                alt="Vista previa logo"
                                style={{ width: 60, height: 60, objectFit: "cover" }}
                                className="rounded-3 shadow-sm border"
                                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                              />
                              <div>
                                <small className="fw-semibold d-block text-dark">Vista previa del logo</small>
                                <small className="text-muted" style={{ fontSize: "0.75rem" }}>Así se verá en la cabecera de tus promociones</small>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <label className="form-label small fw-semibold">Descripción o especialidad gastronómica</label>
                          <textarea
                            className="form-control rounded-3"
                            rows={3}
                            placeholder="Cuéntale a los clientes qué hace único a tu restaurante..."
                            value={restaurantProfileForm.description || ""}
                            onChange={(e) =>
                              setRestaurantProfileForm({ ...restaurantProfileForm, description: e.target.value })
                            }
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="btn w-100 fw-bold rounded-pill py-2 shadow-sm"
                          style={{ background: "#ffd54a", color: "#3a2a00" }}
                        >
                          {profileSaving ? "Guardando cambios..." : "Guardar Cambios del Restaurante"}
                        </button>
                      </form>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CREAR / EDITAR PROMOCIÓN (HU 4.1 & HU 4.2) */}
      {isPromoFormModalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 1070, backdropFilter: "blur(4px)" }}
          onClick={() => setIsPromoFormModalOpen(false)}
        >
          <div
            className="card border-0 shadow-lg rounded-4 overflow-hidden"
            style={{ maxWidth: 560, width: "94%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-white sticky-top">
              <div>
                <h4 className="fw-bold mb-0">
                  {editingPromoId ? "Editar Promoción" : "Crear Nueva Promoción"}
                </h4>
                <small className="text-muted">
                  {editingPromoId ? "Modifica los términos de tu oferta" : "Publica una nueva oferta para tus clientes"}
                </small>
              </div>
              <button
                type="button"
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0"
                style={{ width: 34, height: 34 }}
                onClick={() => setIsPromoFormModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="card-body p-4">
              {promoFormSuccess && (
                <div className="alert alert-success rounded-4 py-2 small" role="alert">
                  {promoFormSuccess}
                </div>
              )}

              {promoFormError && (
                <div className="alert alert-danger rounded-4 py-2 small" role="alert">
                  {promoFormError}
                </div>
              )}

              <form onSubmit={handleSavePromo}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Título de la promoción</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Ej. 2x1 en Hamburguesas Artesanales"
                    required
                    value={promoForm.title}
                    onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Código del cupón (para canje)</label>
                  <input
                    type="text"
                    className="form-control rounded-3 font-monospace fw-bold"
                    placeholder="Ej. BURGER2X1"
                    required
                    style={{ letterSpacing: 1 }}
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Tipo de descuento</label>
                    <select
                      className="form-select rounded-3"
                      value={promoForm.discountType}
                      onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value as any })}
                    >
                      <option value="PERCENTAGE">Porcentaje (%)</option>
                      <option value="FIXED_AMOUNT">Monto Fijo ($)</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">
                      Valor ({promoForm.discountType === "PERCENTAGE" ? "%" : "$ COP"})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control rounded-3"
                      required
                      value={promoForm.discountValue}
                      onChange={(e) => setPromoForm({ ...promoForm, discountValue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Compra mínima ($ COP)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control rounded-3"
                      placeholder="0 = Sin mínimo"
                      value={promoForm.minPurchase || ""}
                      onChange={(e) => setPromoForm({ ...promoForm, minPurchase: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Límite de canjes</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control rounded-3"
                      placeholder="Ej. 100"
                      value={promoForm.maxRedemptions || ""}
                      onChange={(e) => setPromoForm({ ...promoForm, maxRedemptions: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Fecha de inicio</label>
                    <input
                      type="datetime-local"
                      className="form-control rounded-3"
                      required
                      value={promoForm.startDate}
                      onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Fecha de vencimiento</label>
                    <input
                      type="datetime-local"
                      className="form-control rounded-3"
                      required
                      value={promoForm.endDate}
                      onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">URL de imagen de la oferta</label>
                  <input
                    type="url"
                    className="form-control rounded-3"
                    placeholder="https://images.unsplash.com/..."
                    value={promoForm.imageUrl || ""}
                    onChange={(e) => setPromoForm({ ...promoForm, imageUrl: e.target.value })}
                  />
                  {promoForm.imageUrl && (
                    <div className="mt-2 p-2 border rounded-3 bg-light d-flex align-items-center gap-3">
                      <img
                        src={promoForm.imageUrl}
                        alt="Vista previa"
                        style={{ width: 80, height: 60, objectFit: "cover" }}
                        className="rounded-3 shadow-sm border"
                        onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                      />
                      <div>
                        <small className="fw-semibold d-block text-dark">Vista previa del cupón</small>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Esta imagen se exhibirá en el catálogo de ofertas</small>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Descripción o términos y condiciones</label>
                  <textarea
                    className="form-control rounded-3"
                    rows={3}
                    placeholder="Detalles sobre lo que incluye el cupón, horarios o restricciones..."
                    value={promoForm.description || ""}
                    onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  />
                </div>

                {/* Selector de días de la semana (HU 13 / HU 17) */}
                <div className="mb-4">
                  <label className="form-label small fw-semibold">
                    📅 Días en que aplica el cupón
                    <span className="text-muted fw-normal ms-1">(opcional — sin selección = todos los días)</span>
                  </label>
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    {[
                      { key: "MONDAY",    label: "Lun" },
                      { key: "TUESDAY",   label: "Mar" },
                      { key: "WEDNESDAY", label: "Mié" },
                      { key: "THURSDAY",  label: "Jue" },
                      { key: "FRIDAY",    label: "Vie" },
                      { key: "SATURDAY",  label: "Sáb" },
                      { key: "SUNDAY",    label: "Dom" },
                    ].map(({ key, label }) => {
                      const isSelected = (promoForm.daysOfWeek || []).includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            const current = promoForm.daysOfWeek || [];
                            const updated = isSelected
                              ? current.filter((d) => d !== key)
                              : [...current, key];
                            setPromoForm({ ...promoForm, daysOfWeek: updated });
                          }}
                          className={`btn btn-sm rounded-pill fw-semibold px-3 ${isSelected ? "text-white" : "btn-outline-secondary"}`}
                          style={isSelected ? { background: "linear-gradient(90deg, #7b2ff7, #f107a3)", border: "none" } : {}}
                        >
                          {label}
                        </button>
                      );
                    })}
                    {(promoForm.daysOfWeek || []).length > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-pill px-3"
                        onClick={() => setPromoForm({ ...promoForm, daysOfWeek: [] })}
                      >
                        ✕ Limpiar
                      </button>
                    )}
                  </div>
                  {(promoForm.daysOfWeek || []).length > 0 && (
                    <small className="text-muted d-block mt-1">
                      Aplica solo los días seleccionados (HU 13/17)
                    </small>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={promoFormSaving}
                  className="btn w-100 text-white fw-bold rounded-pill py-2 shadow-sm"
                  style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                >
                  {promoFormSaving ? "Guardando..." : editingPromoId ? "Actualizar Promoción" : "Publicar Promoción"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
