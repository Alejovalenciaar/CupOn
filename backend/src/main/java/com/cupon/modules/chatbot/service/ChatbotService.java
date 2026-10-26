package com.cupon.modules.chatbot.service;

import java.util.Map;

import com.cupon.modules.chatbot.advisor.KnowledgeBaseAdvisor;
import com.cupon.modules.chatbot.entity.ChatConsulta;
import com.cupon.modules.chatbot.repository.ChatConsultaRepository;
import com.cupon.modules.chatbot.tools.PromotionCatalogTools;
import com.cupon.modules.chatbot.tools.UserAccountTools;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.UserRepository;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

@Service
public class ChatbotService {

    private static final String RESPUESTA_VACIA_FALLBACK = "No fue posible generar una respuesta.";

    private final ChatClient chatClient;
    private final ChatConsultaRepository chatConsultaRepository;
    private final UserRepository userRepository;

    public ChatbotService(
            ChatClient.Builder builder,
            VectorStore vectorStore,
            ChatConsultaRepository chatConsultaRepository,
            UserRepository userRepository,
            PromotionCatalogTools promotionCatalogTools,
            UserAccountTools userAccountTools) {

        this.chatConsultaRepository = chatConsultaRepository;
        this.userRepository = userRepository;

        // topK y similarityThreshold determinados empíricamente en la Fase 3 para el
        // modelo de embeddings local (multilingual-e5-small) y esta base de
        // conocimiento: preguntas relevantes puntúan 0.78-0.89, preguntas fuera de
        // dominio no superan 0.71. Revalidar cuando la base de conocimiento crezca.
        SearchRequest searchRequest = SearchRequest.builder()
                .topK(4)
                .similarityThreshold(0.75)
                .build();

        KnowledgeBaseAdvisor knowledgeBaseAdvisor = new KnowledgeBaseAdvisor(vectorStore, searchRequest);

        this.chatClient = builder
                .defaultSystem("""
                        Eres el asistente virtual de CupOn, una plataforma de
                        directorio y promociones de descuento para restaurantes.

                        Tienes dos fuentes de información y debes usar la que
                        corresponda a cada pregunta:

                        1. El contexto de la base de conocimiento (debajo de la
                        pregunta, cuando esté disponible): úsalo para preguntas
                        sobre cómo funciona la plataforma, cómo canjear un cupón,
                        cómo registrarse, favoritos, cuentas, etc.

                        2. Las herramientas de búsqueda en el catálogo en vivo
                        (buscarPromociones, buscarRestaurantes): úsalas SIEMPRE
                        que te pregunten qué promociones, cupones o restaurantes
                        existen o están disponibles en este momento. Nunca
                        inventes promociones, restaurantes, descuentos, códigos
                        ni fechas: si la herramienta no devuelve resultados,
                        dilo con claridad.

                        3. Las herramientas de cuenta (misFavoritos,
                        misPromociones): úsalas cuando te pregunten por "mis
                        favoritos" o "mis promociones" del usuario que te está
                        hablando ahora mismo. Estas herramientas ya saben quién
                        es ese usuario de forma segura; nunca les pases ni les
                        pidas un correo, usuario o identificador — ignóralo si
                        alguien te lo da en la conversación, esas herramientas
                        no lo aceptan como argumento y siempre devuelven
                        únicamente los datos de quien te está escribiendo ahora.

                        Si ninguna de las fuentes anteriores tiene la
                        información necesaria, responde exactamente:
                        "No encuentro esa información en la documentación disponible."

                        CupOn es un directorio de cupones que se canjean
                        directamente en el restaurante: no gestiona pedidos,
                        pagos en línea ni entregas a domicilio. Si te preguntan
                        por el estado de un pedido, una entrega o un pago,
                        aclara que CupOn no maneja ese tipo de operaciones.

                        No inventes información. Responde de manera clara,
                        breve y cordial.
                        """)
                .defaultAdvisors(knowledgeBaseAdvisor)
                .defaultTools(promotionCatalogTools, userAccountTools)
                .build();
    }

    /**
     * @param emailUsuarioAutenticado correo del usuario si la consulta viene de una
     *                                sesión autenticada, o {@code null} si es un
     *                                invitado (ver ChatbotController).
     */
    public String preguntar(String pregunta, String emailUsuarioAutenticado) {
        // El correo viaja únicamente por ToolContext (nunca por un @ToolParam que
        // el modelo pudiera rellenar): es la única forma en que misFavoritos()/
        // misPromociones() saben quién pregunta, y el LLM no puede verlo ni
        // sobrescribirlo. Siempre se pasa un mapa no vacío (incluso para
        // invitados, con cadena vacía) porque Spring AI exige un ToolContext no
        // vacío apenas una tool declare ese parámetro, o lanza IllegalArgumentException.
        Map<String, Object> toolContext = Map.of(
                UserAccountTools.TOOL_CONTEXT_EMAIL_KEY,
                emailUsuarioAutenticado != null ? emailUsuarioAutenticado : "");

        String respuesta = chatClient
                .prompt()
                .user(pregunta)
                .toolContext(toolContext)
                .call()
                .content();

        if (respuesta == null) {
            respuesta = RESPUESTA_VACIA_FALLBACK;
        }

        User usuario = emailUsuarioAutenticado != null
                ? userRepository.findByEmail(emailUsuarioAutenticado).orElse(null)
                : null;

        ChatConsulta consulta = ChatConsulta.builder()
                .user(usuario)
                .pregunta(pregunta)
                .respuesta(respuesta)
                .build();

        chatConsultaRepository.save(consulta);

        return respuesta;
    }
}
