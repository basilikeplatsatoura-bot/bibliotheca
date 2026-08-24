package handlers

import (
	"library-api/db"
	"net/http"

	"github.com/gin-gonic/gin"
)

func LoansHandlers(c *gin.Context) {
	// diabazoyme to username apo tu url
	userName := c.Query("userName")

	/*if userName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "userName parameter is required",
		})
		return
	}*/

	//kaloyme thn bash me ayto to username
	loans, err := db.GetLoans(Database, userName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.IndentedJSON(http.StatusOK, loans)
}
