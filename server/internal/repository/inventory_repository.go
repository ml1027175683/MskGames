package repository

import (
	"context"
	"database/sql"

	"mskgames-server/internal/model"
)

type InventoryRepository struct {
	database *sql.DB
}

func NewInventoryRepository(database *sql.DB) InventoryRepository {
	return InventoryRepository{database: database}
}

func (repository InventoryRepository) ListColors(ctx context.Context, userID uint64) ([]model.ColorInventoryItem, error) {
	rows, err := repository.database.QueryContext(ctx, `
SELECT red_value, green_value, blue_value, rarity, quantity
FROM color_inventory
WHERE user_id = ?
ORDER BY updated_at DESC, id DESC
`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.ColorInventoryItem, 0)
	for rows.Next() {
		var item model.ColorInventoryItem
		if err := rows.Scan(&item.Color.Red, &item.Color.Green, &item.Color.Blue, &item.Color.Rarity, &item.Quantity); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, rows.Err()
}
