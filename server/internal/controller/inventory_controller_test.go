package controller

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"mskgames-server/internal/middleware"
	"mskgames-server/internal/model"
)

type stubInventoryService struct{}

func (service stubInventoryService) ListColors(ctx context.Context, userID uint64) ([]model.ColorInventoryItem, error) {
	return []model.ColorInventoryItem{
		{Color: model.Color{Red: 255, Green: 0, Blue: 0, Rarity: "legendary"}, Quantity: 3},
	}, nil
}

func TestInventoryControllerListColorsReturnsInventory(t *testing.T) {
	controller := NewInventoryController(stubInventoryService{}, 1)
	request := httptest.NewRequest(http.MethodGet, "/api/v1/inventory/colors", nil)
	request = request.WithContext(middleware.ContextWithUserID(request.Context(), 1))
	response := httptest.NewRecorder()

	controller.ListColors(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}

	body := response.Body.String()
	for _, expected := range []string{`"red":255`, `"quantity":3`} {
		if !strings.Contains(body, expected) {
			t.Fatalf("expected response to contain %s, got %s", expected, body)
		}
	}
}
