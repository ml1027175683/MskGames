package controller

import (
	"context"
	"net/http"

	"mskgames-server/internal/middleware"
	"mskgames-server/internal/model"
)

type InventoryService interface {
	ListColors(ctx context.Context, userID uint64) ([]model.ColorInventoryItem, error)
}

type InventoryController struct {
	service InventoryService
}

func NewInventoryController(service InventoryService, defaultUserID uint64) InventoryController {
	return InventoryController{service: service}
}

func (controller InventoryController) ListColors(response http.ResponseWriter, request *http.Request) {
	userID, ok := middleware.UserIDFromContext(request.Context())
	if !ok {
		writeJSON(response, http.StatusUnauthorized, map[string]string{"error": "login required"})
		return
	}

	items, err := controller.service.ListColors(request.Context(), userID)
	if err != nil {
		writeJSON(response, http.StatusInternalServerError, map[string]string{"error": "failed to list colors"})
		return
	}

	writeJSON(response, http.StatusOK, map[string][]model.ColorInventoryItem{"items": items})
}
