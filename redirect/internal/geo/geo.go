package geo

import (
	"log"
	"net"

	"github.com/oschwald/geoip2-golang"
)

type Reader struct {
	db *geoip2.Reader
}

// Open loads the GeoLite2-Country.mmdb file. Returns a no-op Reader if path is empty or file is missing.
func Open(path string) *Reader {
	if path == "" {
		log.Println("geo: no GEOIP_DB path set, country lookup disabled")
		return &Reader{}
	}
	db, err := geoip2.Open(path)
	if err != nil {
		log.Printf("geo: failed to open %s: %v — country lookup disabled", path, err)
		return &Reader{}
	}
	log.Printf("geo: loaded GeoLite2 database from %s", path)
	return &Reader{db: db}
}

func (r *Reader) Close() {
	if r.db != nil {
		r.db.Close()
	}
}

// Lookup returns the ISO 3166-1 alpha-2 country code for the given IP, or "" on any error.
func (r *Reader) Lookup(ipStr string) string {
	if r.db == nil {
		return ""
	}
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return ""
	}
	record, err := r.db.Country(ip)
	if err != nil {
		return ""
	}
	return record.Country.IsoCode
}
