import { useEffect, useState } from 'react';
import './App.css';

function generateFlash(frequentNumbers, frequentStars, existingDraws, excludeOldCombos) {
  const numbers = [];
  const stars = [];

  while (numbers.length < 5) {
    const pick = frequentNumbers[Math.floor(Math.random() * frequentNumbers.length)].number;
    if (!numbers.includes(pick)) numbers.push(pick);
  }

  while (stars.length < 2) {
    const pick = frequentStars[Math.floor(Math.random() * frequentStars.length)].number;
    if (!stars.includes(pick)) stars.push(pick);
  }

  if (excludeOldCombos) {
    const exists = existingDraws.some(draw => {
      return (
        JSON.stringify([...draw.numbers].sort()) === JSON.stringify([...numbers].sort()) &&
        JSON.stringify([...draw.stars].sort()) === JSON.stringify([...stars].sort())
      );
    });
    if (exists) return generateFlash(frequentNumbers, frequentStars, existingDraws, true);
  }

  return { numbers, stars };
}

function App() {
  const [tab, setTab] = useState('flashes');
  const [draws, setDraws] = useState([]);
  const [stats, setStats] = useState(null);
  const [flashes, setFlashes] = useState([]);
  const [excludeOld, setExcludeOld] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortedCombos, setSortedCombos] = useState([]);
  const [comboPage, setComboPage] = useState(1);
  const [drawPage, setDrawPage] = useState(1);
  const [comboTotal, setComboTotal] = useState(0);
  const [drawTotal, setDrawTotal] = useState(0);
  const [flashCount, setFlashCount] = useState(5);

  const fetchDraws = () => {
    const url = new URL('https://euromillions-analyzer.onrender.com/api/draws');
    if (fromDate) url.searchParams.set('from', fromDate);
    if (toDate) url.searchParams.set('to', toDate);
    url.searchParams.set('page', drawPage);
    url.searchParams.set('limit', 10);

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setDraws(data.draws);
        setDrawTotal(data.total);
      });
  };

  const fetchStats = () => {
    fetch(`https://euromillions-analyzer.onrender.com/api/statistics?page=${comboPage}&limit=10`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setSortedCombos(data.comboStats);
        setComboTotal(data.totalCombos);
      });
  };

  useEffect(() => {
    fetchDraws();
  }, [drawPage]);

  useEffect(() => {
    fetchStats();
  }, [comboPage]);

  const generateFlashes = () => {
    if (!stats) return;
    const newFlashes = [];
    for (let i = 0; i < flashCount; i++) {
      newFlashes.push(generateFlash(stats.mostFrequentNumbers, stats.mostFrequentStars, draws, excludeOld));
    }
    setFlashes(newFlashes);
  };

  return (
    <div>
      <h1>Euromillions Analyzer 🎯</h1>

      <div>
        <button onClick={() => setTab('flashes')} style={{margin: '12px'}}>🎲 Flashs</button>
        <button onClick={() => setTab('draws')} style={{margin: '12px'}}>📅 Tirages</button>
        <button onClick={() => setTab('stats')} style={{margin: '12px'}}>📊 Statistiques</button>
      </div>

      {tab === 'flashes' && (
        <div>
          <h2>Générateur de Flashs</h2>
          <label>
            <input type="checkbox" checked={excludeOld} onChange={() => setExcludeOld(!excludeOld)} />
            Exclure les combinaisons déjà sorties
          </label>
          <br />
          <label>
            Nombre de Flashs : <input type="number" value={flashCount} min={1} max={20} onChange={e => setFlashCount(Number(e.target.value))} />
          </label>
          <button onClick={generateFlashes} style={{margin: '12px'}}>Générer les Flashs</button>
          <ul >
            {flashes.map((f, i) => (
              <li key={i}><strong>Flash {i + 1}</strong>: {f.numbers.join(', ')} ⭐ {f.stars.join(', ')}</li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'draws' && (
        <div>
          <h2>Filtrer les tirages</h2>
          <label style={{margin: '12px'}}>
            De : <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </label>
          <label style={{margin: '12px'}}>
            À : <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </label>
          <button onClick={() => { setDrawPage(1); fetchDraws(); }} style={{margin: '12px'}}>Filtrer</button>

          <h2>Historique des Tirages</h2>
          <ul>
            {draws.map(draw => (
              <li key={draw.date}><strong>{new Date(draw.date).toLocaleDateString()}</strong>: {draw.numbers.join(', ')} ⭐ {draw.stars.join(', ')}</li>
            ))}
          </ul>
          <div>
            Page {drawPage} / {Math.ceil(drawTotal / 10)}
            <button onClick={() => setDrawPage(p => Math.max(1, p - 1))} disabled={drawPage === 1} style={{margin: '12px'}}>Précédent</button>
            <button onClick={() => setDrawPage(p => p + 1)} disabled={drawPage * 10 >= drawTotal} style={{margin: '12px'}}>Suivant</button>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <h2>Classement des combinaisons gagnantes (par fréquence)</h2>
          <ul>
            {sortedCombos.map((combo, i) => (
              <li key={i}>
                {combo.numbers.join(', ')} ⭐ {combo.stars.join(', ')} — <strong>{combo.freq}</strong> fois
              </li>
            ))}
          </ul>
          <div>
            Page {comboPage} / {Math.ceil(comboTotal / 10)}
            <button onClick={() => setComboPage(p => Math.max(1, p - 1))} disabled={comboPage === 1} style={{margin: '12px'}}>Précédent</button>
            <button onClick={() => setComboPage(p => p + 1)} disabled={comboPage * 10 >= comboTotal} style={{margin: '12px'}}>Suivant</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;