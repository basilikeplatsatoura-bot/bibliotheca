package db

import (
	"database/sql"
	"errors"
	"library-api/models"
	"strings"
)

var (
	ErrBookNotFound = errors.New("το βιβλίο δεν βρέθηκε")
)

const (
	CatWorldLit    = "Παγκόσμια Λογοτεχνία"
	CatGreekLit    = "Ελληνική Λογοτεχνία"
	CatPoetry      = "Ποίηση"
	CatPhilosophy  = "Φιλοσοφία & Ψυχολογία"
	CatPolitics    = "Πολιτική & Ιστορία"
	CatUnderground = "Underground & Beat"
)

func Initdb(database *sql.DB) error {
	createBooks := `
		CREATE TABLE IF NOT EXISTS books (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			author TEXT NOT NULL,
			total_copies INTEGER NOT NULL DEFAULT 1,
			cover_url TEXT NOT NULL DEFAULT '',
			category TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'want_to_read',
			rating INTEGER NOT NULL DEFAULT 0,
			is_favorite INTEGER NOT NULL DEFAULT 0,
			notes TEXT NOT NULL DEFAULT ''
		);`
	if _, err := database.Exec(createBooks); err != nil {
		return err
	}

	// Safe migrations for existing databases
	migrations := []struct {
		column string
		def    string
	}{
		{"cover_url", "TEXT NOT NULL DEFAULT ''"},
		{"category", "TEXT NOT NULL DEFAULT ''"},
		{"status", "TEXT NOT NULL DEFAULT 'want_to_read'"},
		{"rating", "INTEGER NOT NULL DEFAULT 0"},
		{"is_favorite", "INTEGER NOT NULL DEFAULT 0"},
		{"notes", "TEXT NOT NULL DEFAULT ''"},
	}

	for _, m := range migrations {
		if err := ensureColumn(database, "books", m.column, m.def); err != nil {
			return err
		}
	}

	// Seed default books if empty
	var count int
	if err := database.QueryRow("SELECT COUNT(*) FROM books").Scan(&count); err != nil {
		return err
	}
	if count == 0 {
		_, err := database.Exec(`
		INSERT INTO books (title, author, category, status, rating, is_favorite, notes, cover_url)
		VALUES
		('Post Office', 'Charles Bukowski', ?, 'read', 5, 1, 'Ωμό, αστείο και αφοπλιστικά ειλικρινές.', 'https://covers.openlibrary.org/b/id/8231996-L.jpg'),
		('Foco d''amor', 'Vasilis Vasilikos', ?, 'want_to_read', 0, 0, '', ''),
		('Madame Bovary', 'Gustave Flaubert', ?, 'read', 4, 0, '', 'https://covers.openlibrary.org/b/id/8231856-L.jpg'),
		('Η αγάπη άργησε μια μέρα', 'Λιλή Ζωγράφου', ?, 'read', 5, 1, '', ''),
		('The Dispossessed', 'Ursula K. Le Guin', ?, 'reading', 5, 1, '', 'https://covers.openlibrary.org/b/id/8225261-L.jpg'),
		('Πώς δένεται το ατσάλι', 'Νικολάι Οστρόβσκι', ?, 'want_to_read', 0, 0, '', '');
		`, CatUnderground, CatGreekLit, CatWorldLit, CatGreekLit, CatWorldLit, CatWorldLit)
		if err != nil {
			return err
		}
	}

	// Auto-categorize any existing books that have an empty category
	if err := autoCategorizeExisting(database); err != nil {
		return err
	}

	return nil
}

func ensureColumn(database *sql.DB, table, column, definition string) error {
	rows, err := database.Query(`PRAGMA table_info(` + table + `)`)
	if err != nil {
		return err
	}
	defer rows.Close()

	exists := false
	for rows.Next() {
		var cid int
		var name, colType string
		var notNull int
		var dfltValue sql.NullString
		var pk int
		if err := rows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk); err != nil {
			return err
		}
		if name == column {
			exists = true
			break
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}

	if !exists {
		_, err := database.Exec(`ALTER TABLE ` + table + ` ADD COLUMN ` + column + ` ` + definition)
		return err
	}
	return nil
}

func inferCategory(title, author string) string {
	text := strings.ToLower(title + " " + author)

	// Ποίηση
	poetryKeys := []string{"γώγου", "πολυδούρη", "neruda", "hikmet", "ποιήματα", "σονέτα", "canto general", "θεία κωμωδία", "δάντης"}
	for _, k := range poetryKeys {
		if strings.Contains(text, k) {
			return CatPoetry
		}
	}

	// Underground & Beat
	undergroundKeys := []string{"bukowski", "άσιμος", "σιδηρόπουλος", "pessoa", "limonov"}
	for _, k := range undergroundKeys {
		if strings.Contains(text, k) {
			return CatUnderground
		}
	}

	// Πολιτική & Ιστορία
	politicsKeys := []string{"bakunin", "kropotkin", "malatesta", "marx", "nettlau", "nechayev", "κουφοντίνας", "αναρχί", "επαναστάτη", "ταξικό πόλεμο", "μπρυμαίρ"}
	for _, k := range politicsKeys {
		if strings.Contains(text, k) {
			return CatPolitics
		}
	}

	// Φιλοσοφία & Ψυχολογία
	philosophyKeys := []string{"nietzsche", "ζαρατούστρα", "freud", "ψυχανάλυση", "eco", "σημειολογία", "αυρήλιος", "εις εαυτόν", "marcuse", "ουτοπίας"}
	for _, k := range philosophyKeys {
		if strings.Contains(text, k) {
			return CatPhilosophy
		}
	}

	// Ελληνική Λογοτεχνία
	greekKeys := []string{"βασιλικός", "vasilikos", "ταχτσής", "ζωγράφου", "σαμαράκης", "βαμβουνάκη", "δούκα", "κάραλη", "παπαδοπούλου", "αρμαπάτζογλου"}
	for _, k := range greekKeys {
		if strings.Contains(text, k) {
			return CatGreekLit
		}
	}

	return CatWorldLit
}

