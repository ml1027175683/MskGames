package controller

import (
	"context"
	"net/http"

	"mskgames-server/internal/model"
)

type InventoryService interface {
	ListColors(ctx context.Context, userID uint64) ([]model.ColorInventoryItem, error)
}

type InventoryController struct {
	service       InventoryService
	defaultUserID uint64
}

func NewInventoryController(service InventoryService, defaultUserID uint64) InventoryController {
	return InventoryController{service: service, defaultUserID: defaultUserID}
}

func (controller InventoryController) ListColors(response http.ResponseWriter, request *http.Request) {
	items, err := controller.service.ListColors(request.Context(), controller.defaultUserID)
	if err != nil {
		writeJSON(response, http.StatusInternalServerError, map[string]string{"error": "failed to list colors"})
		return
	}

	writeJSON(response, http.StatusOK, map[string][]model.ColorInventoryItem{"items": items})
}
