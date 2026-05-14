package migration

import (
	"context"
	"database/sql"
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
		if _, err := runner.executor.ExecContext(ctx, file.SQL); err != nil {
			return err
		}
	}

	return nil
}
