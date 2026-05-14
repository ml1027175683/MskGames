package controller

import (
	"context"
	"net/http"

	"mskgames-server/internal/model"
)

type MiningService interface {
	Tick(ctx context.Context, userID uint64) (model.MiningRecord, error)
}

type MiningController struct {
	service       MiningService
	defaultUserID uint64
}

func NewMiningController(service MiningService, defaultUserID uint64) MiningController {
	return MiningController{service: service, defaultUserID: defaultUserID}
}

func (controller MiningController) Tick(response http.ResponseWriter, request *http.Request) {
	record, err := controller.service.Tick(request.Context(), controller.defaultUserID)
	if err != nil {
		writeJSON(response, http.StatusInternalServerError, map[string]string{"error": "failed to mine color"})
		return
	}

	writeJSON(response, http.StatusOK, record.Color)
}
