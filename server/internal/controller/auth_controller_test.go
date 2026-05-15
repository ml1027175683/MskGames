package controller

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"mskgames-server/internal/model"
	"mskgames-server/internal/service"
)

type stubAuthService struct{}

func (auth stubAuthService) Register(ctx context.Context, input service.RegisterInput) (service.AuthResult, error) {
	return service.AuthResult{User: model.User{ID: 9, Username: input.Username, DisplayName: input.DisplayName}, Token: "token-123"}, nil
}

func (auth stubAuthService) Login(ctx context.Context, input service.LoginInput) (service.AuthResult, error) {
	return service.AuthResult{User: model.User{ID: 9, Username: input.Username, DisplayName: "Alice"}, Token: "token-123"}, nil
}

func (auth stubAuthService) Authenticate(ctx context.Context, token string) (model.UserSession, error) {
	return model.UserSession{UserID: 9, Token: token}, nil
}

func TestAuthControllerRegisterReturnsToken(t *testing.T) {
	controller := NewAuthController(stubAuthService{})
	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(`{"username":"alice","displayName":"Alice","password":"secret123"}`))
	response := httptest.NewRecorder()

	controller.Register(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}

	if !strings.Contains(response.Body.String(), `"token":"token-123"`) {
		t.Fatalf("expected token response, got %s", response.Body.String())
	}
}

func TestAuthControllerLoginReturnsToken(t *testing.T) {
	controller := NewAuthController(stubAuthService{})
	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(`{"username":"alice","password":"secret123"}`))
	response := httptest.NewRecorder()

	controller.Login(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}

	if !strings.Contains(response.Body.String(), `"token":"token-123"`) {
		t.Fatalf("expected token response, got %s", response.Body.String())
	}
}
