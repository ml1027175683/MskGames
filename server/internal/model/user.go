package model

import "time"

type User struct {
	ID           uint64 `json:"id"`
	Username     string `json:"username"`
	DisplayName  string `json:"displayName"`
	PasswordHash string `json:"-"`
}

type UserSession struct {
	UserID    uint64
	Token     string
	ExpiresAt time.Time
}
