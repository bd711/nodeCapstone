///////// dailylistrouter.js

const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const { DATABASE_URL, PORT } = require('./config');
const { dailylist } = require('./app/models/dailylists');

const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

mongoose.Promise = global.Promise;


app.get('/dailylist', (req, res) => {
    dailylist
        .find()
        .exec()
        .then(posts => {
            res.json(posts.map(post => post.apiRepr()));
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'This did not work' });
        });
});

app.get('/dailylist/:id', (req, res) => {
    dailylist
        .findById(req.params.id)
        .exec()
        .then(post => res.json(post.apiRepr()))
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'This really did not work' });
        });
});

app.post('/dailylist', (req, res) => {
    const requiredFields = ['date', 'userID', 'symptoms'];
    requiredFields.forEach(field => {
        if (!(field in req.body)) {
            res.status(400).json({ error: `Missing "${field}" in request body` });
        }
    });

    dailylist
        .create({
            date: req.date,
            userID: req.user._id,
            id: req.id,
            symptoms: req.symptoms.checked // how to call the ones that are checked?? 
        })
        .then(dailylist => res.status(201).json(dailylist.apiRepr()))
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went wrong' });
        });

});


app.delete('/dailylist/:id', (req, res) => {
    dailylist
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(() => {
            res.status(204).json({ message: 'success' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'something went terribly wrong' });
        });
});


app.put('/dailylist/:id', (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({
            error: 'Request path id and request body id values must match'
        }); /// this is very complicated? what does this do? 
    }

    const updated = {};
    const updateableFields = ['date', 'userID', 'symptoms'];
    updateableFields.forEach(field => {
        if (field in req.body) {
            updated[field] = req.body[field];
        }
    });

    dailylist
        .findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
        .exec()
        .then(updatedPost => res.status(201).json(updatedPost.apiRepr())) // updated post the right command?
        .catch(err => res.status(500).json({ message: 'Something went wrong' }));
});


app.delete('/:id', (req, res) => {
    dailylist
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(() => {
            console.log(`Deleted entry with id \`${req.params.ID}\``);
            res.status(204).end();
        });
});


app.use('*', function(req, res) {
    res.status(404).json({ message: 'Not Found' });
});

let server;

function runServer(databaseUrl = DATABASE_URL, port = PORT) { // add info here
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
            if (err) {
                return reject(err);
            }
            server = app.listen(port, (8080) => { // add port?? 
                    console.log(`Your app is listening on port ${port}`);
                    resolve();
                })
                .on('error', err => {
                    mongoose.disconnect();
                    reject(err);
                });
        });
    });
}


function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('Closing server');
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

if (require.main === module) {
    runServer().catch(err => console.error(err));
};

module.exports = { runServer, app, closeServer };
