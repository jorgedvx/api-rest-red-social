const {Schema, model} = require("mongoose")
const mongoosePaginate = require("mongoose-paginate-v2")



const userSchema = Schema({
    name:{
        type: String,
        required: true
    },

    surname: String,
    bio: String,
    nick:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required:true
    },
    role:{
        type: String,
        default: "role_user"
    },
    image:{
        type: String,
        default:"default.png"
    },
    public_id:{
        type: String
    },
    secure_url:{
        type: String
    },
    created_at:{
        type: Date,
        default: Date.now

    }


})

userSchema.plugin(mongoosePaginate);

module.exports = model("User",userSchema, "users")