package main

import (
	"database/sql"
	"fmt"
	"library-api/db"
	"library-api/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	_ "modernc.org/sqlite"
)

var err error

func main() {
	fmt.Println("Library-Api")

	handlers.Database, err = sql.Open("sqlite", "library.database")
	if err != nil {
		fmt.Println("failed to open database:", err)
		return
	}
	defer handlers.Database.Close()

	err = db.Initdb(handlers.Database)
	if err != nil {
		fmt.Println("failed to initialize database:", err)
		return
	}

	router := gin.Default()
	router.Use(cors.Default())

	// --- Routes Βιβλίων ---
	router.GET("/api/books", handlers.BooksHandlers)
	router.POST("/api/books", handlers.AddBookHandler)
	router.PUT("/api/books/:id", handlers.UpdateBookHandler)
	router.DELETE("/api/books/:id", handlers.DeleteBookHandler)
	router.POST("/api/books/:id/borrow", handlers.BorrowHandlers)

	// --- Routes Δανεισμών ---
	router.GET("/api/loans", handlers.LoansHandlers)
	router.POST("/api/loans/:loanId/return", handlers.ReturnHandlers)

	fmt.Println("Database connected successfully! Server running on :5005")
	router.Run(":5005")
}
