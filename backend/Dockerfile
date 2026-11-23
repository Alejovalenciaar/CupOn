# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml ./
# Download dependencies first (cached layer)
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Run with JRE
# NOTA: no se usa la variante -alpine. Las librerías nativas del motor de
# embeddings locales (DJL/PyTorch, para Spring AI Transformers) están
# compiladas contra glibc y fallan en Alpine (musl libc) con
# "Error loading shared library libstdc++.so.6" al no existir una variante
# musl de esas librerías nativas.
FROM eclipse-temurin:21-jre
WORKDIR /app

# Create non-root user
RUN groupadd -r cupon && useradd -r -g cupon cupon
USER cupon

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
