package handler

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/url-shortener/redirect/internal/cache"
	"github.com/url-shortener/redirect/internal/geo"
	"github.com/url-shortener/redirect/internal/repository"
)

var bangkokLoc = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		log.Printf("warn: could not load Asia/Bangkok timezone, falling back to UTC+7: %v", err)
		return time.FixedZone("ICT", 7*60*60)
	}
	return loc
}()

type RedirectHandler struct {
	repo   *repository.URLRepository
	cache  *cache.RedisCache
	geo    *geo.Reader
	appURL string // base URL of the web app, e.g. https://example.com
}

func NewRedirectHandler(repo *repository.URLRepository, cache *cache.RedisCache, geo *geo.Reader, appURL string) *RedirectHandler {
	return &RedirectHandler{repo: repo, cache: cache, geo: geo, appURL: appURL}
}

func (h *RedirectHandler) Redirect(c *gin.Context) {
	code := c.Param("code")
	ctx := c.Request.Context()

	// 1. Try cache first
	cached, found, err := h.cache.GetURL(ctx, code)
	if err != nil {
		log.Printf("cache error for %s: %v", code, err)
	}

	if found {
		if cached == nil {
			h.errorRedirect(c, "not_found")
			return
		}
		if reason := h.invalidReason(cached.IsActive, cached.ExpiresAt); reason != "" {
			h.errorRedirect(c, reason)
			return
		}
		h.recordClick(c, cached.ID)
		c.Header("Cache-Control", "no-store")
		c.Redirect(http.StatusFound, cached.OriginalURL)
		return
	}

	// 2. Fallback to DB
	url, err := h.repo.FindByShortCode(ctx, code)
	if err == sql.ErrNoRows {
		_ = h.cache.SetNotFound(ctx, code)
		h.errorRedirect(c, "not_found")
		return
	}
	if err != nil {
		log.Printf("db error for %s: %v", code, err)
		h.errorRedirect(c, "error")
		return
	}

	if reason := h.invalidReason(url.IsActive, url.ExpiresAt); reason != "" {
		_ = h.cache.SetNotFound(ctx, code)
		h.errorRedirect(c, reason)
		return
	}

	// Populate cache
	_ = h.cache.SetURL(ctx, code, &cache.CachedURL{
		ID:          url.ID,
		OriginalURL: url.OriginalURL,
		ExpiresAt:   url.ExpiresAt,
		IsActive:    url.IsActive,
	})

	h.recordClick(c, url.ID)
	c.Header("Cache-Control", "no-store")
	c.Redirect(http.StatusFound, url.OriginalURL)
}

// invalidReason returns "" if the URL is valid, or a reason string if not.
func (h *RedirectHandler) invalidReason(isActive bool, expiresAt *time.Time) string {
	if !isActive {
		return "inactive"
	}
	if expiresAt != nil && time.Now().UTC().After(*expiresAt) {
		return "expired"
	}
	return ""
}

// errorRedirect sends the user to the web app error page, or falls back to a plain status code.
func (h *RedirectHandler) errorRedirect(c *gin.Context, reason string) {
	if h.appURL != "" {
		c.Redirect(http.StatusFound, h.appURL+"/link-error?reason="+reason)
		return
	}
	switch reason {
	case "not_found":
		c.Status(http.StatusNotFound)
	case "inactive", "expired":
		c.Status(http.StatusGone)
	default:
		c.Status(http.StatusInternalServerError)
	}
}

func (h *RedirectHandler) recordClick(c *gin.Context, urlID string) {
	ip := c.ClientIP()
	ua := c.Request.UserAgent()
	referer := c.Request.Referer()
	country := h.geo.Lookup(ip)
	log.Printf("click: ip=%s country=%q", ip, country)
	clickedAt := time.Now().In(bangkokLoc)
	go func() {
		if err := h.repo.IncrementClick(context.Background(), urlID, clickedAt, ip, ua, referer, country); err != nil {
			log.Printf("click record error: %v", err)
		}
	}()
}
