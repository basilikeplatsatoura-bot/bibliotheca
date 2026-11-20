package db

import (
	"database/sql"
	"errors"
	"library-api/models"
	"testing"

	_ "modernc.org/sqlite"
)

func setupTestDB(t *testing.T) *sql.DB {
	t.Helper()
	database, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("failed to open in-memory db: %v", err)
	}
	t.Cleanup(func() { database.Close() })

	if err := Initdb(database); err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	return database
}

func TestPersonalLibraryCRUDAndFilters(t *testing.T) {
	database := setupTestDB(t)

	// Add book with rating, favorite, and reading comment
	created, err := AddBook(database, models.Book{
		Title:      "Το Τρίτο Στεφάνι",
		Author:     "Κώστας Ταχτσής",
		Category:   CatGreekLit,
		Status:     "read",
		Rating:     5,
		IsFavorite: true,
		Notes:      "Εξαιρετική αφήγηση, ζωντανοί χαρακτήρες.",
		CoverURL:   "https://example.com/cover.jpg",
	})
	if err != nil {
		t.Fatalf("AddBook failed: %v", err)
	}
	if created.ID == 0 || created.Rating != 5 || !created.IsFavorite || created.Category != CatGreekLit {
		t.Fatalf("unexpected created book: %+v", created)
	}

	// Filter by category and favorite
	results, err := GetBooks(database, "", CatGreekLit, "read", true)
	if err != nil {
		t.Fatalf("GetBooks filter failed: %v", err)
	}
	found := false
	for _, b := range results {
		if b.ID == created.ID && b.Notes == "Εξαιρετική αφήγηση, ζωντανοί χαρακτήρες." {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected created book in filtered results, got %+v", results)
	}

	// Update rating & notes
	created.Rating = 4
	created.Notes = "Δεύτερη ανάγνωση, ακόμα πιο δυνατό."
	updated, err := UpdateBook(database, created.ID, created)
	if err != nil {
		t.Fatalf("UpdateBook failed: %v", err)
	}
	if updated.Rating != 4 || updated.Notes != "Δεύτερη ανάγνωση, ακόμα πιο δυνατό." {
		t.Fatalf("unexpected updated book: %+v", updated)
	}

	// Categories count
	cats, err := GetCategories(database)
	if err != nil || len(cats) == 0 {
		t.Fatalf("GetCategories failed: %v (len=%d)", err, len(cats))
	}

	// Delete book
	if err := DeleteBook(database, created.ID); err != nil {
		t.Fatalf("DeleteBook failed: %v", err)
	}
	if err := DeleteBook(database, created.ID); !errors.Is(err, ErrBookNotFound) {
		t.Fatalf("expected ErrBookNotFound on second delete, got %v", err)
	}
}
