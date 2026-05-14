package router

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"mskgames-server/internal/controller"
	"mskgames-server/internal/model"
)

type stubHealthService struct{}

func (service stubHealthService) CheckDatabase() error {
	return nil
}

type stubMiningService struct{}

func (service stubMiningService) Tick(ctx context.Context, userID uint64) (model.MiningRecord, error) {
	return model.MiningRecord{UserID: userID, Color: model.Color{Red: 255, Green: 0, Blue: 0, Rarity: "legendary"}}, nil
}

type stubInventoryService struct{}

func (service stubInventoryService) ListColors(ctx context.Context, userID uint64) ([]model.ColorInventoryItem, error) {
	return []model.ColorInventoryItem{{Color: model.Color{Red: 255, Green: 0, Blue: 0, Rarity: "legendary"}, Quantity: 1}}, nil
}

func TestNewRouterRegistersHealthRoutes(t *testing.T) {
	healthController := controller.NewHealthController(stubHealthService{})
	miningController := controller.NewMiningController(stubMiningService{}, 1)
	inventoryController := controller.NewInventoryController(stubInventoryService{}, 1)
	router := NewRouter(Dependencies{
		HealthController:    healthController,
		MiningController:    miningController,
		InventoryController: inventoryController,
	})

	for _, path := range []string{"/health", "/health/db"} {
		request := httptest.NewRequest(http.MethodGet, path, nil)
		response := httptest.NewRecorder()

		router.ServeHTTP(response, request)

		if response.Code != http.StatusOK {
			t.Fatalf("expected %s to return status 200, got %d", path, response.Code)
		}
	}
}

func TestNewRouterRegistersGameAPIRoutes(t *testing.T) {
	healthController := controller.NewHealthController(stubHealthService{})
	miningController := controller.NewMiningController(stubMiningService{}, 1)
	inventoryController := controller.NewInventoryController(stubInventoryService{}, 1)
	router := NewRouter(Dependencies{
		HealthController:    healthController,
		MiningController:    miningController,
		InventoryController: inventoryController,
	})

	tests := []struct {
		method string
		path   string
	}{
		{method: http.MethodPost, path: "/api/v1/mining/tick"},
		{method: http.MethodGet, path: "/api/v1/inventory/colors"},
	}

	for _, test := range tests {
		request := httptest.NewRequest(test.method, test.path, nil)
		response := httptest.NewRecorder()

		router.ServeHTTP(response, request)

		if response.Code != http.StatusOK {
			t.Fatalf("expected %s %s to return status 200, got %d", test.method, test.path, response.Code)
		}
	}
}
