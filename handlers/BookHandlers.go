package handlers

import (
	"database/sql"
	"errors"
	"library-api/db"
	"library-api/models"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

var Database *sql.DB

type BookInput struct {
	Title      string `json:"title" binding:"required"`
	Author     string `json:"author" binding:"required"`
	Category   string `json:"category"`
	Status     string `json:"status"`
	Rating     int    `json:"rating"`
	IsFavorite bool   `json:"is_favorite"`
	Notes      string `json:"notes"`
	CoverURL   string `json:"cover_url"`
}

func BooksHandlers(c *gin.Context) {
	search := c.Query("search")
	category := c.Query("category")
	status := c.Query("status")
	favoriteOnly := c.Query("favorite") == "true"

	books, err := db.GetBooks(Database, search, category, status, favoriteOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Αποτυχία φόρτωσης βιβλίων"})
		return
	}
	c.JSON(http.StatusOK, books)
}

func CategoriesHandler(c *gin.Context) {
	categories, err := db.GetCategories(Database)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Αποτυχία φόρτωσης κατηγοριών"})
		return
	}
	c.JSON(http.StatusOK, categories)
}

func AddBookHandler(c *gin.Context) {
	var input BookInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ο τίτλος και ο συγγραφέας είναι υποχρεωτικά πεδία"})
		return
	}

	title := strings.TrimSpace(input.Title)
	author := strings.TrimSpace(input.Author)
	if title == "" || author == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ο τίτλος και ο συγγραφέας δεν μπορούν να είναι κενά"})
		return
	}

	created, err := db.AddBook(Database, models.Book{
		Title:      title,
		Author:     author,
		Category:   strings.TrimSpace(input.Category),
		Status:     strings.TrimSpace(input.Status),
		Rating:     input.Rating,
		IsFavorite: input.IsFavorite,
		Notes:      strings.TrimSpace(input.Notes),
		CoverURL:   strings.TrimSpace(input.CoverURL),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Αποτυχία προσθήκης βιβλίου"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Το βιβλίο προστέθηκε με επιτυχία",
		"book":    created,
	})
}

func UpdateBookHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Μη έγκυρο ID βιβλίου"})
		return
	}

	var input BookInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ο τίτλος και ο συγγραφέας είναι υποχρεωτικά πεδία"})
		return
	}

	title := strings.TrimSpace(input.Title)
	author := strings.TrimSpace(input.Author)
	if title == "" || author == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ο τίτλος και ο συγγραφέας δεν μπορούν να είναι κενά"})
		return
	}

	updated, err := db.UpdateBook(Database, id, models.Book{
		Title:      title,
		Author:     author,
		Category:   strings.TrimSpace(input.Category),
		Status:     strings.TrimSpace(input.Status),
		Rating:     input.Rating,
		IsFavorite: input.IsFavorite,
		Notes:      strings.TrimSpace(input.Notes),
		CoverURL:   strings.TrimSpace(input.CoverURL),
	})
	if err != nil {
		if errors.Is(err, db.ErrBookNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Αποτυχία ενημέρωσης βιβλίου"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Το βιβλίο ενημερώθηκε με επιτυχία",
		"book":    updated,
	})
}

func DeleteBookHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Μη έγκυρο ID βιβλίου"})
		return
	}

	err = db.DeleteBook(Database, id)
	if err != nil {
		if errors.Is(err, db.ErrBookNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Αποτυχία διαγραφής βιβλίου"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Το βιβλίο διαγράφηκε με επιτυχία"})
}
