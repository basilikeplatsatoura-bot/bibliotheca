package models

type Book struct {
	Id           int
	Title        string
	Author       string
	Isbn         float32
	Total_copies int
}

/*[
    {
        "Id": 1,
        "Title": "Post Office",
        "Author": "Charles Bukowski",
        "Isbn": 0,
        "Total_copies": 5
    },
    {
        "Id": 2,
        "Title": "Foco d'amor",
        "Author": "Vasilis Vasilikos",
        "Isbn": 0,
        "Total_copies": 3
    },
    {
        "Id": 3,
        "Title": "Madame Bovary",
        "Author": "Gustave Flaubert",
        "Isbn": 0,
        "Total_copies": 2
    },
    {
        "Id": 4,
        "Title": "Η αγάπη άργησε μια μέρα",
        "Author": "Λιλή Ζωγράφου",
        "Isbn": 0,
        "Total_copies": 3
    },
    {
        "Id": 5,
        "Title": "The Dispossessed",
        "Author": "Ursula K. Le Guin",
        "Isbn": 0,
        "Total_copies": 4
    }
] */
