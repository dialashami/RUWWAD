
const Test = require('../models/text.model')

const getData =async(req, res) => {
    const data = await Test.find()
    res.json({data:data})
}




module.exports = {
    getData,
}