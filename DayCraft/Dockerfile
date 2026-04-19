FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine AS runner
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata
RUN addgroup -S tempo && adduser -S tempo -G tempo
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
RUN chown tempo:tempo app.jar
USER tempo
EXPOSE 8080
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom -Dfile.encoding=UTF-8 -Duser.timezone=Asia/Shanghai"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
