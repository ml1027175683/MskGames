package main

import (
	"log"
	"net/http"

	"mskgames-server/internal/config"
	"mskgames-server/internal/controller"
	"mskgames-server/internal/db"
	"mskgames-server/internal/repository"
	"mskgames-server/internal/router"
	"mskgames-server/internal/service"
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

	healthRepository := repository.NewHealthRepository(database)
	healthService := service.NewHealthService(healthRepository)
	healthController := controller.NewHealthController(healthService)
	miningRepository := repository.NewMiningRepository(database)
	miningService := service.NewMiningService(miningRepository)
	miningController := controller.NewMiningController(miningService, 1)
	inventoryRepository := repository.NewInventoryRepository(database)
	inventoryService := service.NewInventoryService(inventoryRepository)
	inventoryController := controller.NewInventoryController(inventoryService, 1)

	handler := router.NewRouter(router.Dependencies{
		HealthController:    healthController,
		MiningController:    miningController,
		InventoryController: inventoryController,
	})
	address := ":" + appConfig.Server.Port

	log.Printf("server listening on %s", address)
	if err := http.ListenAndServe(address, handler); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}
