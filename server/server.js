// Budget API

const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.static('public'));


const fs = require('fs');
const path = require('path');

const budgetDataPath = path.join(__dirname, 'budget-data.json');

function getBudgetData() {
    try {
        const data = fs.readFileSync(budgetDataPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading budget-data.json:', err);
        return { myBudget: [] };
    }
}


app.get('/budget', (req, res) => {
    const budget = getBudgetData();
    res.json(budget);
});

app.listen(port, () => {
    console.log(`API served at http://localhost:${port}`);
});