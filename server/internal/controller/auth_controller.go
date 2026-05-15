package controller

import (
	"context"
	"encoding/json"
	"net/http"

	"mskgames-server/internal/model"
	"mskgames-server/internal/service"
)

type AuthService interface {
	Register(ctx context.Context, input service.RegisterInput) (service.AuthResult, error)
	Login(ctx context.Context, input service.LoginInput) (service.AuthResult, error)
	Authenticate(ctx context.Context, token string) (model.UserSession, error)
}

type AuthController struct {
	service AuthService
}

func NewAuthController(service AuthService) AuthController {
	return AuthController{service: service}
}

func (controller AuthController) Register(response http.ResponseWriter, request *http.Request) {
	var input service.RegisterInput
	if err := json.NewDecoder(request.Body).Decode(&input); err != nil {
		writeJSON(response, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	result, err := controller.service.Register(request.Context(), input)
	if err != nil {
		writeJSON(response, http.StatusBadRequest, map[string]string{"error": "failed to register"})
		return
	}

	writeJSON(response, http.StatusOK, result)
}

func (controller AuthController) Login(response http.ResponseWriter, request *http.Request) {
	var input service.LoginInput
	if err := json.NewDecoder(request.Body).Decode(&input); err != nil {
		writeJSON(response, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	result, err := controller.service.Login(request.Context(), input)
	if err != nil {
		writeJSON(response, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	writeJSON(response, http.StatusOK, result)
}

func (controller AuthController) Me(response http.ResponseWriter, request *http.Request) {
	writeJSON(response, http.StatusOK, map[string]uint64{"userId": 0})
}
