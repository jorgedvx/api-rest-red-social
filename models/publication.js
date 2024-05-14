const {Schema, model} = require("mongoose");
const Paginate = require("mongoose-paginate-v2")


const PublicationSchema = Schema({
    user:{
        type: Schema.ObjectId,
        ref: "User"

    },
    text:{
        type: String,
        required: true
    },
    file: String,
    created_at: {
        type: Date,
        default: Date.now
    }

})

PublicationSchema.plugin(Paginate);


module.exports =model("Publication",PublicationSchema,"publications")