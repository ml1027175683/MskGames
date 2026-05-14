package service

import (
	"context"
	"testing"

	"mskgames-server/internal/model"
)

type recordingMiningRepository struct {
	record model.MiningRecord
}

func (repository *recordingMiningRepository) SaveMiningResult(ctx context.Context, record model.MiningRecord) error {
	repository.record = record
	return nil
}

func TestMiningServiceTickGeneratesColorForDefaultUser(t *testing.T) {
	repository := &recordingMiningRepository{}
	service := NewMiningService(repository)

	record, err := service.Tick(context.Background(), 1)
	if err != nil {
		t.Fatalf("Tick returned error: %v", err)
	}

	if record.UserID != 1 {
		t.Fatalf("expected user id 1, got %d", record.UserID)
	}

	if record.Color.Rarity == "" {
		t.Fatal("expected rarity to be set")
	}

	if repository.record.UserID != record.UserID {
		t.Fatalf("expected repository to save user id %d, got %d", record.UserID, repository.record.UserID)
	}
}
