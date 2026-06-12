FROM golang:1.26-alpine AS builder
WORKDIR /app
ENV GOCACHE=/app/.cache/go-build
ENV GOTMPDIR=/app/.tmp
RUN mkdir -p /app/.cache/go-build /app/.tmp
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o redirect .

FROM alpine:3.21
RUN apk --no-cache add ca-certificates tzdata
RUN adduser --system --uid 1001 appuser
WORKDIR /app
COPY --from=builder /app/redirect .
USER appuser
EXPOSE 8080
CMD ["./redirect"]
