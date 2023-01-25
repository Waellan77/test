// Import models of sauces //
const Sauce = require('../models/sauces')

// Import of node.js module to access server files //
const fs = require('fs')

exports.createSauce = (req, res, next) => {
    // parse the request object //
    const sauceObject = JSON.parse(req.body.sauce)
    // delete _id and  _userId //
    delete sauceObject._id
    delete sauceObject._userId
    const sauce = new Sauce({
        ...sauceObject,
        // we replace the _userId extracted from the token by the authentication middleware //
        userId: req.auth.userId,
        // we generate the URL of the image //
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    })
    // sauce saved in the database //
    sauce.save()
        .then(() => { res.status(201).json({ message: 'Sauce enregistrée !' }) })
        .catch(error => { res.status(400).json({ error }) })
}

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body }

    delete sauceObject._userId
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Non-autorisé' })
            } else {
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
                    .catch(error => res.status(401).json({ error }))
            }
        })
        .catch((error) => {
            res.status(400).json({ error })
        })
}

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Non-autorisé' })
            } else {
                const filename = sauce.imageUrl.split('/images/')[1]
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => {
                        res.status(200).json({ message: 'Sauce supprimée !' })
                        fs.unlinkSync(`images/${filename}`)
                    })
                    .catch(error => res.status(401).json({ error }))
            }
        })
        .catch(error => {
            res.status(500).json({ error })
        })
}

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(404).json({ error }))
}

exports.getAllSauce = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }))
}

exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            // If usersLiked is empty and like = 1 //
            if (!sauce.usersLiked.includes(req.body.userId) && req.body.like === 1) {
                // Update BDD Sauce with likes and usersLiked //
                Sauce.updateOne(
                    { _id: req.params.id },
                    {
                        $inc: { likes: 1 },
                        $push: { usersLiked: req.body.userId }
                    }
                )
                    .then(() => res.status(201).json({ message: "Sauce liked" }))
                    .catch(error => res.status(400).json({ error }))
            }

            // If usersLiked is not empty and like = 0 (deletion of his vote) //
            if (sauce.usersLiked.includes(req.body.userId) && req.body.like === 0) {
                // Update BDD Sauce with likes and usersLiked //
                Sauce.updateOne(
                    { _id: req.params.id },
                    {
                        $inc: { likes: -1 },
                        $pull: { usersLiked: req.body.userId }
                    }
                )
                    .then(() => res.status(201).json({ message: "Like removed" }))
                    .catch(error => res.status(400).json({ error }))
            }

            // If usersDisliked is empty and like = -1 (dislikes = 1) //
            if (!sauce.usersDisliked.includes(req.body.userId) && req.body.like === -1) {
                // Update BDD Sauce with dislikes and usersDisliked //
                Sauce.updateOne(
                    { _id: req.params.id },
                    {
                        $inc: { dislikes: 1 },
                        $push: { usersDisliked: req.body.userId }
                    }
                )
                    .then(() => res.status(201).json({ message: "Sauce disliked" }))
                    .catch(error => res.status(400).json({ error }))
            }

            // If usersDisliked is not empty and dislikes = 0 (deletion of his vote) //
            if (sauce.usersDisliked.includes(req.body.userId) && req.body.like === 0) {
                // Update BDD Sauce with dislikes and usersLiked //
                Sauce.updateOne(
                    { _id: req.params.id },
                    {
                        $inc: { dislikes: -1 },
                        $pull: { usersDisliked: req.body.userId }
                    }
                )
                    .then(() => res.status(201).json({ message: "Dislike removed" }))
                    .catch(error => res.status(400).json({ error }))
            }
        }
        )
        .catch(error => res.status(401).json({ error }))
}


