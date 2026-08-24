import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

interface LoansProps {
  userName: string;
}

export const Loans: React.FC<LoansProps> = ({ userName }) => {
  const [loans, setLoans] = useState<any[]>([]);
  const [booksMap, setBooksMap] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [loansData, booksData] = await Promise.all([
        api.getLoans(userName),
        api.getBooks('')
      ]);

      const map: { [key: number]: string } = {};
      const bookList = Array.isArray(booksData) ? booksData : (booksData?.books || []);
      
      bookList.forEach((b: any) => {
        const id = b.Id ?? b.id ?? b.ID;
        const title = b.Title ?? b.title;
        if (id !== undefined) {
          map[id] = title;
        }
      });

      setBooksMap(map);
      setLoans(loansData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userName]);

  const handleReturn = async (loan: any) => {
    // Παίρνουμε το `Id` (με κεφαλαίο I, μικρό d)
    const actualLoanId = loan.Id ?? loan.id ?? loan.ID ?? loan.loan_id;

    if (actualLoanId === undefined || actualLoanId === null) {
      alert('Σφάλμα: Δεν βρέθηκε το ID του δανεισμού!');
      return;
    }

    try {
      await api.returnBook(Number(actualLoanId), userName);
      alert('Το βιβλίο επιστράφηκε επιτυχώς!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Σφάλμα κατά την επιστροφή.');
    }
  };

  const activeLoans = loans.filter((l) => !(l.ReturnedAt || l.returned_at));
  const returnedLoans = loans.filter((l) => l.ReturnedAt || l.returned_at);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>📋 Οι Δανεισμοί μου</h1>
      <p>Χρήστης: <strong>{userName}</strong></p>

      {loading && <p>Φόρτωση...</p>}

      {!loading && (
        <>
          {/* ΕΝΕΡΓΟΙ ΔΑΝΕΙΣΜΟΙ */}
          <h2>🟡 Ενεργοί Δανεισμοί ({activeLoans.length})</h2>
          {activeLoans.length === 0 ? (
            <p>Δεν έχετε ενεργούς δανεισμούς.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {activeLoans.map((loan) => {
                const loanId = loan.Id ?? loan.id ?? loan.ID;
                const bookId = loan.BookId ?? loan.BookID ?? loan.book_id;
                const title = loan.Title ?? loan.title ?? booksMap[bookId] ?? `Βιβλίο #${bookId}`;
                const dateVal = loan.BorrowedAt ?? loan.borrowed_at;
                const formattedDate = dateVal ? new Date(dateVal).toLocaleString('el-GR') : 'Άγνωστη ημ/νία';

                return (
                  <div key={loanId} style={{ border: '1px solid #f59e0b', padding: '1rem', borderRadius: '8px', backgroundColor: '#fffbe1' }}>
                    <h3>📖 {title}</h3>
                    <p><small>Ημερομηνία Δανεισμού: {formattedDate}</small></p>
                    <button
                      onClick={() => handleReturn(loan)}
                      style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ↩️ Επιστροφή
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ΕΠΙΣΤΡΑΦΕΝΤΕΣ ΔΑΝΕΙΣΜΟΙ */}
          <h2>🟢 Ιστορικό Επιστροφών ({returnedLoans.length})</h2>
          {returnedLoans.length === 0 ? (
            <p>Δεν υπάρχουν παλαιότερες επιστροφές.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {returnedLoans.map((loan) => {
                const loanId = loan.Id ?? loan.id ?? loan.ID;
                const bookId = loan.BookId ?? loan.BookID ?? loan.book_id;
                const title = loan.Title ?? loan.title ?? booksMap[bookId] ?? `Βιβλίο #${bookId}`;
                const returnVal = loan.ReturnedAt ?? loan.returned_at;
                const formattedReturn = returnVal ? new Date(returnVal).toLocaleString('el-GR') : '-';

                return (
                  <div key={loanId} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', opacity: 0.7 }}>
                    <h3>📖 {title}</h3>
                    <p><small>Επιστράφηκε: {formattedReturn}</small></p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Loans;