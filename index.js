import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import env from "dotenv";

const app=express();
const port =3000;
env.config();
const db=new pg.Client({
    user:process.env.PG_USER,
    host:process.env.PG_HOST,
    database:process.env.PG_DATABASE,
    password:process.env.PG_PASSWORD,
    port:process.env.PG_PORT,
})

db.connect();

function showAlert(msg) {
    window.alert(msg)
}

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.get('/', async (req,res)=>{
    const dataset_asc= await db.query('select * from book_data order by book_id asc');
    res.render('home.ejs',{
        database:dataset_asc.rows,
        activePage:'home'
    });
})
app.get('/add',(req,res)=>{
    res.render('add.ejs',{activePage:'add'});
})
app.post('/sortingWay',async (req,res)=>{
    const dataset_asc= await db.query('select * from book_data order by book_id asc');
    const dataset_desc=await db.query('select * from book_data order by book_id desc');
    const dataset_rate=await db.query('select * from book_data order by rating desc');
    const selectedOption=req.body.sortingOption;
    //console.log(selectedOption);
    
    if(selectedOption==='asc'){
        res.render('home.ejs',{
            database:dataset_asc.rows,
            activePage:'home'
        })
    }else if(selectedOption==='desc'){
        res.render('home.ejs',{
            database:dataset_desc.rows,
            activePage:'home'
        })
    }else if(selectedOption==='rate'){
        res.render('home.ejs',{
            database:dataset_rate.rows,
            activePage:'home'
        })
    }
})
app.get(`/edit/:id`,async (req,res)=>{
    const id=req.params.id;
    try {
        const specific_data= await db.query('select title,review,rating from book_data where book_id=$1',[id]);
        res.render('edit.ejs',{
            data:specific_data.rows[0],
            id:id,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
})
app.post('/edit/:id', async (req, res) => {
    const id = req.params.id;
    const { review, rating } = req.body;

    try {
        await db.query(
            'UPDATE book_data SET review = $1, rating = $2 WHERE book_id = $3',
            [review, rating, id]
        );
        res.redirect('/'); // Redirect back to the home page
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});
app.post('/add', async (req,res)=>{
    const book_title=req.body.title;
    const book_review=req.body.review;
    const book_rating=req.body.rating;
    try{
        const response=await axios.get(`https://openlibrary.org/search.json?q=${book_title}`);
        const result=response.data;
        if(result.numFound==0){
            console.log('No such book exists');
            showAlert('No such book exists');
            res.redirect('/add');
        }else{
            const book_cover_link=`https://covers.openlibrary.org/b/olid/${result.docs[0].cover_edition_key}`;
            await db.query(`insert into book_data (title,review,rating,cover_img) values ($1,$2,$3,$4)`,[result.docs[0].title,book_review,book_rating,book_cover_link]);
            res.redirect('/');
        }
    }catch (err){
        console.log(err);
    }
})
app.get('/delete/:id', async(req,res)=>{
    const del_id=req.params.id;
    try {
        await db.query(`delete from book_data where book_id=$1`,[del_id]);  
        res.redirect('/'); 
    } catch (error) {
        console.log(error);
    }
})
app.listen(port,()=>{
    console.log(`Server running on http://localhost:${port}`);
});