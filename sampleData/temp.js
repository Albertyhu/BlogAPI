function (comment, callback) {
    if (typeof comment.post != 'undefined' && comment.post != null && comment.post != "") {
        Post.findByIdandUpdate(comment.post, {
            $pull: { comments: req.params.id }
        })
            .then(() => {
                console.log("Removed comment ObjectId from Post")
                callback(null, comment)
            })
            .catch(error => {
                callback(error)
            })
    }
   if (typeof comment.userPhoto != 'undefined' && comment.userPhoto != null && comment.userPhoto != "") {
        UserPhoto.findByIdAndUpdate(comment.userPHoto, {
            $pull: { comments: req.params.id }
        })
            .then(() => {
                console.log("Removed comment ObjectId from user's photo")
                callback(null, comment)
            })
            .catch(error => {
                callback(error)
            })
    }
    else
        callback(null, comment)
},