func autoCategorizeExisting(database *sql.DB) error {
	rows, err := database.Query(`SELECT id, title, author FROM books WHERE category = '' OR category IS NULL`)
	if err != nil {
		return err
	}
	defer rows.Close()

	type rowItem struct {
		id     int
		title  string
		author string
	}
	var items []rowItem
	for rows.Next() {
		var it rowItem
		if err := rows.Scan(&it.id, &it.title, &it.author); err != nil {
			return err
		}
		items = append(items, it)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	for _, it := range items {
		cat := inferCategory(it.title, it.author)
		if _, err := database.Exec(`UPDATE books SET category = ? WHERE id = ?`, cat, it.id); err != nil {
			return err
		}
	}
	return nil
}

func normalizeStatus(status string) string {
	switch strings.TrimSpace(status) {
	case "reading", "read", "want_to_read":
		return strings.TrimSpace(status)
	default:
		return "want_to_read"
	}
}

func clampRating(rating int) int {
	if rating < 0 {
		return 0
	}
	if rating > 5 {
		return 5
	}
	return rating
}

func AddBook(database *sql.DB, book models.Book) (models.Book, error) {
	category := strings.TrimSpace(book.Category)
	if category == "" {
		category = inferCategory(book.Title, book.Author)
	}
	status := normalizeStatus(book.Status)
	rating := clampRating(book.Rating)
	favInt := 0
	if book.IsFavorite {
		favInt = 1
	}

	query := `
		INSERT INTO books (title, author, total_copies, cover_url, category, status, rating, is_favorite, notes)
		VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
	`
	result, err := database.Exec(
		query,
		book.Title,
		book.Author,
		book.CoverURL,
		category,
		status,
		rating,
		favInt,
		book.Notes,
	)
	if err != nil {
		return models.Book{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.Book{}, err
	}

	book.ID = int(id)
	book.Category = category
	book.Status = status
	book.Rating = rating
	return book, nil
}

func GetBooks(database *sql.DB, search, category, status string, favoriteOnly bool) ([]models.Book, error) {
	query := `
		SELECT id, title, author, category, status, rating, is_favorite, notes, cover_url
		FROM books
		WHERE 1=1
	`
	var args []any

	if trimmed := strings.TrimSpace(search); trimmed != "" {
		like := "%" + trimmed + "%"
		query += ` AND (LOWER(title) LIKE LOWER(?) OR LOWER(author) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?))`
		args = append(args, like, like, like)
	}
	if trimmedCat := strings.TrimSpace(category); trimmedCat != "" {
		query += ` AND category = ?`
		args = append(args, trimmedCat)
	}
	if trimmedStatus := strings.TrimSpace(status); trimmedStatus != "" {
		query += ` AND status = ?`
		args = append(args, trimmedStatus)
	}
	if favoriteOnly {
		query += ` AND is_favorite = 1`
	}

	query += ` ORDER BY id DESC`

	rows, err := database.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	books := make([]models.Book, 0)
	for rows.Next() {
		var b models.Book
		var favInt int
		if err := rows.Scan(
			&b.ID,
			&b.Title,
			&b.Author,
			&b.Category,
			&b.Status,
			&b.Rating,
			&favInt,
			&b.Notes,
			&b.CoverURL,
		); err != nil {
			return nil, err
		}
		b.IsFavorite = favInt == 1
		if b.Category == "" {
			b.Category = CatWorldLit
		}
		b.Status = normalizeStatus(b.Status)
		books = append(books, b)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return books, nil
}

func UpdateBook(database *sql.DB, id int, book models.Book) (models.Book, error) {
	category := strings.TrimSpace(book.Category)
	if category == "" {
		category = inferCategory(book.Title, book.Author)
	}
	status := normalizeStatus(book.Status)
	rating := clampRating(book.Rating)
	favInt := 0
	if book.IsFavorite {
		favInt = 1
	}

	query := `
		UPDATE books
		SET title = ?, author = ?, category = ?, status = ?, rating = ?, is_favorite = ?, notes = ?, cover_url = ?
		WHERE id = ?
	`
	result, err := database.Exec(
		query,
		book.Title,
		book.Author,
		category,
		status,
		rating,
		favInt,
		book.Notes,
		book.CoverURL,
		id,
	)
	if err != nil {
		return models.Book{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.Book{}, err
	}
	if rowsAffected == 0 {
		return models.Book{}, ErrBookNotFound
	}

	book.ID = id
	book.Category = category
	book.Status = status
	book.Rating = rating
	return book, nil
}

func DeleteBook(database *sql.DB, id int) error {
	result, err := database.Exec(`DELETE FROM books WHERE id = ?`, id)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrBookNotFound
	}
	return nil
}

func GetCategories(database *sql.DB) ([]models.CategoryCount, error) {
	rows, err := database.Query(`
		SELECT category, COUNT(*) as cnt
		FROM books
		WHERE category != ''
		GROUP BY category
		ORDER BY cnt DESC, category ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categories := make([]models.CategoryCount, 0)
	for rows.Next() {
		var c models.CategoryCount
		if err := rows.Scan(&c.Name, &c.Count); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return categories, nil
}
