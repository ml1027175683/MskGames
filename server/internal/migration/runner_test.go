package migration

import (
	"context"
	"database/sql"
	"testing"
)

type recordingExecutor struct {
	executed []string
}

func (executor *recordingExecutor) ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error) {
	executor.executed = append(executor.executed, query)
	return nil, nil
}

func TestRunnerExecutesLoadedFilesInOrder(t *testing.T) {
	executor := &recordingExecutor{}
	runner := NewRunner(executor)
	files := []File{
		{Name: "001_first.sql", SQL: "SELECT 1;"},
		{Name: "002_second.sql", SQL: "SELECT 2;"},
	}

	if err := runner.Run(context.Background(), files); err != nil {
		t.Fatalf("Run returned error: %v", err)
	}

	if len(executor.executed) != 2 {
		t.Fatalf("expected 2 executed statements, got %d", len(executor.executed))
	}

	if executor.executed[0] != "SELECT 1;" {
		t.Fatalf("expected first statement SELECT 1;, got %q", executor.executed[0])
	}

	if executor.executed[1] != "SELECT 2;" {
		t.Fatalf("expected second statement SELECT 2;, got %q", executor.executed[1])
	}
}
