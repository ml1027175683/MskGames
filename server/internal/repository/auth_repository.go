package repository

import (
	"context"
	"database/sql"

	"mskgames-server/internal/model"
)

type AuthRepository struct {
	database *sql.DB
}

func NewAuthRepository(database *sql.DB) AuthRepository {
	return AuthRepository{database: database}
}

func (repository AuthRepository) CreateUser(ctx context.Context, user model.User) (model.User, error) {
	result, err := repository.database.ExecContext(ctx, `
INSERT INTO users (username, display_name, password_hash)
VALUES (?, ?, ?)
`, user.Username, user.DisplayName, user.PasswordHash)
	if err != nil {
		return model.User{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return model.User{}, err
	}

	user.ID = uint64(id)
	return user, nil
}

func (repository AuthRepository) FindUserByUsername(ctx context.Context, username string) (model.User, error) {
	var user model.User
	err := repository.database.QueryRowContext(ctx, `
SELECT id, username, display_name, password_hash
FROM users
WHERE username = ?
`, username).Scan(&user.ID, &user.Username, &user.DisplayName, &user.PasswordHash)

	return user, err
}

func (repository AuthRepository) CreateSession(ctx context.Context, session model.UserSession) (model.UserSession, error) {
	_, err := repository.database.ExecContext(ctx, `
INSERT INTO user_sessions (user_id, token, expires_at)
VALUES (?, ?, ?)
`, session.UserID, session.Token, session.ExpiresAt)

	return session, err
}

func (repository AuthRepository) FindSessionByToken(ctx context.Context, token string) (model.UserSession, error) {
	var session model.UserSession
	err := repository.database.QueryRowContext(ctx, `
SELECT user_id, token, expires_at
FROM user_sessions
WHERE token = ?
`, token).Scan(&session.UserID, &session.Token, &session.ExpiresAt)

	return session, err
}
