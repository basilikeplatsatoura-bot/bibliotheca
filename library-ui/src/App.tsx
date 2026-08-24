import { useState } from 'react';
import Catalog from './pages/Catalog';
import Loans from './pages/Loans';

export function App() {
  const [userName, setUserName] = useState('Vasiliki');
  const [currentPage, setCurrentPage] = useState<'catalog' | 'loans'>('catalog');

  return (
    <div style={{ backgroundColor: '#f4ebd0', minHeight: '100vh', color: '#2b2118', fontFamily: 'Georgia, serif' }}>
      {/* VINTAGE NAVBAR */}
      <nav 
        style={{ 
          padding: '1rem 2rem', 
          backgroundColor: '#2c1810', 
          color: '#f4ebd0', 
          display: 'flex', 
          gap: '1.5rem', 
          alignItems: 'center',
          borderBottom: '3px solid #c8a27c',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)'
        }}
      >
        <button 
          onClick={() => setCurrentPage('catalog')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: currentPage === 'catalog' ? '#c8a27c' : '#f4ebd0', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '18px',
            fontFamily: 'Georgia, serif'
          }}
        >
          📚 Κατάλογος
        </button>
        <button 
          onClick={() => setCurrentPage('loans')} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: currentPage === 'loans' ? '#c8a27c' : '#f4ebd0', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '18px',
            fontFamily: 'Georgia, serif'
          }}
        >
          📋 Οι Δανεισμοί μου
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: '#c8a27c' }}>✍️ Χρήστης:</label>
          <input 
            type="text" 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)} 
            style={{ 
              padding: '0.4rem 0.6rem', 
              borderRadius: '4px', 
              border: '1px solid #c8a27c',
              backgroundColor: '#fdfbf7',
              color: '#2b2118',
              fontFamily: 'Georgia, serif'
            }}
          />
        </div>
      </nav>

      {/* ΣΕΛΙΔΕΣ ΜΕΣΑ ΣΕ CONTAINER */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {currentPage === 'catalog' ? <Catalog userName={userName} /> : <Loans userName={userName} />}
      </main>
    </div>
  );
}

export default App;

