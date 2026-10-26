package com.cupon.modules.chatbot.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.ai.document.Document;
import org.springframework.ai.reader.TextReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Carga la base de conocimiento del chatbot (resources/knowledge/*.txt) en el
 * VectorStore al iniciar la aplicación. Esta base solo contiene información
 * genérica de la plataforma (no promociones, pedidos ni datos de clientes),
 * que se consultan en vivo a través de los servicios existentes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private static final String KNOWLEDGE_LOCATION_PATTERN = "classpath:knowledge/*.txt";
    private static final int CHUNK_SIZE = 300;

    /**
     * Los modelos de la familia E5 (incluido multilingual-e5-small) solo producen
     * similitudes bien calibradas si el texto se prefija según su rol: "passage: "
     * para el contenido indexado y "query: " para la pregunta de búsqueda. Sin este
     * prefijo, textos sin ninguna relación obtienen igualmente una similitud alta
     * (~0.70+), lo que impide filtrar preguntas fuera de dominio por umbral.
     */
    private static final String PASSAGE_PREFIX = "passage: ";

    private final VectorStore vectorStore;

    @PostConstruct
    public void cargarBaseDeConocimiento() throws IOException {
        log.info("Chatbot: cargando base de conocimiento para RAG...");

        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources(KNOWLEDGE_LOCATION_PATTERN);

        if (resources.length == 0) {
            log.warn("Chatbot: no se encontraron documentos en {}", KNOWLEDGE_LOCATION_PATTERN);
            return;
        }

        List<Document> documentos = new ArrayList<>();
        for (Resource resource : resources) {
            log.info("Chatbot: leyendo documento -> {}", resource.getFilename());
            TextReader reader = new TextReader(resource);
            documentos.addAll(reader.get());
        }

        log.info("Chatbot: documentos encontrados: {}", documentos.size());

        TokenTextSplitter splitter = TokenTextSplitter.builder()
                .withChunkSize(CHUNK_SIZE)
                .build();
        List<Document> chunks = splitter.apply(documentos);

        log.info("Chatbot: chunks generados: {}", chunks.size());

        List<Document> chunksConPrefijo = chunks.stream()
                .map(chunk -> chunk.mutate().text(PASSAGE_PREFIX + chunk.getText()).build())
                .collect(Collectors.toList());

        vectorStore.add(chunksConPrefijo);

        log.info("Chatbot: base de conocimiento cargada en el VectorStore.");
    }
}
