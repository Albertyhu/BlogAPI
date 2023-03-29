const Tag = require('../model/tags');

//const putTagsFromPost = async (tags, postID) => {
//    const newTags = [];
//    const updateTags = [];
//    try {
//        const result = await Tag.find({})
//        const updateTags = result.filter(val => tags.some(obj => obj.name.trim() == val.name.trim()))
//        const newTags = result.filter(val => !tags.some(obj => obj.name.trim() == val.name.trim()))
//        if (newTags != null && newTags.length > 0) {
//            createNewTagsFromPost(newTags, postID);
//            updateTagsFromPost()
//        }
//        if (updateTags != null && updateTags.length > 0) {

//        }
//    } catch (e) {
//    }

//}

const putTagsFromPost = async (tags, postID) => {
    try {
        const operations = tags.map(item => {
            const updateDoc = {
                name: item.name
            }
            if (postID) {
                updateDoc.post = [...item.post, postID];  
            }
            return ({
                    updateOne: {
                        filter: { name: item.name },
                        update: {
                            $setOnInsert: updateDoc,
                        },
                        upsert: true
                    }
                })
            })
        await User.bulkWrite(operations)
            .then(result => {
                console.log(result)
            })
            .catch(error => {
                console.error(error);
            });
    } catch (e) {
        console.error(error);
    }
}

const createNewTags = async (tags) => {
    const inserted = tags.map(tag => {
        return {
            name: tag.name,
        }
    })
    await Tag.insertMany(inserted)
        .then(result => {
            console.log("New tags are successfully created and saved in database.")
        })
        .catch(e => {
            console.log("There is an error in creating new tags from post: ", e)
        })
}

const createNewTagsFromPost = async (tags, postID) => {
    const inserted = tags.map(tag => {
        return {
            name: tag.name,
            post: [postID],
        }
    })
    await Tag.insertMany(inserted)
        .then(result => {
            console.log("New tags are successfully created and saved in database.")
        })
        .catch(e => {
            console.log("There is an error in creating new tags from post: ", e)
        })
}

const updateTagsFromPost = async (tags, postID) => {
    const toUpdate = tags.map(tag => {
        return {
            name: tag.name,
            post: [...tag.post, postID],
        }
    })
    await Tag.updateMany(toUpdate)
        .then(result => {
            console.log("Tags are successfully updated in database.")
        })
        .catch(e => {
            console.log("There is an error in updating tags from post: ", e)
        })
}

module.exports = {
    putTagsFromPost,
    createNewTags,
    createNewTagsFromPost
}