package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/sadaqah/backend/internal/model"
)

func TestWriteJSON(t *testing.T) {
	w := httptest.NewRecorder()
	
	data := map[string]string{"message": "success"}
	writeJSON(w, http.StatusOK, data)
	
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "application/json", w.Header().Get("Content-Type"))
	
	var res map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &res)
	assert.NoError(t, err)
	assert.Equal(t, "success", res["message"])
}

func TestParsePagination(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/?page=2&page_size=50&sort=created_at&order=desc&search=test", nil)
	
	params := parsePagination(req)
	
	assert.Equal(t, 2, params.Page)
	assert.Equal(t, 50, params.PageSize)
	assert.Equal(t, "created_at", params.Sort)
	assert.Equal(t, "desc", params.Order)
	assert.Equal(t, "test", params.Search)
}

func TestParsePaginationDefaults(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	
	params := parsePagination(req)
	
	// Defaults defined in model.DefaultPagination()
	assert.Equal(t, 1, params.Page)
	assert.Equal(t, 20, params.PageSize) // assuming 20 is default
}
