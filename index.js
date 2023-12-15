require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const fs = require('fs');
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

function dataManagement(action, input) {
  const filePath = './public/data.json';

  if (!fs.existsSync(filePath)) {
    fs.closeSync(fs.openSync(filePath, 'w'));
  }

  const file = fs.readFileSync(filePath);

  if (action === 'save data' && input != null) {
    const data = file.length === 0 ? [] : JSON.parse(file.toString());

    const inputExist = data.map(d => d.original_url);
    const checkInput = inputExist.includes(input.original_url);

    if (!checkInput) {
      data.push(input);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
  } else if (action === 'load data' && input == null) {
    return file.length === 0 ? [] : JSON.parse(file);
  }
}

function genShortUrl() {
  const allData = dataManagement('load data');
  const min = 1;
  const max = allData ? allData.length * 1000 : 1000;
  const short = Math.ceil(Math.random() * (max - min + 1) + min);

  if (!allData || !allData.map) {
    return short;
  }

  const shortExist = allData.map(d => d.short_url);
  const checkShort = shortExist.includes(short);

  return checkShort ? genShortUrl() : short;
}

app.post('/api/shorturl', (req, res) => {
  const input = req.body.url;

  if (!input) {
    return res.json({ error: 'invalid url' });
  }

  const domain = input.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/igm);
  const param = domain[0].replace(/^https?:\/\//i, "");

  dns.lookup(param, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const short = genShortUrl();
    const dict = { original_url: input, short_url: short };
    dataManagement('save data', dict);
    return res.json(dict);
  });
});

app.get('/api/shorturl/:shorturl', (req, res) => {
  const input = Number(req.params.shorturl);
  const allData = dataManagement('load data');

  if (!allData || !allData.map) {
    return res.json({ data: 'No matching data', short: input, existing: [] });
  }

  const shortExist = allData.map(d => d.short_url);
  const checkShort = shortExist.includes(input);

  if (checkShort) {
    const dataFound = allData[shortExist.indexOf(input)];
    return res.redirect(dataFound.original_url);
  } else {
    return res.json({ data: 'No matching data', short: input, existing: shortExist });
  }
});

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

