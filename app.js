'use strict';

const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const methodOverride = require('method-override')
const cors = require('cors')

const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 3000 ;


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/',homePage)
app.get('/allCountries',allCountries)
app.get('/getCountryResult',getData)
app.post('/addRecords',addRecord)
app.get('/myRecords',recordsRender)
app.get('/recordDetails/:id',recordDetails)
app.get('/recordDetails/:id',recordDetails)
app.delete('/delete/:id',deleteRecord)
app.put('/updateRecord/:id',updateRecord)
function Country(data) {
  this.Country = data.Country;
  this.Date = data.Date.slice(0,10);
  this.TotalConfirmed = data.TotalConfirmed;
  this.TotalDeaths = data.TotalDeaths;
  this.TotalRecovered = data.TotalRecovered;

}
function updateRecord(req,res) {
//   res.send(req.body)
  let SQL = 'UPDATE  countries SET country=$1,date=$2,totalconfirmed=$3,totaldeaths=$4,totalrecovered=$5 WHERE id=$6;';
  let safeValues=[req.body.country,req.body.date,req.body.totalconfirmed,req.body.totaldeaths,req.body.totalrecovered,req.params.id];
  client.query(SQL,safeValues)
    .then(()=>{
      res.redirect('back');
    })
}
function deleteRecord(req,res) {
  let SQL = 'DELETE FROM countries WHERE id=$1;';
  let safeValue = [req.params.id];
  client.query(SQL,safeValue)
    .then(()=>{
      res.redirect('/myRecords')
    })
}
function recordDetails(req,res) {
  client.query(`SELECT * FROM countries WHERE id = ${req.params.id}`)
    .then((data)=>{
      res.render('details',{data:data.rows[0]})
    })
}
function recordsRender(req,res) {
  client.query('SELECT * FROM countries;')
    .then(data=>{
      res.render('myRecords',{data:data.rows})
    })
}
function addRecord(req,res) {
  console.log(req.body)
  let SQL = `INSERT INTO countries (country,date,totalconfirmed,totaldeaths,totalrecovered) VALUES ($1,$2,$3,$4,$5);`;
  let safeValues = [req.body.Country,req.body.Date,req.body.TotalConfirmed,req.body.TotalDeaths,req.body.TotalRecovered];
  client.query(SQL,safeValues)
    .then(()=>{
      res.redirect('/myRecords');
    })

}

function allCountries(req,res) {
  superagent.get('https://api.covid19api.com/summary')
    .then((data)=>{
      // res.send(data.body)
      let countries =  data.body.Countries.map(val=>{
        return new Country (val)
      })
      res.render('allCountries',{countries:countries})
    })
}
function getData(req,res) {
  let URL = `https://api.covid19api.com/country/${req.query.country}/status/confirmed?from=${req.query.from}&to=${req.query.to}`;
  superagent.get(URL)
    .then(data=>{
      res.render('result',{data:data.body})
    })
    .catch(err=>{console.log(err)})
}
function homePage(req,res){
  superagent.get('https://api.covid19api.com/world/total')
    .then((data)=>{
      res.render('home',{data:data.body})
    })
}

client.connect()
  .then(()=>{
    app.listen(PORT,()=>{console.log(`listening on ${PORT}`)})
  })
