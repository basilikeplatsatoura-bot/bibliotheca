package main

import (
	"database/sql"
	"fmt"
	"library-api/db"
	"library-api/handlers"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	_ "modernc.org/sqlite"
)

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "library.db"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "5005"
	}

	var err error
	handlers.Database, err = sql.Open("sqlite", dbPath)
	if err != nil {
		fmt.Println("failed to open database:", err)
		return
	}
	defer handlers.Database.Close()

	if err = db.Initdb(handlers.Database); err != nil {
		fmt.Println("failed to initialize database:", err)
		return
	}

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type", "Accept"},
	}))

	// --- Routes Ηλεκτρονικής Βιβλιοθήκης ---
	router.GET("/api/books", handlers.BooksHandlers)
	router.POST("/api/books", handlers.AddBookHandler)
	router.PUT("/api/books/:id", handlers.UpdateBookHandler)
	router.DELETE("/api/books/:id", handlers.DeleteBookHandler)
	router.GET("/api/categories", handlers.CategoriesHandler)

	fmt.Printf("Database connected (%s)! Server running on :%s\n", dbPath, port)
	if err := router.Run(":" + port); err != nil {
		fmt.Println("server error:", err)
	}
}
