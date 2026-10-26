package com.cupon.modules.chatbot.advisor;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.AdvisorChain;
import org.springframework.ai.chat.client.advisor.api.BaseAdvisor;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.util.Assert;

/**
 * Variante propia de {@link org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor}
 * necesaria porque el modelo de embeddings (multilingual-e5-small) solo produce
 * similitudes bien calibradas si el texto se prefija según su rol: "query: " para la
 * pregunta y "passage: " para el contenido indexado (ver DocumentService). El
 * QuestionAnswerAdvisor de Spring AI usa el texto de la pregunta tal cual, sin
 * posibilidad de inyectar ese prefijo, así que aquí se reimplementa ese mismo flujo
 * con las dos diferencias necesarias:
 * <ol>
 * <li>Se antepone "query: " a la pregunta antes de buscar en el VectorStore.</li>
 * <li>Se retira el prefijo "passage: " del texto recuperado antes de incluirlo como
 * contexto, para que el LLM no lo vea como parte del contenido real.</li>
 * </ol>
 */
public class KnowledgeBaseAdvisor implements BaseAdvisor {

    private static final String QUERY_PREFIX = "query: ";

    private static final String PASSAGE_PREFIX = "passage: ";

    private static final PromptTemplate DEFAULT_PROMPT_TEMPLATE = new PromptTemplate("""
            {query}

            Información de contexto a continuación, delimitada por ---------------------

            ---------------------
            {question_answer_context}
            ---------------------

            Dado el contexto anterior y no conocimiento previo, responde al comentario
            del usuario. Si la respuesta no está en el contexto, informa al usuario que
            no puedes responder esa pregunta con la información disponible.
            """);

    private static final int DEFAULT_ORDER = 0;

    private final VectorStore vectorStore;

    private final SearchRequest searchRequest;

    private final int order;

    public KnowledgeBaseAdvisor(VectorStore vectorStore, SearchRequest searchRequest) {
        this(vectorStore, searchRequest, DEFAULT_ORDER);
    }

    public KnowledgeBaseAdvisor(VectorStore vectorStore, SearchRequest searchRequest, int order) {
        Assert.notNull(vectorStore, "vectorStore no puede ser null");
        Assert.notNull(searchRequest, "searchRequest no puede ser null");
        this.vectorStore = vectorStore;
        this.searchRequest = searchRequest;
        this.order = order;
    }

    @Override
    public ChatClientRequest before(ChatClientRequest chatClientRequest, AdvisorChain advisorChain) {
        UserMessage userMessage = chatClientRequest.prompt().getUserMessage();
        String preguntaOriginal = userMessage.getText();

        SearchRequest searchRequestToUse = SearchRequest.from(this.searchRequest)
                .query(QUERY_PREFIX + preguntaOriginal)
                .build();

        List<Document> documentosRecuperados = this.vectorStore.similaritySearch(searchRequestToUse);

        String contextoDocumentos = documentosRecuperados.stream()
                .map(Document::getText)
                .map(this::sinPrefijoPassage)
                .collect(Collectors.joining(System.lineSeparator()));

        String preguntaAumentada = DEFAULT_PROMPT_TEMPLATE.render(
                Map.of("query", preguntaOriginal, "question_answer_context", contextoDocumentos));

        return chatClientRequest.mutate()
                .prompt(chatClientRequest.prompt().augmentUserMessage(preguntaAumentada))
                .build();
    }

    @Override
    public ChatClientResponse after(ChatClientResponse chatClientResponse, AdvisorChain advisorChain) {
        return chatClientResponse;
    }

    @Override
    public String getName() {
        return "KnowledgeBaseAdvisor";
    }

    @Override
    public int getOrder() {
        return this.order;
    }

    private String sinPrefijoPassage(String texto) {
        return texto != null && texto.startsWith(PASSAGE_PREFIX)
                ? texto.substring(PASSAGE_PREFIX.length())
                : texto;
    }
}
