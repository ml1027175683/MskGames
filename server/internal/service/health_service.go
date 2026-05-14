package service

type HealthRepository interface {
	Ping() error
}

type HealthService struct {
	repository HealthRepository
}

func NewHealthService(repository HealthRepository) HealthService {
	return HealthService{repository: repository}
}

func (service HealthService) CheckDatabase() error {
	return service.repository.Ping()
}
