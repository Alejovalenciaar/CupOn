-- =====================================================
-- V4: Historial de consultas del chatbot (RAG)
-- =====================================================

-- user_id es opcional: permite conservar el historial de invitados que
-- preguntan sin iniciar sesión. Si el usuario se elimina, el historial se
-- conserva (se desvincula del usuario, no se borra).
CREATE TABLE chat_consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_consultas_user ON chat_consultas(user_id);
CREATE INDEX idx_chat_consultas_created_at ON chat_consultas(created_at);
