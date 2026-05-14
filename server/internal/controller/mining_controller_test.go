package controller

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"mskgames-server/internal/model"
)

type stubMiningService struct{}

func (service stubMiningService) Tick(ctx context.Context, userID uint64) (model.MiningRecord, error) {
	return model.MiningRecord{
		UserID: userID,
		Color:  model.Color{Red: 255, Green: 0, Blue: 0, Rarity: "legendary"},
	}, nil
}

func TestMiningControllerTickReturnsMinedColor(t *testing.T) {
	controller := NewMiningController(stubMiningService{}, 1)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/mining/tick", nil)
	response := httptest.NewRecorder()

	controller.Tick(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", response.Code)
	}

	body := response.Body.String()
	for _, expected := range []string{`"red":255`, `"green":0`, `"blue":0`, `"rarity":"legendary"`} {
		if !strings.Contains(body, expected) {
			t.Fatalf("expected response to contain %s, got %s", expected, body)
		}
	}
}
