package controller

import (
	"encoding/json"
	"net/http"
)

type HealthService interface {
	CheckDatabase() error
}

type HealthController struct {
	service HealthService
}

func NewHealthController(service HealthService) HealthController {
	return HealthController{service: service}
}

func (controller HealthController) Health(response http.ResponseWriter, request *http.Request) {
	writeJSON(response, http.StatusOK, map[string]string{"status": "ok"})
}

func (controller HealthController) Database(response http.ResponseWriter, request *http.Request) {
	if err := controller.service.CheckDatabase(); err != nil {
		writeJSON(response, http.StatusServiceUnavailable, map[string]string{"database": "error"})
		return
	}

	writeJSON(response, http.StatusOK, map[string]string{"database": "ok"})
}

func writeJSON(response http.ResponseWriter, statusCode int, body any) {
	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(statusCode)
	_ = json.NewEncoder(response).Encode(body)
}
