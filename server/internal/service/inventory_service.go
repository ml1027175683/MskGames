package service

import (
	"context"

	"mskgames-server/internal/model"
)

type InventoryRepository interface {
	ListColors(ctx context.Context, userID uint64) ([]model.ColorInventoryItem, error)
}

type InventoryService struct {
	repository InventoryRepository
}

func NewInventoryService(repository InventoryRepository) InventoryService {
	return InventoryService{repository: repository}
}

func (service InventoryService) ListColors(ctx context.Context, userID uint64) ([]model.ColorInventoryItem, error) {
	return service.repository.ListColors(ctx, userID)
}
