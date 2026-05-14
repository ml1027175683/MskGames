package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type stubHealthService struct {
	databaseHealthy bool
	databaseError   error
}

func (service stubHealthService) CheckDatabase() error {
	if service.databaseHealthy {
		return nil
	}

	return service.databaseError
}

func TestHealthControllerReturnsOK(t *testing.T) {
	controller := NewHealthController(stubHealthService{databaseHealthy: true})
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	response := httptest.NewRecorder()

	controller.Health(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}

	if !strings.Contains(response.Body.String(), `"status":"ok"`) {
		t.Fatalf("expected ok status body, got %s", response.Body.String())
	}
}

func TestHealthControllerReturnsDatabaseOK(t *testing.T) {
	controller := NewHealthController(stubHealthService{databaseHealthy: true})
	request := httptest.NewRequest(http.MethodGet, "/health/db", nil)
	response := httptest.NewRecorder()

	controller.Database(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}

	if !strings.Contains(response.Body.String(), `"database":"ok"`) {
		t.Fatalf("expected database ok body, got %s", response.Body.String())
	}
}
