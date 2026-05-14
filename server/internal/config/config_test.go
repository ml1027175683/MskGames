package config

import "testing"

func TestLoadReadsYamlAndAppliesEnvironmentOverrides(t *testing.T) {
	t.Setenv("MYSQL_PASSWORD", "secret-from-env")

	appConfig, err := Load("../../config/app.example.yaml")
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}

	if appConfig.Server.Port != "8080" {
		t.Fatalf("expected server port 8080, got %q", appConfig.Server.Port)
	}

	if appConfig.Database.Host != "120.77.93.47" {
		t.Fatalf("expected mysql host 120.77.93.47, got %q", appConfig.Database.Host)
	}

	if appConfig.Database.Password != "secret-from-env" {
		t.Fatalf("expected env password override, got %q", appConfig.Database.Password)
	}
}

func TestDatabaseConfigDSN(t *testing.T) {
	databaseConfig := DatabaseConfig{
		Host:         "120.77.93.47",
		Port:         "3306",
		User:         "root",
		Password:     "secret",
		DatabaseName: "rgb_mosaic",
	}

	got := databaseConfig.DSN()
	want := "root:secret@tcp(120.77.93.47:3306)/rgb_mosaic?charset=utf8mb4&parseTime=True&loc=Local"

	if got != want {
		t.Fatalf("expected DSN %q, got %q", want, got)
	}
}
