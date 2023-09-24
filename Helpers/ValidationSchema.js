const Joi = require('@hapi/joi')
 
const authorizationSchema =Joi.object({
    email: Joi.string().email().lowercase(),
    password: Joi.string().min(2),
    username:Joi.string(),
    firstname:Joi.string()
})

module.exports = {
    authorizationSchema,
}

