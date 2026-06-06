# ── Build Stage ──
FROM golang:alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /build

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/server ./cmd/server

# ── Dev Stage (with hot reload via air) ──
FROM golang:alpine AS dev

RUN go install github.com/air-verse/air@v1.52.3 && \
    go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

WORKDIR /app
COPY go.mod go.sum* ./
RUN apk add --no-cache git && go mod download

COPY . .

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]

# ── Production Stage ──
FROM gcr.io/distroless/static:nonroot AS production

COPY --from=builder /build/server /server

USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/server"]
