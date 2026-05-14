package service

import (
	"context"
	"math/rand"

	"mskgames-server/internal/model"
)

type MiningRepository interface {
	SaveMiningResult(ctx context.Context, record model.MiningRecord) error
}

type MiningService struct {
	repository MiningRepository
}

func NewMiningService(repository MiningRepository) MiningService {
	return MiningService{repository: repository}
}

func (service MiningService) Tick(ctx context.Context, userID uint64) (model.MiningRecord, error) {
	color := mineColor()
	record := model.MiningRecord{UserID: userID, Color: color}

	if err := service.repository.SaveMiningResult(ctx, record); err != nil {
		return model.MiningRecord{}, err
	}

	return record, nil
}

func mineColor() model.Color {
	palette := []model.Color{
		{Red: 128, Green: 128, Blue: 128, Rarity: "common"},
		{Red: 46, Green: 204, Blue: 113, Rarity: "uncommon"},
		{Red: 52, Green: 152, Blue: 219, Rarity: "rare"},
		{Red: 155, Green: 89, Blue: 182, Rarity: "refined"},
		{Red: 241, Green: 196, Blue: 15, Rarity: "epic"},
		{Red: 231, Green: 76, Blue: 60, Rarity: "legendary"},
		{Red: 255, Green: 255, Blue: 255, Rarity: "prismatic"},
	}

	return palette[rand.Intn(len(palette))]
}
