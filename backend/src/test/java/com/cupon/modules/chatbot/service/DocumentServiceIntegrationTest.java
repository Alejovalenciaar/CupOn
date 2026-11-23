package com.cupon.modules.chatbot.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifica que {@link DocumentService} carga correctamente la base de
 * conocimiento (resources/knowledge/*.txt) en el VectorStore al arrancar la
 * aplicación, y que la búsqueda semántica recupera el fragmento correcto.
 *
 * <p>No prueba el servicio de chat (aún no existe, se añade en una fase
 * posterior); esto solo valida la capa de recuperación (retrieval) de RAG.
 */
@SpringBootTest
@ActiveProfiles("test")
class DocumentServiceIntegrationTest {

    @Autowired
    private VectorStore vectorStore;

    @Test
    void recuperaInformacionSobreLaPlataforma() {
        List<Document> resultados = buscar("¿Qué es CupOn?", 2, 0.0);

        assertThat(resultados).isNotEmpty();
        assertThat(contenidoConcatenado(resultados))
                .containsIgnoringCase("directorio")
                .containsIgnoringCase("promociones");
    }

    @Test
    void recuperaInformacionSobreCanjeDeCupones() {
        List<Document> resultados = buscar("¿Cómo canjeo un cupón de descuento?", 2, 0.0);

        assertThat(resultados).isNotEmpty();
        assertThat(contenidoConcatenado(resultados)).containsIgnoringCase("canje");
    }

    @Test
    void recuperaInformacionSobreRecuperacionDeContrasena() {
        // topK=4 (igual al que usará el QuestionAnswerAdvisor en producción): con un
        // corpus tan pequeño, el chunk correcto puede quedar 2º o 3º por una diferencia
        // de score de milésimas frente a otro chunk del mismo dominio (CupOn).
        List<Document> resultados = buscar("Olvidé mi contraseña, ¿qué hago?", 4, 0.0);

        assertThat(resultados).isNotEmpty();
        assertThat(contenidoConcatenado(resultados)).containsIgnoringCase("restablecimiento");
    }

    @Test
    void recuperaFavoritosAntePreguntaFormuladaConPalabrasDistintas() {
        // Pregunta semántica: no usa la palabra "favorito" tal cual aparece en el documento,
        // para confirmar que la búsqueda es por significado y no por coincidencia literal.
        List<Document> resultados = buscar(
                "¿Puedo guardar una promoción que me interesa para no perderla de vista?", 2, 0.0);

        assertThat(resultados).isNotEmpty();
        assertThat(contenidoConcatenado(resultados)).containsIgnoringCase("favorita");
    }

    @Test
    void noDevuelveResultadosRelevantesParaPreguntasFueraDeDominio() {
        // Umbral determinado empíricamente para este modelo (multilingual-e5-small)
        // y este corpus: las 4 preguntas relevantes de este test puntúan 0.78-0.89,
        // mientras que una pregunta totalmente ajena al dominio no supera 0.71. El
        // valor 0.50 sugerido por el taller original no sirve para este modelo: los
        // E5 producen similitudes "altas por defecto" incluso entre textos no
        // relacionados (fenómeno de anisotropía), así que el umbral debe fijarse por
        // el hueco observado, no copiarse de otro proyecto. Revalidar este valor
        // cuando la base de conocimiento real crezca más allá de estos 4 documentos.
        List<Document> resultados = buscar("¿Quién ganó el mundial de fútbol de 1978?", 1, 0.75);

        assertThat(resultados).isEmpty();
    }

    private List<Document> buscar(String query, int topK, double similarityThreshold) {
        // Mismo prefijo "query: " que exige el modelo E5 para el texto indexado
        // ("passage: ", ver DocumentService) — sin él, la similitud no está calibrada.
        SearchRequest request = SearchRequest.builder()
                .query("query: " + query)
                .topK(topK)
                .similarityThreshold(similarityThreshold)
                .build();
        return vectorStore.similaritySearch(request);
    }

    private String contenidoConcatenado(List<Document> documentos) {
        return documentos.stream()
                .map(Document::getText)
                .collect(Collectors.joining(" "));
    }
}
