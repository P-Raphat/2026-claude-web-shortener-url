package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	urlCacheTTL    = 24 * time.Hour
	urlCachePrefix = "url:"
	notFoundValue  = "__not_found__"
)

type RedisCache struct {
	client *redis.Client
}

func NewRedisCache(redisURL string) (*RedisCache, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opts)
	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, err
	}
	return &RedisCache{client: client}, nil
}

type CachedURL struct {
	ID          string     `json:"id"`
	OriginalURL string     `json:"original_url"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	IsActive    bool       `json:"is_active"`
}

func (c *RedisCache) GetURL(ctx context.Context, code string) (*CachedURL, bool, error) {
	val, err := c.client.Get(ctx, urlCachePrefix+code).Result()
	if err == redis.Nil {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}
	if val == notFoundValue {
		return nil, true, nil // cached miss
	}
	var u CachedURL
	if err := json.Unmarshal([]byte(val), &u); err != nil {
		return nil, false, err
	}
	return &u, true, nil
}

func (c *RedisCache) SetURL(ctx context.Context, code string, u *CachedURL) error {
	b, err := json.Marshal(u)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, urlCachePrefix+code, b, urlCacheTTL).Err()
}

func (c *RedisCache) SetNotFound(ctx context.Context, code string) error {
	return c.client.Set(ctx, urlCachePrefix+code, notFoundValue, 5*time.Minute).Err()
}

func (c *RedisCache) InvalidateURL(ctx context.Context, code string) error {
	return c.client.Del(ctx, urlCachePrefix+code).Err()
}
