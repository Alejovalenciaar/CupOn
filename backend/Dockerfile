# Stage 1: Build with Gradle
FROM gradle:8-jdk21 AS builder
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle
# Download dependencies first (cached layer)
RUN gradle dependencies --no-daemon || true
COPY src ./src
RUN gradle bootJar --no-daemon -x test

# Stage 2: Run with lightweight JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S cupon && adduser -S cupon -G cupon
USER cupon

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
