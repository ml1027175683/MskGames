package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type AppConfig struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
}

type DatabaseConfig struct {
	Host               string `yaml:"host"`
	Port               string `yaml:"port"`
	User               string `yaml:"user"`
	Password           string `yaml:"password"`
	DatabaseName       string `yaml:"databaseName"`
	MaxOpenConnections int    `yaml:"maxOpenConnections"`
	MaxIdleConnections int    `yaml:"maxIdleConnections"`
}

func Load(path string) (AppConfig, error) {
	contents, err := os.ReadFile(path)
	if err != nil {
		return AppConfig{}, err
	}

	var appConfig AppConfig
	if err := yaml.Unmarshal(contents, &appConfig); err != nil {
		return AppConfig{}, err
	}

	applyEnvironmentOverrides(&appConfig)

	return appConfig, nil
}

func (config DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.User,
		config.Password,
		config.Host,
		config.Port,
		config.DatabaseName,
	)
}

func applyEnvironmentOverrides(appConfig *AppConfig) {
	setStringFromEnv(&appConfig.Server.Port, "SERVER_PORT")
	setStringFromEnv(&appConfig.Database.Host, "MYSQL_HOST")
	setStringFromEnv(&appConfig.Database.Port, "MYSQL_PORT")
	setStringFromEnv(&appConfig.Database.User, "MYSQL_USER")
	setStringFromEnv(&appConfig.Database.Password, "MYSQL_PASSWORD")
	setStringFromEnv(&appConfig.Database.DatabaseName, "MYSQL_DATABASE")
}

func setStringFromEnv(target *string, key string) {
	value := os.Getenv(key)
	if value != "" {
		*target = value
	}
}
