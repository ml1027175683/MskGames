package migration

import (
	"context"
	"database/sql"
	"strings"
)

type Executor interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

type Runner struct {
	executor Executor
}

func NewRunner(executor Executor) Runner {
	return Runner{executor: executor}
}

func (runner Runner) Run(ctx context.Context, files []File) error {
	for _, file := range files {
		for _, statement := range splitStatements(file.SQL) {
			if _, err := runner.executor.ExecContext(ctx, statement); err != nil {
				return err
			}
		}
	}

	return nil
}

func splitStatements(sql string) []string {
	rawStatements := strings.Split(sql, ";")
	statements := make([]string, 0, len(rawStatements))

	for _, statement := range rawStatements {
		trimmed := strings.TrimSpace(statement)
		if trimmed == "" {
			continue
		}

		statements = append(statements, trimmed)
	}

	return statements
}
