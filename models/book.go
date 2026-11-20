package models

type Book struct {
	ID         int    `json:"id"`
	Title      string `json:"title"`
	Author     string `json:"author"`
	Category   string `json:"category"`
	Status     string `json:"status"` // "want_to_read", "reading", "read"
	Rating     int    `json:"rating"` // 0..5
	IsFavorite bool   `json:"is_favorite"`
	Notes      string `json:"notes"`
	CoverURL   string `json:"cover_url"`
}

type CategoryCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}
