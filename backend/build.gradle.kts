plugins {
    java
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.cupon"
version = "0.0.1-SNAPSHOT"
description = "Cupon - Marketplace de promociones para restaurantes"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

val mapstructVersion = "1.6.3"
val jjwtVersion = "0.12.6"

dependencies {
    // --- Spring Boot Starters ---
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // --- Flyway ---
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // --- Database ---
    runtimeOnly("org.postgresql:postgresql")

    // --- JWT ---
    implementation("io.jsonwebtoken:jjwt-api:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:$jjwtVersion")

    // --- MapStruct ---
    implementation("org.mapstruct:mapstruct:$mapstructVersion")

    // --- OpenAPI / Swagger ---
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6")

    // --- Lombok ---
    compileOnly("org.projectlombok:lombok")

    // --- Annotation Processors (order matters: Lombok -> binding -> MapStruct) ---
    annotationProcessor("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok-mapstruct-binding:0.2.0")
    annotationProcessor("org.mapstruct:mapstruct-processor:$mapstructVersion")

    // --- DevTools ---
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // --- Test ---
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testCompileOnly("org.projectlombok:lombok")
    testAnnotationProcessor("org.projectlombok:lombok")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
