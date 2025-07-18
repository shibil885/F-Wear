const mongoose = require('mongoose');

const validateObjectId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).render('error', {
                title: 'Page Not Found',
                message: 'The page you are looking for does not exist.',
                url: req.originalUrl
            });
        }
        next();
    };
};

module.exports = validateObjectId;
