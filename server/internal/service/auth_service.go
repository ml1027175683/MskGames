package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"mskgames-server/internal/model"
)

type AuthRepository interface {
	CreateUser(ctx context.Context, user model.User) (model.User, error)
	FindUserByUsername(ctx context.Context, username string) (model.User, error)
	CreateSession(ctx context.Context, session model.UserSession) (model.UserSession, error)
	FindSessionByToken(ctx context.Context, token string) (model.UserSession, error)
}

type RegisterInput struct {
	Username    string
	DisplayName string
	Password    string
}

type LoginInput struct {
	Username string
	Password string
}

type AuthResult struct {
	User  model.User `json:"user"`
	Token string     `json:"token"`
}

type AuthService struct {
	repository AuthRepository
}

func NewAuthService(repository AuthRepository) AuthService {
	return AuthService{repository: repository}
}

func (service AuthService) Register(ctx context.Context, input RegisterInput) (AuthResult, error) {
	username := strings.TrimSpace(input.Username)
	displayName := strings.TrimSpace(input.DisplayName)
	if displayName == "" {
		displayName = username
	}

	if username == "" || len(input.Password) < 6 {
		return AuthResult{}, errors.New("invalid registration input")
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return AuthResult{}, err
	}

	user, err := service.repository.CreateUser(ctx, model.User{Username: username, DisplayName: displayName, PasswordHash: string(passwordHash)})
	if err != nil {
		return AuthResult{}, err
	}

	return service.createAuthResult(ctx, user)
}

func (service AuthService) Login(ctx context.Context, input LoginInput) (AuthResult, error) {
	user, err := service.repository.FindUserByUsername(ctx, strings.TrimSpace(input.Username))
	if err != nil {
		return AuthResult{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return AuthResult{}, errors.New("invalid credentials")
	}

	return service.createAuthResult(ctx, user)
}

func (service AuthService) Authenticate(ctx context.Context, token string) (model.UserSession, error) {
	session, err := service.repository.FindSessionByToken(ctx, token)
	if err != nil {
		return model.UserSession{}, err
	}

	if time.Now().After(session.ExpiresAt) {
		return model.UserSession{}, errors.New("session expired")
	}

	return session, nil
}

func (service AuthService) createAuthResult(ctx context.Context, user model.User) (AuthResult, error) {
	token, err := generateToken()
	if err != nil {
		return AuthResult{}, err
	}

	session, err := service.repository.CreateSession(ctx, model.UserSession{UserID: user.ID, Token: token, ExpiresAt: time.Now().Add(30 * 24 * time.Hour)})
	if err != nil {
		return AuthResult{}, err
	}

	return AuthResult{User: user, Token: session.Token}, nil
}

func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}
