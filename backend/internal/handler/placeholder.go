package handler

import "net/http"

// NotImplemented writes a 501 Not Implemented response.
func NotImplemented(w http.ResponseWriter, r *http.Request) {
	writeError(w, r, http.StatusNotImplemented, "NOT_IMPLEMENTED", "This endpoint is not yet implemented")
}
