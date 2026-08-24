package db

import (
	"database/sql"
	"fmt"
	"library-api/models"
)

func AddBook(db *sql.DB, title string, author string, totalCopies int) error {
	query := `INSERT INTO books (title, author, total_copies) VALUES (?, ?, ?)`
	_, err := db.Exec(query, title, author, totalCopies)
	if err != nil {
		return err
	}
	return nil
}

func GetBooks(db *sql.DB) ([]models.Book, error) {
	query := `SELECT * FROM books`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var books []models.Book

	for rows.Next() {
		var book models.Book
		if err := rows.Scan(&book.Id, &book.Title, &book.Author, &book.Total_copies); err != nil {
			return nil, err
		}
		books = append(books, book)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return books, nil
}

func Initdb(database *sql.DB) error {
	createBooks := `
		CREATE TABLE IF NOT EXISTS books (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			author TEXT NOT NULL,
			total_copies INTEGER NOT NULL
		);`
	_, err := database.Exec(createBooks)
	if err != nil {
		return err
	}

	createLoans := `
		CREATE TABLE IF NOT EXISTS loans (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_name TEXT NOT NULL,
			book_id INTEGER NOT NULL,
			borrowed_at DATETIME NOT NULL,
			returned_at DATETIME
		);`
	_, err = database.Exec(createLoans)
	if err != nil {
		return err
	}

	var count int
	err = database.QueryRow("SELECT COUNT(*) FROM books").Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		_, err = database.Exec(`
		INSERT INTO books (title, author, total_copies)
		VALUES
		('Post Office', 'Charles Bukowski', 5),
		('Foco d''amor', 'Vasilis Vasilikos', 3),
		('Madame Bovary', 'Gustave Flaubert', 2),
		('Η αγάπη άργησε μια μέρα', 'Λιλή Ζωγράφου', 3),
		('The Dispossessed', 'Ursula K. Le Guin', 4),
		('Πως δένεται το ατσάλι', 'Nikolai Alekseevich Ostrovsky', 2);
	`)
		if err != nil {
			return err
		}
	}

	return nil
}

func BorrowBook(db *sql.DB, userName string, bookID int) error {
	var totalCopies int

	err := db.QueryRow(`
		SELECT total_copies
		FROM books
		WHERE id = ?
	`, bookID).Scan(&totalCopies)

	if err != nil {
		return err
	}

	var borrowedCopies int

	err = db.QueryRow(`
		SELECT COUNT(*)
		FROM loans
		WHERE book_id = ? AND returned_at IS NULL
	`, bookID).Scan(&borrowedCopies)

	if err != nil {
		return err
	}

	if borrowedCopies >= totalCopies {
		return fmt.Errorf("δεν υπάρχουν διαθέσιμα αντίτυπα")
	}

	_, err = db.Exec(`
		INSERT INTO loans (user_name, book_id, borrowed_at)
		VALUES (?, ?, CURRENT_TIMESTAMP)
	`, userName, bookID)

	if err != nil {
		return err
	}

	return nil
}

func ReturnBook(db *sql.DB, loanID int, userName string) error {
	result, err := db.Exec(`
		UPDATE loans
		SET returned_at = CURRENT_TIMESTAMP
		WHERE id = ?
		AND user_name = ?
		AND returned_at IS NULL
	`, loanID, userName)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("δεν βρέθηκε ενεργός δανεισμός")
	}
	return nil
}

func GetLoans(db *sql.DB, userName string) ([]models.Loan, error) {
	var query string
	var rows *sql.Rows
	var err error

	if userName != "" {
		query = `
		SELECT l.id, l.user_name, l.book_id, b.title, l.borrowed_at, l.returned_at
		FROM loans l
		JOIN books b ON l.book_id = b.id
		WHERE l.user_name = ?
		ORDER BY (l.returned_at IS NOT NULL) ASC, l.borrowed_at DESC
		`
		rows, err = db.Query(query, userName)
	} else {
		query = `
		SELECT l.id, l.user_name, l.book_id, b.title, l.borrowed_at, l.returned_at
		FROM loans l
		JOIN books b ON l.book_id = b.id
		ORDER BY (l.returned_at IS NOT NULL) ASC, l.borrowed_at DESC
		`
		rows, err = db.Query(query)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var loans []models.Loan
	for rows.Next() {
		var loan models.Loan
		var returnedAt sql.NullString
		var title string
		if err := rows.Scan(&loan.Id, &loan.UserName, &loan.BookId, &title, &loan.BorrowedAt, &returnedAt); err != nil {
			return nil, err
		}
		if returnedAt.Valid {
			loan.ReturnedAt = &returnedAt.String
		}
		loans = append(loans, loan)
	}
	return loans, nil
}

func UpdateBook(db *sql.DB, id int, title string, author string, Total_copies int) error {
	query := `UPDATE books SET title = ?, author = ?, total_copies = ? WHERE id = ?`
	result, err := db.Exec(query, title, author, Total_copies, id)
	if err != nil {
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("book not found")
	}

	return nil
}

func DeleteBook(db *sql.DB, id int) error {
	query := `DELETE FROM books WHERE id = ?`
	result, err := db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("book with id %d not found", id)
	}

	return nil
}
