package service

import (
	"context"
	"testing"

	"mskgames-server/internal/model"
)

type recordingAuthRepository struct {
	createdUser model.User
	user        model.User
	session     model.UserSession
}

func (repository *recordingAuthRepository) CreateUser(ctx context.Context, user model.User) (model.User, error) {
	repository.createdUser = user
	user.ID = 7
	return user, nil
}

func (repository *recordingAuthRepository) FindUserByUsername(ctx context.Context, username string) (model.User, error) {
	return repository.user, nil
}

func (repository *recordingAuthRepository) CreateSession(ctx context.Context, session model.UserSession) (model.UserSession, error) {
	repository.session = session
	return session, nil
}

func (repository *recordingAuthRepository) FindSessionByToken(ctx context.Context, token string) (model.UserSession, error) {
	return repository.session, nil
}

func TestAuthServiceRegisterHashesPasswordAndCreatesSession(t *testing.T) {
	repository := &recordingAuthRepository{}
	service := NewAuthService(repository)

	result, err := service.Register(context.Background(), RegisterInput{Username: "alice", DisplayName: "Alice", Password: "secret123"})
	if err != nil {
		t.Fatalf("Register returned error: %v", err)
	}

	if result.Token == "" {
		t.Fatal("expected token to be generated")
	}

	if repository.createdUser.PasswordHash == "secret123" {
		t.Fatal("expected password to be hashed")
	}

	if repository.session.UserID != 7 {
		t.Fatalf("expected session user id 7, got %d", repository.session.UserID)
	}
}

func TestAuthServiceLoginReturnsSessionForValidPassword(t *testing.T) {
	repository := &recordingAuthRepository{}
	service := NewAuthService(repository)
	registered, err := service.Register(context.Background(), RegisterInput{Username: "alice", DisplayName: "Alice", Password: "secret123"})
	if err != nil {
		t.Fatalf("Register returned error: %v", err)
	}
	repository.user = model.User{ID: registered.User.ID, Username: "alice", DisplayName: "Alice", PasswordHash: repository.createdUser.PasswordHash}

	loggedIn, err := service.Login(context.Background(), LoginInput{Username: "alice", Password: "secret123"})
	if err != nil {
		t.Fatalf("Login returned error: %v", err)
	}

	if loggedIn.Token == "" {
		t.Fatal("expected login token")
	}

	if loggedIn.User.Username != "alice" {
		t.Fatalf("expected alice, got %q", loggedIn.User.Username)
	}
}
