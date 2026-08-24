package handlers

import (
	"database/sql"
	"library-api/db"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

var Database *sql.DB

type BorrowInput struct {
	UserName string `json:"userName" binding:"required"`
}

func BooksHandlers(c *gin.Context) {

	books, err := db.GetBooks(Database)
	if err != nil {
		c.JSON(500, gin.H{
			"error": err.Error(),
		})
		return
	}
	c.IndentedJSON(200, books)

}
func BorrowHandlers(c *gin.Context) {

	//to id
	bookIDStr := c.Param("id")
	bookId, err := strconv.Atoi(bookIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	//to name
	/*username := c.Param("user_name")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username is required"})
		return
	}*/
	var input BorrowInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userName is required"})
		return
	}

	//borrow
	err = db.BorrowBook(Database, input.UserName, bookId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message": "to biblio daneisthke me epityxia",
	})
}

/*
func ReturnHandlers(c *gin.Context) {

	bookIDStr := c.Param("id")
	bookId, err := strconv.Atoi(bookIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	//to name
	username := c.Param("user_name")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username is required"})
		return
	}

	err = db.ReturnBook(Database, username, bookId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message": "to biblio epistrafhke me epityxia",
	})

}
*/
func ReturnHandlers(c *gin.Context) {
	loanIDStr := c.Param("loanId")
	loanId, err := strconv.Atoi(loanIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid loan ID"})
		return
	}
	/*user_name := c.Param("user_name")
	if user_name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username is required"})
		return
	}*/
	var input BorrowInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userName is required"})
		return
	}
	// Καλούμε τη ReturnBook περνώντας 1ο το loanId και 2ο το user_name
	err = db.ReturnBook(Database, loanId, input.UserName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "to biblio epistrafhke me epityxia",
	})
}

type UpdateBookInput struct {
	Title       string `json:"title" binding:"required"`
	Author      string `json:"author" binding:"required"`
	TotalCopies int    `json:"total_copies" binding:"required"`
}

func UpdateBookHandler(c *gin.Context) {
	// 1. Παίρνουμε το ID του βιβλίου από το URL
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	var input UpdateBookInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and Author are required"})
		return
	}

	err = db.UpdateBook(Database, id, input.Title, input.Author, input.TotalCopies)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "to biblio enhmerwthke me epityxia"})
}
func DeleteBookHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	err = db.DeleteBook(Database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "to biblio diagrafhke me epityxia"})
}

type CreateBookInput struct {
	Title       string `json:"title" binding:"required"`
	Author      string `json:"author" binding:"required"`
	TotalCopies int    `json:"total_copies" binding:"required"`
}

func AddBookHandler(c *gin.Context) {
	var input CreateBookInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title, author, and total_copies are required"})
		return
	}

	err := db.AddBook(Database, input.Title, input.Author, input.TotalCopies)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "to biblio prosthethke me epityxia"})
}
