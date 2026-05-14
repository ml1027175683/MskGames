package model

type Color struct {
	Red    uint8  `json:"red"`
	Green  uint8  `json:"green"`
	Blue   uint8  `json:"blue"`
	Rarity string `json:"rarity"`
}

type ColorInventoryItem struct {
	Color    Color  `json:"color"`
	Quantity uint32 `json:"quantity"`
}

type MiningRecord struct {
	UserID uint64 `json:"userId"`
	Color  Color  `json:"color"`
}
