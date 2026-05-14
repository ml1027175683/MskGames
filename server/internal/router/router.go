package router

import (
	"net/http"

	"mskgames-server/internal/controller"
)

type Dependencies struct {
	HealthController    controller.HealthController
	MiningController    controller.MiningController
	InventoryController controller.InventoryController
}

func NewRouter(dependencies Dependencies) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", dependencies.HealthController.Health)
	mux.HandleFunc("GET /health/db", dependencies.HealthController.Database)
	mux.HandleFunc("POST /api/v1/mining/tick", dependencies.MiningController.Tick)
	mux.HandleFunc("GET /api/v1/inventory/colors", dependencies.InventoryController.ListColors)

	return mux
}
