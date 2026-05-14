package db

import (
	"database/sql"

	_ "github.com/go-sql-driver/mysql"
	"mskgames-server/internal/config"
)

func Open(databaseConfig config.DatabaseConfig) (*sql.DB, error) {
	database, err := sql.Open("mysql", databaseConfig.DSN())
	if err != nil {
		return nil, err
	}

	database.SetMaxOpenConns(databaseConfig.MaxOpenConnections)
	database.SetMaxIdleConns(databaseConfig.MaxIdleConnections)

	return database, nil
}
