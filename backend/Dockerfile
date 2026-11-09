# Multi-stage build for small and secure Go binary
FROM golang:1.22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum* ./
RUN go mod download || true

COPY . .

# Compilar binario estático sin CGO
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /bin/api-fact ./cmd/server/main.go
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /bin/api-fact-sandbox ./cmd/sandbox/main.go

# Imagen final mínima basada en Alpine o Scratch
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

COPY --from=builder /bin/api-fact /usr/local/bin/api-fact
COPY --from=builder /bin/api-fact-sandbox /usr/local/bin/api-fact-sandbox
COPY migrations /root/migrations

EXPOSE 8080 8085

CMD ["/usr/local/bin/api-fact"]
