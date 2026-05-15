package router

import (
	"net/http"

	"mskgames-server/internal/controller"
	"mskgames-server/internal/middleware"
)

type Dependencies struct {
	HealthController    controller.HealthController
	AuthController      controller.AuthController
	AuthMiddleware      middleware.AuthMiddleware
	MiningController    controller.MiningController
	InventoryController controller.InventoryController
}

func NewRouter(dependencies Dependencies) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", dependencies.HealthController.Health)
	mux.HandleFunc("GET /health/db", dependencies.HealthController.Database)
	mux.HandleFunc("POST /api/v1/auth/register", dependencies.AuthController.Register)
	mux.HandleFunc("POST /api/v1/auth/login", dependencies.AuthController.Login)
	mux.Handle("POST /api/v1/mining/tick", dependencies.AuthMiddleware.RequireAuth(http.HandlerFunc(dependencies.MiningController.Tick)))
	mux.Handle("GET /api/v1/inventory/colors", dependencies.AuthMiddleware.RequireAuth(http.HandlerFunc(dependencies.InventoryController.ListColors)))

	return mux
}
