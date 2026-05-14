package main

import (
	"context"
	"log"

	"mskgames-server/internal/config"
	"mskgames-server/internal/db"
	"mskgames-server/internal/migration"
)

func main() {
	appConfig, err := config.Load("config/app.yaml")
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	database, err := db.Open(appConfig.Database)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	files, err := migration.LoadFiles("migrations")
	if err != nil {
		log.Fatalf("failed to load migrations: %v", err)
	}

	runner := migration.NewRunner(database)
	if err := runner.Run(context.Background(), files); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	log.Printf("applied %d migration files", len(files))
}
