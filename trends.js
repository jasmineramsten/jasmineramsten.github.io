const googleTrends = require('google-trends-api');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/get-trends', async (req, res) => {
    try {
        // Vi använder dailyTrends för bättre stabilitet
        const result = await googleTrends.dailyTrends({
            geo: 'SE',
        });
        
        const data = JSON.parse(result);
        // Vi hämtar sökorden från dagens lista
        const dayTrends = data.default.trendingSearchesDays[0].trendingSearches;
        
        const trends = dayTrends.slice(0, 10).map(item => ({
            keyword: item.title.query,
            status: item.formattedTraffic + " sökningar"
        }));
        
        res.json(trends);
    } catch (err) {
        console.error("Fel:", err);
        res.status(500).json({ error: "Google svarade inte, testa att starta om servern." });
    }
});

app.listen(3000, () => console.log('Trend-servern rullar på port 3000!'));const googleTrends = require('google-trends-api');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/get-trends', async (req, res) => {
    try {
        // Vi använder dailyTrends för bättre stabilitet
        const result = await googleTrends.dailyTrends({
            geo: 'SE',
        });
        
        const data = JSON.parse(result);
        // Vi hämtar sökorden från dagens lista
        const dayTrends = data.default.trendingSearchesDays[0].trendingSearches;
        
        const trends = dayTrends.slice(0, 10).map(item => ({
            keyword: item.title.query,
            status: item.formattedTraffic + " sökningar"
        }));
        
        res.json(trends);
    } catch (err) {
        console.error("Fel:", err);
        res.status(500).json({ error: "Google svarade inte, testa att starta om servern." });
    }
});

app.listen(3000, () => console.log('Trend-servern rullar på port 3000!'));