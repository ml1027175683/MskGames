package migrations

import (
	"os"
	"strings"
	"testing"
)

func TestCoreMigrationCreatesGameTables(t *testing.T) {
	contents, err := os.ReadFile("001_create_core_tables.sql")
	if err != nil {
		t.Fatalf("failed to read migration: %v", err)
	}

	sql := strings.ToLower(string(contents))
	requiredTables := []string{
		"create table if not exists users",
		"create table if not exists color_inventory",
		"create table if not exists artworks",
		"create table if not exists artwork_pixels",
		"create table if not exists assets",
		"create table if not exists mining_records",
	}

	for _, table := range requiredTables {
		if !strings.Contains(sql, table) {
			t.Fatalf("expected migration to contain %q", table)
		}
	}
}

func TestCoreMigrationEnforcesAssetAndPixelUniqueness(t *testing.T) {
	contents, err := os.ReadFile("001_create_core_tables.sql")
	if err != nil {
		t.Fatalf("failed to read migration: %v", err)
	}

	sql := strings.ToLower(string(contents))
	requiredConstraints := []string{
		"unique key uk_assets_pixel_hash",
		"unique key uk_artwork_pixels_position",
		"unique key uk_color_inventory_user_rgb",
	}

	for _, constraint := range requiredConstraints {
		if !strings.Contains(sql, constraint) {
			t.Fatalf("expected migration to contain %q", constraint)
		}
	}
}
