package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	"github.com/url-shortener/redirect/internal/cache"
	"github.com/url-shortener/redirect/internal/geo"
	"github.com/url-shortener/redirect/internal/handler"
	"github.com/url-shortener/redirect/internal/middleware"
	"github.com/url-shortener/redirect/internal/repository"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found or error loading: %v", err)
	}

	dbURL := mustEnv("DATABASE_URL")
	redisURL := mustEnv("REDIS_URL")
	port := getEnv("PORT", "8099")

	db, err := sql.Open("mysql", dbURL)
	if err != nil {
		log.Fatalf("db open: %v", err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		log.Fatalf("db ping: %v", err)
	}

	redisCache, err := cache.NewRedisCache(redisURL)
	if err != nil {
		log.Fatalf("redis: %v", err)
	}

	geoReader := geo.Open(getEnv("GEOIP_DB", ""))
	defer geoReader.Close()

	repo := repository.NewURLRepository(db)
	redirectHandler := handler.NewRedirectHandler(repo, redisCache, geoReader, getEnv("APP_URL", ""))

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())

	// Set trusted proxies for X-Forwarded-* headers
	// In production, set TRUSTED_PROXIES env var or this defaults to localhost
	trustedProxies := getEnv("TRUSTED_PROXIES", "127.0.0.1")
	r.SetTrustedProxies([]string{trustedProxies})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	r.GET("/:code", redirectHandler.Redirect)

	log.Printf("redirect service listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("server: %v", err)
	}
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required env var %s is not set", key)
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
