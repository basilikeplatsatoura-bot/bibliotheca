package models

type Loan struct {
	Id         int
	UserName   string
	BookId     int
	BorrowedAt string
	ReturnedAt *string
}
