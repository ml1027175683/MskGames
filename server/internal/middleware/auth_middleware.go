package middleware

import (
	"context"
	"net/http"
	"strings"

	"mskgames-server/internal/model"
)

type contextKey string

const userIDContextKey contextKey = "userID"

type SessionAuthenticator interface {
	Authenticate(ctx context.Context, token string) (model.UserSession, error)
}

type AuthMiddleware struct {
	authenticator SessionAuthenticator
}

func NewAuthMiddleware(authenticator SessionAuthenticator) AuthMiddleware {
	return AuthMiddleware{authenticator: authenticator}
}

func (middleware AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		token := bearerToken(request.Header.Get("Authorization"))
		if token == "" {
			http.Error(response, "missing authorization token", http.StatusUnauthorized)
			return
		}

		session, err := middleware.authenticator.Authenticate(request.Context(), token)
		if err != nil {
			http.Error(response, "invalid authorization token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(request.Context(), userIDContextKey, session.UserID)
		next.ServeHTTP(response, request.WithContext(ctx))
	})
}

func UserIDFromContext(ctx context.Context) (uint64, bool) {
	userID, ok := ctx.Value(userIDContextKey).(uint64)
	return userID, ok
}

func ContextWithUserID(ctx context.Context, userID uint64) context.Context {
	return context.WithValue(ctx, userIDContextKey, userID)
}

func bearerToken(header string) string {
	if !strings.HasPrefix(header, "Bearer ") {
		return ""
	}

	return strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
}
