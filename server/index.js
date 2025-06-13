const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 3001;

let allDrawsCache = null;

const fetchDraws = async () => {
  if (!allDrawsCache) {
    const { data } = await axios.get('https://euromillions.api.pedromealha.dev/v1/draws');
    allDrawsCache = data.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

app.get('/api/draws', async (req, res) => {
  try {
    await fetchDraws();
    const { from, to, page = 1, limit = 10 } = req.query;
    let filtered = allDrawsCache;

    if (from) filtered = filtered.filter(draw => new Date(draw.date) >= new Date(from));
    if (to) filtered = filtered.filter(draw => new Date(draw.date) <= new Date(to));

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + parseInt(limit));

    res.json({ total: filtered.length, draws: paginated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch draws' });
  }
});

app.get('/api/statistics', async (req, res) => {
  try {
    await fetchDraws();

    const numberFreq = Array(51).fill(0);
    const starFreq = Array(13).fill(0);
    const comboFreqMap = new Map();

    allDrawsCache.forEach(({ numbers, stars }) => {
      numbers.forEach(n => numberFreq[n]++);
      stars.forEach(s => starFreq[s]++);

      const key = JSON.stringify({ numbers: [...numbers].sort(), stars: [...stars].sort() });
      comboFreqMap.set(key, (comboFreqMap.get(key) || 0) + 1);
    });

    const topNumbers = numberFreq.map((freq, number) => ({ number, freq }))
      .filter(n => n.number > 0)
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 15);

    const topStars = starFreq.map((freq, number) => ({ number, freq }))
      .filter(s => s.number > 0)
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 5);

    const comboStats = Array.from(comboFreqMap.entries()).map(([combo, freq]) => ({
      ...JSON.parse(combo),
      freq
    })).sort((a, b) => b.freq - a.freq);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const start = (page - 1) * limit;
    const paginatedCombos = comboStats.slice(start, start + limit);

    res.json({
      mostFrequentNumbers: topNumbers,
      mostFrequentStars: topStars,
      comboStats: paginatedCombos,
      totalCombos: comboStats.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Error computing statistics' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));