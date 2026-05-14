package migration

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type File struct {
	Name string
	SQL  string
}

func LoadFiles(directory string) ([]File, error) {
	entries, err := os.ReadDir(directory)
	if err != nil {
		return nil, err
	}

	sort.Slice(entries, func(left int, right int) bool {
		return entries[left].Name() < entries[right].Name()
	})

	files := make([]File, 0)
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		contents, err := os.ReadFile(filepath.Join(directory, entry.Name()))
		if err != nil {
			return nil, err
		}

		files = append(files, File{Name: entry.Name(), SQL: string(contents)})
	}

	return files, nil
}
