package repository

import (
	"context"
	"database/sql"
	"time"
)

type URL struct {
	ID          string
	ShortCode   string
	OriginalURL string
	ExpiresAt   *time.Time
	IsActive    bool
}

type URLRepository struct {
	db *sql.DB
}

func NewURLRepository(db *sql.DB) *URLRepository {
	return &URLRepository{db: db}
}

func (r *URLRepository) FindByShortCode(ctx context.Context, code string) (*URL, error) {
	query := "SELECT id, short_code, original_url, expires_at, is_active FROM `shorturl-url` WHERE short_code = ? AND is_active = 1"
	row := r.db.QueryRowContext(ctx, query, code)

	var u URL
	var expiresAt sql.NullTime
	err := row.Scan(&u.ID, &u.ShortCode, &u.OriginalURL, &expiresAt, &u.IsActive)
	if err != nil {
		return nil, err
	}
	if expiresAt.Valid {
		u.ExpiresAt = &expiresAt.Time
	}
	return &u, nil
}

func (r *URLRepository) IncrementClick(ctx context.Context, urlID string, clickedAt time.Time, ip, userAgent, referer, country string) error {
	query := "INSERT INTO `shorturl-click` (url_id, clicked_at, ip_address, user_agent, referer, country) VALUES (?, ?, ?, ?, ?, ?)"
	_, err := r.db.ExecContext(ctx, query, urlID, clickedAt, ip, userAgent, referer, country)
	return err
}
