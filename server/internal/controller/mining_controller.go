package controller

import (
	"context"
	"net/http"

	"mskgames-server/internal/middleware"
	"mskgames-server/internal/model"
)

type MiningService interface {
	Tick(ctx context.Context, userID uint64) (model.MiningRecord, error)
}

type MiningController struct {
	service MiningService
}

func NewMiningController(service MiningService, defaultUserID uint64) MiningController {
	return MiningController{service: service}
}

func (controller MiningController) Tick(response http.ResponseWriter, request *http.Request) {
	userID, ok := middleware.UserIDFromContext(request.Context())
	if !ok {
		writeJSON(response, http.StatusUnauthorized, map[string]string{"error": "login required"})
		return
	}

	record, err := controller.service.Tick(request.Context(), userID)
	if err != nil {
		writeJSON(response, http.StatusInternalServerError, map[string]string{"error": "failed to mine color"})
		return
	}

	writeJSON(response, http.StatusOK, record.Color)
}
