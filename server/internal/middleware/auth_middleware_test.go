package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"mskgames-server/internal/model"
)

type stubSessionAuthenticator struct{}

func (auth stubSessionAuthenticator) Authenticate(ctx context.Context, token string) (model.UserSession, error) {
	return model.UserSession{UserID: 12, Token: token}, nil
}

func TestRequireAuthStoresUserIDInRequestContext(t *testing.T) {
	middleware := NewAuthMiddleware(stubSessionAuthenticator{})
	request := httptest.NewRequest(http.MethodGet, "/protected", nil)
	request.Header.Set("Authorization", "Bearer token-123")
	response := httptest.NewRecorder()

	middleware.RequireAuth(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		userID, ok := UserIDFromContext(request.Context())
		if !ok {
			t.Fatal("expected user id in context")
		}

		if userID != 12 {
			t.Fatalf("expected user id 12, got %d", userID)
		}
	})).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}
}
