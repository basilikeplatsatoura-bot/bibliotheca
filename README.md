# 📚 Bibliotheca — Προσωπική Ηλεκτρονική Βιβλιοθήκη

Πλήρης web εφαρμογή προσωπικής ηλεκτρονικής βιβλιοθήκης με **Go (Gin + SQLite)** στο backend και **React + TypeScript (Vite)** στο frontend.

## ✨ Λειτουργίες

- **Οργάνωση σε Κατηγορίες:** Παγκόσμια Λογοτεχνία, Ελληνική Λογοτεχνία, Ποίηση, Φιλοσοφία & Ψυχολογία, Πολιτική & Ιστορία, Underground & Beat.
- **Ράφια Ανάγνωσης & Αγαπημένα:** Κατάσταση ανάγνωσης (`Θέλω να διαβάσω`, `Διαβάζω τώρα`, `Διαβασμένο`) και Αγαπημένα.
- **Βαθμολογία & Σχόλια Ανάγνωσης:** 5 αστέρια σε κάθε βιβλίο και προσωπικές σημειώσεις/σκέψεις από την εμπειρία ανάγνωσης.
- **Αυτόματη Εύρεση Εξωφύλλου:** Αναζήτηση πραγματικού εξωφύλλου βιβλίου (Apple Books & Open Library) κατά την προσθήκη/επεξεργασία.
- **Σύγχρονο Responsive UI:** Midnight Navy & Electric Violet αισθητική, προβολή Grid / List, αναζήτηση σε τίτλους/συγγραφείς/σχόλια και ταξινόμηση.

## 🛠️ Τεχνολογίες

- **Backend:** Go, [Gin](https://github.com/gin-gonic/gin), SQLite (`modernc.org/sqlite`)
- **Frontend:** React 19, TypeScript, Vite

## 🚀 Εκκίνηση Project

### 1. Backend (Go API)

```bash
go mod tidy
go run .
```

Ο server ξεκινάει στο `http://localhost:5005` (`PORT` και `DB_PATH` υποστηρίζονται ως env variables).

Εκτέλεση tests:

```bash
go test ./...
```

### 2. Frontend (React + Vite)

```bash
cd library-ui
npm install
npm run dev
```

Η εφαρμογή ανοίγει στο `http://localhost:5173`.

## 📡 API Endpoints

| Μέθοδος | Endpoint | Περιγραφή |
| --- | --- | --- |
| `GET` | `/api/books?search=&category=&status=&favorite=true` | Λίστα βιβλίων με φιλτράρισμα & αναζήτηση |
| `POST` | `/api/books` | Προσθήκη νέου βιβλίου (με κατηγορία, αστέρια & σχόλιο) |
| `PUT` | `/api/books/:id` | Ενημέρωση στοιχείων, βαθμολογίας, σχολίου ή κατάστασης |
| `DELETE` | `/api/books/:id` | Αφαίρεση βιβλίου από τη βιβλιοθήκη |
| `GET` | `/api/categories` | Λίστα κατηγοριών με πλήθος βιβλίων |
