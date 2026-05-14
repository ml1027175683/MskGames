package migration

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadFilesReturnsSQLFilesInNameOrder(t *testing.T) {
	directory := t.TempDir()
	writeFile(t, directory, "002_second.sql", "SELECT 2;")
	writeFile(t, directory, "001_first.sql", "SELECT 1;")
	writeFile(t, directory, "README.md", "ignore me")

	files, err := LoadFiles(directory)
	if err != nil {
		t.Fatalf("LoadFiles returned error: %v", err)
	}

	if len(files) != 2 {
		t.Fatalf("expected 2 sql files, got %d", len(files))
	}

	if files[0].Name != "001_first.sql" {
		t.Fatalf("expected first file to be 001_first.sql, got %q", files[0].Name)
	}

	if files[0].SQL != "SELECT 1;" {
		t.Fatalf("expected first SQL to be SELECT 1;, got %q", files[0].SQL)
	}

	if files[1].Name != "002_second.sql" {
		t.Fatalf("expected second file to be 002_second.sql, got %q", files[1].Name)
	}
}

func writeFile(t *testing.T, directory string, name string, contents string) {
	t.Helper()

	path := filepath.Join(directory, name)
	if err := os.WriteFile(path, []byte(contents), 0644); err != nil {
		t.Fatalf("failed to write %s: %v", name, err)
	}
}
