//jshint esversion:6
import {USERNAME, PASSWORD} from "./secret";
const express = require("express");
const _ = require("lodash");
 

//const date = require(__dirname + "/date.js");

//1 install and require mongoose
const mongoose = require("mongoose");

const app = express();

// to use ejs
app.set('view engine', 'ejs');

//for route params
app.use(express.urlencoded({ extended: true }));

// for our static files such as css or images
app.use(express.static("public"));

//2 create a url to connect with our db
const URL = `mongodb+srv://${USERNAME}:${PASSWORD}@cluster0.hxqnm.mongodb.net`;

//3 connect to our DB
mongoose.connect(`${URL}/todoListDB`, 
    {
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    }
);

//4 create a schema
const todoItemSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    }
});

//listSchema
const listSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        require: true
    },
    items: [todoItemSchema]
});

//5 create a model using the above schema
const TodoItemModel = mongoose.model("todoItem", todoItemSchema);

const ListModel = mongoose.model("List", listSchema); 

//6 create some records
const veggies = new TodoItemModel({
    name: "Bring Veggies"
});

const yoga = new TodoItemModel({
    name: "Do Yoga!"
});

const study = new TodoItemModel({
    name: "Algorithms"
});

//create an array to store the default values
const todoDefaultArray = [veggies, yoga, study];


app.get("/", function (req, res) {

    TodoItemModel.find({}, (err, foundItems) =>{

        if (foundItems.length === 0) {
            //insert records
            TodoItemModel.insertMany(todoDefaultArray, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully inserted the default records in our DB.");
                    res.redirect("/");
                }
            });
            
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }  
    });
});

app.post("/", function (req, res) {

    const newItem = req.body.newItem;
    const listName = req.body.list;

    const item = new TodoItemModel({
        name: newItem
    });

    if(listName === "Today"){
        item.save();
        console.log("Added one item..");
        res.redirect("/");    
    }
    else{
        ListModel.findOne({name: listName}, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            console.log("Added one item..");
            res.redirect("/" + listName);
        } )
    }
});


app.post("/delete", (req, res)=> {
    
    const todoIDtobeRemoved = req.body.checkbox;
    const listName = req.body.listName; 
    
    if(listName === "Today"){
        TodoItemModel.findByIdAndDelete( todoIDtobeRemoved, (err) =>{
            if (err) {
                console.log(err);
            } else {
                console.log(`Successfully deleted ${todoIDtobeRemoved} item.`);
                res.redirect("/");
            }
        });
    }
    else{
        ListModel.findOneAndUpdate({name: listName}, {$pull: {items: {_id: todoIDtobeRemoved}}}, (err,data)=>{
            if(!err){
                console.log("Successfully deleted the item....");
                res.redirect(`/${listName}`);
            }
        });
    }
});

app.get("/:customListName", (req, res)=>{
    const customLName = _.capitalize(req.params.customListName);

    ListModel.findOne({name: customLName}, (err, foundList)=>{

        if(!err){
            if(!foundList){
                //create a new list
                const list = new ListModel({
                    name: customLName,
                    items: []
                });
            
                list.save();
                console.log("Created a new todo list.");
                res.redirect("/" + customLName);
            }
            else{
                //show an existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
            }
        }
    });

   
});


app.listen(3000, function () {
    console.log("Server started on port 3000");
});

