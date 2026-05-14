package repository

import "database/sql"

type HealthRepository struct {
	database *sql.DB
}

func NewHealthRepository(database *sql.DB) HealthRepository {
	return HealthRepository{database: database}
}

func (repository HealthRepository) Ping() error {
	return repository.database.Ping()
}
