package repository

import (
	"context"
	"database/sql"

	"mskgames-server/internal/model"
)

type MiningRepository struct {
	database *sql.DB
}

func NewMiningRepository(database *sql.DB) MiningRepository {
	return MiningRepository{database: database}
}

func (repository MiningRepository) SaveMiningResult(ctx context.Context, record model.MiningRecord) error {
	transaction, err := repository.database.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	defer transaction.Rollback()

	if _, err := transaction.ExecContext(ctx, `
INSERT INTO mining_records (user_id, red_value, green_value, blue_value, rarity)
VALUES (?, ?, ?, ?, ?)
`, record.UserID, record.Color.Red, record.Color.Green, record.Color.Blue, record.Color.Rarity); err != nil {
		return err
	}

	if _, err := transaction.ExecContext(ctx, `
INSERT INTO color_inventory (user_id, red_value, green_value, blue_value, rarity, quantity)
VALUES (?, ?, ?, ?, ?, 1)
ON DUPLICATE KEY UPDATE quantity = quantity + 1, rarity = VALUES(rarity)
`, record.UserID, record.Color.Red, record.Color.Green, record.Color.Blue, record.Color.Rarity); err != nil {
		return err
	}

	return transaction.Commit()
}
